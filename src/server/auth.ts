import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { auditLogs, profiles } from '../db/schema.ts';
import { adminAuth } from '../lib/firebase-admin.ts';

export type UserRole = 'user' | 'researcher' | 'admin';

export interface SafeProfile {
  id: string;
  fullName: string;
  email: string;
  authProvider: string;
  emailVerified: boolean;
  institution: string;
  researchInterest: string;
  avatarUrl: string;
  role: UserRole;
  isSuspended: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  profile?: SafeProfile;
}

// Primary workspace owner email gets initial admin role on first Google sign-in
const INITIAL_ADMIN_EMAIL = 'soumyadipnandy97@gmail.com';

const SESSION_SECRET =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

export function createSessionToken(userId: string, rememberMe = false): string {
  const exp = Date.now() + (rememberMe ? 14 : 1) * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ sub: userId, exp })).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `dsb.${payload}.${sig}`;
}

export function verifySessionToken(token: string): { sub: string; exp: number } | null {
  if (!token.startsWith('dsb.')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [, payload, sig] = parts;
  const expected = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub: string;
      exp: number;
    };
    if (!decoded.sub || typeof decoded.exp !== 'number' || Date.now() > decoded.exp) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function toSafeProfile(row: typeof profiles.$inferSelect): SafeProfile {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    authProvider: row.authProvider,
    emailVerified: row.emailVerified,
    institution: row.institution || '',
    researchInterest: row.researchInterest || 'Marine Biodiversity',
    avatarUrl: row.avatarUrl || '',
    role: (row.role as UserRole) || 'user',
    isSuspended: row.isSuspended,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getOrCreateFirebaseProfile(decoded: {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
}): Promise<SafeProfile> {
  const email = (decoded.email || `${decoded.uid}@users.local`).toLowerCase().trim();
  const displayName = decoded.name || email.split('@')[0] || 'Researcher';

  // Check if profile exists by ID or email
  const existingById = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, decoded.uid))
    .limit(1);

  if (existingById.length > 0) {
    const row = existingById[0];
    // Preserve role; update avatar/verification status if missing
    if (decoded.email_verified && !row.emailVerified) {
      const [updated] = await db
        .update(profiles)
        .set({
          emailVerified: true,
          avatarUrl: row.avatarUrl || decoded.picture || '',
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, row.id))
        .returning();
      return toSafeProfile(updated);
    }
    return toSafeProfile(row);
  }

  const existingByEmail = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1);

  if (existingByEmail.length > 0) {
    return toSafeProfile(existingByEmail[0]);
  }

  const assignedRole: UserRole =
    email === INITIAL_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';

  const [created] = await db
    .insert(profiles)
    .values({
      id: decoded.uid,
      fullName: displayName,
      email,
      authProvider: 'google',
      emailVerified: Boolean(decoded.email_verified ?? true),
      avatarUrl: decoded.picture || '',
      role: assignedRole,
      institution: '',
      researchInterest: 'Marine Biodiversity',
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        email,
        updatedAt: new Date(),
      },
    })
    .returning();

  return toSafeProfile(created);
}

export async function writeAuditLog(
  actorUserId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata: Record<string, unknown> = {}
) {
  try {
    await db.insert(auditLogs).values({
      actorUserId,
      action,
      targetType,
      targetId,
      metadata,
    });
  } catch (error) {
    console.error('Audit log write failed:', error);
  }
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ error: 'Authentication token missing.' });
  }

  try {
    let profile: SafeProfile | null = null;

    if (token.startsWith('dsb.')) {
      const payload = verifySessionToken(token);
      if (!payload) {
        return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
      }
      const rows = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, payload.sub))
        .limit(1);
      if (rows.length === 0) {
        return res.status(401).json({ error: 'Account not found.' });
      }
      profile = toSafeProfile(rows[0]);
    } else {
      const decodedToken = await adminAuth.verifyIdToken(token);
      profile = await getOrCreateFirebaseProfile(decodedToken);
    }

    if (profile.isSuspended) {
      return res.status(403).json({
        error: 'This account has been suspended by an administrator. Please contact support.',
      });
    }

    req.profile = profile;
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid authentication credentials.' });
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.profile) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (req.profile.role !== 'admin') {
    await writeAuditLog(req.profile.id, 'UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT', 'route', req.path, {
      email: req.profile.email,
      role: req.profile.role,
    });
    return res.status(403).json({ error: 'Forbidden: Administrator authorization required.' });
  }
  next();
};
