import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from './src/db/index.ts';
import {
  analysisJobs,
  auditLogs,
  biodiversityResults,
  chatMessages,
  contactMessages,
  datasets,
  profiles,
  sequences,
  systemSettings,
  taxonomyResults,
} from './src/db/schema.ts';
import {
  createSessionToken,
  hashPassword,
  requireAdmin,
  requireAuth,
  toSafeProfile,
  verifyPassword,
  writeAuditLog,
  type AuthRequest,
  type UserRole,
} from './src/server/auth.ts';
import {
  classifySequences,
  generateSampleDatasetFile,
  parseSequenceFile,
  REFERENCE_DATABASE_NAME,
} from './src/server/bioinformatics.ts';
import {
  askBioAIAssistant,
  type DatasetScientificContext,
} from './src/server/gemini.ts';

dotenv.config();

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

const STORAGE_ROOT = path.resolve(process.cwd(), 'storage', 'edna-datasets');
fs.mkdirSync(STORAGE_ROOT, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB per file
    files: 5,
  },
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_SAMPLE_TYPES = new Set([
  'Marine',
  'Freshwater',
  'Soil',
  'Terrestrial',
  'Other',
]);
const ALLOWED_ROLES = new Set<UserRole>(['user', 'researcher', 'admin']);

function validatePasswordStrength(password: string): string | null {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number.';
  }
  return null;
}

function saveDatasetFileConfined(
  userId: string,
  originalName: string,
  buffer: Buffer
): string {
  const safeUser = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeName = path
    .basename(originalName)
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120);
  const userDir = path.resolve(STORAGE_ROOT, safeUser);
  if (!userDir.startsWith(STORAGE_ROOT + path.sep)) {
    throw new Error('Invalid storage path.');
  }
  fs.mkdirSync(userDir, { recursive: true });
  const fileName = `${crypto.randomUUID()}_${safeName}`;
  const fullPath = path.resolve(userDir, fileName);
  if (!fullPath.startsWith(userDir + path.sep)) {
    throw new Error('Path confinement check failed.');
  }
  fs.writeFileSync(fullPath, buffer);
  return path.relative(STORAGE_ROOT, fullPath);
}

function removeDatasetFileConfined(relativePath: string) {
  if (!relativePath) return;
  try {
    const resolved = path.resolve(STORAGE_ROOT, relativePath);
    if (resolved.startsWith(STORAGE_ROOT + path.sep) && fs.existsSync(resolved)) {
      fs.unlinkSync(resolved);
    }
  } catch (err) {
    console.error('Failed to clean up dataset file:', err);
  }
}

async function runAnalysisPipeline(datasetId: number, userId: string) {
  const [job] = await db
    .insert(analysisJobs)
    .values({
      userId,
      datasetId,
      status: 'running',
      progress: 15,
    })
    .returning();

  await db
    .update(datasets)
    .set({ status: 'processing' })
    .where(eq(datasets.id, datasetId));

  try {
    const seqRows = await db
      .select()
      .from(sequences)
      .where(eq(sequences.datasetId, datasetId));

    if (seqRows.length === 0) {
      throw new Error('No valid DNA sequences found in dataset for analysis.');
    }

    await db
      .update(analysisJobs)
      .set({ progress: 50 })
      .where(eq(analysisJobs.id, job.id));

    const { results, biodiversity } = classifySequences(
      seqRows.map((s) => ({
        sequenceId: s.sequenceId,
        dnaSequence: s.dnaSequence,
        sequenceLength: s.sequenceLength,
        qualityScore: s.qualityScore,
      }))
    );

    // Replace previous taxonomy results for this dataset cleanly
    await db
      .delete(taxonomyResults)
      .where(eq(taxonomyResults.datasetId, datasetId));

    if (results.length > 0) {
      const batchSize = 200;
      for (let i = 0; i < results.length; i += batchSize) {
        const chunk = results.slice(i, i + batchSize).map((r) => ({
          datasetId,
          sequenceId: r.sequenceId,
          kingdom: r.kingdom,
          phylum: r.phylum,
          className: r.className,
          orderName: r.orderName,
          family: r.family,
          genus: r.genus,
          species: r.species,
          similarityScore: r.similarityScore,
          confidenceScore: r.confidenceScore,
          identificationStatus: r.identificationStatus,
          referenceDatabase: r.referenceDatabase,
          clusterId: r.clusterId,
        }));
        await db.insert(taxonomyResults).values(chunk);
      }
    }

    const avgLen = Number(
      (
        seqRows.reduce((acc, s) => acc + s.sequenceLength, 0) / seqRows.length
      ).toFixed(1)
    );
    const avgGc = Number(
      (
        seqRows.reduce((acc, s) => acc + (s.gcContent || 0), 0) / seqRows.length
      ).toFixed(2)
    );
    const qualSeqs = seqRows.filter((s) => s.qualityScore !== null);
    const avgQual =
      qualSeqs.length > 0
        ? Number(
            (
              qualSeqs.reduce((acc, s) => acc + (s.qualityScore || 0), 0) /
              qualSeqs.length
            ).toFixed(2)
          )
        : null;

    const metadata = {
      identifiedSpeciesCount: biodiversity.identifiedSpeciesCount,
      novelOtuCount: biodiversity.novelOtuCount,
      relativeAbundance: biodiversity.relativeAbundance,
      clusterSummary: biodiversity.clusterSummary,
      lengthDistribution: biodiversity.lengthDistribution,
      referenceDatabase: REFERENCE_DATABASE_NAME,
      method: 'Local k-mer (6-mer/4-mer) sequence similarity alignment and greedy centroid OTU clustering',
      meanSequenceLength: avgLen,
      meanGcContent: avgGc,
      meanQualityScore: avgQual,
    };

    await db
      .insert(biodiversityResults)
      .values({
        datasetId,
        speciesRichness: biodiversity.speciesRichness,
        shannonIndex: biodiversity.shannonIndex,
        simpsonIndex: biodiversity.simpsonIndex,
        simpsonDiversity: biodiversity.simpsonDiversity,
        evenness: biodiversity.evenness,
        totalSequences: biodiversity.totalSequences,
        classifiedCount: biodiversity.classifiedCount,
        unclassifiedCount: biodiversity.unclassifiedCount,
        analysisMetadata: metadata,
      })
      .onConflictDoUpdate({
        target: biodiversityResults.datasetId,
        set: {
          speciesRichness: biodiversity.speciesRichness,
          shannonIndex: biodiversity.shannonIndex,
          simpsonIndex: biodiversity.simpsonIndex,
          simpsonDiversity: biodiversity.simpsonDiversity,
          evenness: biodiversity.evenness,
          totalSequences: biodiversity.totalSequences,
          classifiedCount: biodiversity.classifiedCount,
          unclassifiedCount: biodiversity.unclassifiedCount,
          analysisMetadata: metadata,
          createdAt: new Date(),
        },
      });

    await db
      .update(datasets)
      .set({ status: 'completed' })
      .where(eq(datasets.id, datasetId));

    await db
      .update(analysisJobs)
      .set({
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
      })
      .where(eq(analysisJobs.id, job.id));

    await writeAuditLog(userId, 'DATASET_ANALYZED', 'dataset', String(datasetId), {
      totalSequences: biodiversity.totalSequences,
      speciesRichness: biodiversity.speciesRichness,
      shannonIndex: biodiversity.shannonIndex,
    });

    return { jobId: job.id, results, biodiversity, metadata };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Analysis pipeline failed.';
    await db
      .update(datasets)
      .set({ status: 'failed' })
      .where(eq(datasets.id, datasetId));
    await db
      .update(analysisJobs)
      .set({
        status: 'failed',
        errorMessage: msg,
        completedAt: new Date(),
      })
      .where(eq(analysisJobs.id, job.id));
    throw error;
  }
}

// ==================== PUBLIC API ROUTES ====================

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'DeepSea BioAI', timestamp: new Date().toISOString() });
});

app.get('/api/samples/:profile/:format', (req, res) => {
  const profileParam = req.params.profile === 'vent' ? 'vent' : 'pelagic';
  const fmtUpper = (req.params.format || 'FASTA').toUpperCase();
  const format = (['FASTA', 'FASTQ', 'CSV'].includes(fmtUpper) ? fmtUpper : 'FASTA') as
    | 'FASTA'
    | 'FASTQ'
    | 'CSV';
  const sample = generateSampleDatasetFile(format, profileParam);
  if (req.query.download === '1') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${sample.filename}"`);
    return res.send(sample.content);
  }
  return res.json(sample);
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, institution, subject, message } = req.body || {};
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Name, email, subject, and message are required.' });
    }
    if (!EMAIL_REGEX.test(String(email))) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    const [saved] = await db
      .insert(contactMessages)
      .values({
        name: String(name).trim().slice(0, 120),
        email: String(email).trim().toLowerCase().slice(0, 160),
        institution: String(institution || '').trim().slice(0, 160),
        subject: String(subject).trim().slice(0, 180),
        message: String(message).trim().slice(0, 4000),
      })
      .returning();
    return res.status(201).json({ id: saved.id, message: 'Inquiry received successfully.' });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ error: 'Unable to submit inquiry. Please try again.' });
  }
});

// ==================== AUTHENTICATION ROUTES ====================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password, institution, researchInterest } = req.body || {};
    const cleanName = String(fullName || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    const pwErr = validatePasswordStrength(String(password || ''));
    if (pwErr) {
      return res.status(400).json({ error: pwErr });
    }

    const existing = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.email, cleanEmail))
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({
        error: 'An account with this email address already exists. Please sign in instead.',
      });
    }

    const userId = `usr_${crypto.randomUUID()}`;
    const verificationToken = crypto.randomBytes(24).toString('hex');
    const passwordHash = hashPassword(String(password));

    // Public registration ALWAYS receives default role 'user'
    const [created] = await db
      .insert(profiles)
      .values({
        id: userId,
        fullName: cleanName.slice(0, 120),
        email: cleanEmail,
        passwordHash,
        authProvider: 'email',
        emailVerified: false,
        verificationToken,
        institution: String(institution || '').trim().slice(0, 160),
        researchInterest: String(researchInterest || 'Marine Biodiversity').trim().slice(0, 80),
        role: 'user',
      })
      .returning();

    await writeAuditLog(created.id, 'USER_REGISTERED', 'profile', created.id, {
      email: created.email,
      authProvider: 'email',
    });

    const token = createSessionToken(created.id, false);
    return res.status(201).json({
      token,
      profile: toSafeProfile(created),
      verificationToken,
      message:
        'Account created. Please verify your email address to complete researcher verification.',
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const token = String(req.body?.token || '').trim();
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required.' });
    }
    const rows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.verificationToken, token))
      .limit(1);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or already used verification token.' });
    }

    const [updated] = await db
      .update(profiles)
      .set({
        emailVerified: true,
        verificationToken: null,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, rows[0].id))
      .returning();

    await writeAuditLog(updated.id, 'EMAIL_VERIFIED', 'profile', updated.id, {});
    return res.json({
      profile: toSafeProfile(updated),
      message: 'Email address verified successfully.',
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({ error: 'Email verification failed.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail) || !password) {
      return res.status(400).json({ error: 'Please enter a valid email address and password.' });
    }

    const rows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, cleanEmail))
      .limit(1);

    const user = rows[0];
    if (!user || !user.passwordHash) {
      return res.status(401).json({
        error: 'Invalid email or password. If you registered with Google, use Sign in with Google.',
      });
    }
    if (!verifyPassword(String(password), user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        error: 'Your account has been suspended. Please contact an administrator.',
      });
    }

    const token = createSessionToken(user.id, Boolean(rememberMe));
    return res.json({
      token,
      profile: toSafeProfile(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const cleanEmail = String(req.body?.email || '').trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const rows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, cleanEmail))
      .limit(1);

    // Always respond cleanly without leaking account existence on production, while returning preview token for matching email accounts
    if (rows.length === 0 || !rows[0].passwordHash) {
      return res.json({
        message:
          'If an email/password account is registered under this address, a password reset link has been prepared.',
      });
    }

    const resetToken = crypto.randomBytes(24).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await db
      .update(profiles)
      .set({
        resetToken,
        resetTokenExpires: expires,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, rows[0].id));

    await writeAuditLog(rows[0].id, 'PASSWORD_RESET_REQUESTED', 'profile', rows[0].id, {});

    return res.json({
      message: 'Password reset link generated. Use the reset link below to choose a new password.',
      resetToken,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Could not initiate password reset.' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    const cleanToken = String(token || '').trim();
    if (!cleanToken) {
      return res.status(400).json({ error: 'Reset token is required.' });
    }
    const pwErr = validatePasswordStrength(String(newPassword || ''));
    if (pwErr) {
      return res.status(400).json({ error: pwErr });
    }

    const rows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.resetToken, cleanToken))
      .limit(1);

    if (
      rows.length === 0 ||
      !rows[0].resetTokenExpires ||
      new Date() > new Date(rows[0].resetTokenExpires)
    ) {
      return res.status(400).json({ error: 'Password reset link is invalid or has expired.' });
    }

    await db
      .update(profiles)
      .set({
        passwordHash: hashPassword(String(newPassword)),
        resetToken: null,
        resetTokenExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, rows[0].id));

    await writeAuditLog(rows[0].id, 'PASSWORD_RESET_COMPLETED', 'profile', rows[0].id, {});
    return res.json({ message: 'Password updated successfully. You may now sign in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Password reset failed.' });
  }
});

app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
  return res.json({ profile: req.profile });
});

app.post('/api/auth/change-password', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    const pwErr = validatePasswordStrength(String(newPassword || ''));
    if (pwErr) {
      return res.status(400).json({ error: pwErr });
    }

    const rows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, req.profile!.id))
      .limit(1);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Account not found.' });
    }
    const user = rows[0];
    if (user.passwordHash) {
      if (!currentPassword || !verifyPassword(String(currentPassword), user.passwordHash)) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }
    }

    await db
      .update(profiles)
      .set({
        passwordHash: hashPassword(String(newPassword)),
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    await writeAuditLog(user.id, 'PASSWORD_CHANGED', 'profile', user.id, {});
    return res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Unable to update password.' });
  }
});

// ==================== PROFILE ROUTES ====================

app.patch('/api/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    if ('role' in (req.body || {}) || 'isSuspended' in (req.body || {})) {
      await writeAuditLog(req.profile!.id, 'PRIVILEGE_ESCALATION_BLOCKED', 'profile', req.profile!.id, {
        attemptedKeys: Object.keys(req.body || {}),
      });
      return res.status(403).json({
        error: 'Role and account status cannot be modified through profile updates.',
      });
    }

    const { fullName, institution, researchInterest, avatarUrl } = req.body || {};
    const cleanName = fullName !== undefined ? String(fullName).trim() : req.profile!.fullName;
    if (cleanName.length < 2) {
      return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
    }

    let safeAvatar = req.profile!.avatarUrl;
    if (avatarUrl !== undefined) {
      const str = String(avatarUrl).trim();
      if (
        str === '' ||
        str.startsWith('https://') ||
        /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(str)
      ) {
        if (str.length > 2 * 1024 * 1024) {
          return res.status(400).json({ error: 'Profile image exceeds 2 MB limit.' });
        }
        safeAvatar = str;
      } else {
        return res.status(400).json({ error: 'Unsupported avatar image format.' });
      }
    }

    const [updated] = await db
      .update(profiles)
      .set({
        fullName: cleanName.slice(0, 120),
        institution:
          institution !== undefined
            ? String(institution).trim().slice(0, 160)
            : req.profile!.institution,
        researchInterest:
          researchInterest !== undefined
            ? String(researchInterest).trim().slice(0, 80)
            : req.profile!.researchInterest,
        avatarUrl: safeAvatar,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, req.profile!.id))
      .returning();

    return res.json({ profile: toSafeProfile(updated) });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// ==================== DASHBOARD & DATASET ROUTES ====================

app.get('/api/dashboard/overview', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.profile!.id;
    const userDatasets = await db
      .select()
      .from(datasets)
      .where(eq(datasets.userId, userId))
      .orderBy(desc(datasets.createdAt));

    if (userDatasets.length === 0) {
      return res.json({
        isEmpty: true,
        stats: {
          totalDatasets: 0,
          totalSamples: 0,
          totalSequences: 0,
          identifiedTaxa: 0,
          unclassifiedSequences: 0,
          meanSpeciesRichness: 0,
          meanShannonIndex: 0,
        },
        taxonomicDistribution: [],
        speciesAbundance: [],
        biodiversityTrends: [],
        classificationBreakdown: [
          { name: 'Identified', value: 0 },
          { name: 'Partially identified', value: 0 },
          { name: 'Potentially novel', value: 0 },
          { name: 'Unclassified', value: 0 },
        ],
        sampleComparison: [],
        recentDatasets: [],
      });
    }

    const datasetIds = userDatasets.map((d) => d.id);

    const bioRows = await db
      .select()
      .from(biodiversityResults)
      .where(inArray(biodiversityResults.datasetId, datasetIds));

    const taxRows = await db
      .select()
      .from(taxonomyResults)
      .where(inArray(taxonomyResults.datasetId, datasetIds));

    const bioByDataset = new Map(bioRows.map((b) => [b.datasetId, b]));
    const distinctSamples = new Set(userDatasets.map((d) => d.sampleName)).size;

    const totalSequences = bioRows.reduce((acc, b) => acc + b.totalSequences, 0);
    const unclassifiedSequences = bioRows.reduce((acc, b) => acc + b.unclassifiedCount, 0);

    const distinctTaxaSet = new Set<string>();
    const phylumCounts = new Map<string, number>();
    const speciesCounts = new Map<string, number>();
    const statusCounts: Record<string, number> = {
      Identified: 0,
      'Partially identified': 0,
      'Potentially novel sequence': 0,
      Unclassified: 0,
    };

    for (const t of taxRows) {
      statusCounts[t.identificationStatus] = (statusCounts[t.identificationStatus] || 0) + 1;
      const phylumKey = t.phylum !== 'Unclassified' ? t.phylum : 'Unclassified';
      phylumCounts.set(phylumKey, (phylumCounts.get(phylumKey) || 0) + 1);
      if (t.identificationStatus === 'Identified') {
        distinctTaxaSet.add(t.species);
        speciesCounts.set(t.species, (speciesCounts.get(t.species) || 0) + 1);
      } else if (t.identificationStatus === 'Partially identified') {
        const key = `${t.genus} sp.`;
        distinctTaxaSet.add(key);
        speciesCounts.set(key, (speciesCounts.get(key) || 0) + 1);
      }
    }

    const meanSpeciesRichness =
      bioRows.length > 0
        ? Number(
            (bioRows.reduce((acc, b) => acc + b.speciesRichness, 0) / bioRows.length).toFixed(1)
          )
        : 0;
    const meanShannonIndex =
      bioRows.length > 0
        ? Number(
            (bioRows.reduce((acc, b) => acc + b.shannonIndex, 0) / bioRows.length).toFixed(3)
          )
        : 0;

    const taxonomicDistribution = Array.from(phylumCounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const speciesAbundance = Array.from(speciesCounts.entries())
      .map(([species, reads]) => ({
        species,
        reads,
        relativePct:
          totalSequences > 0 ? Number(((reads / totalSequences) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.reads - a.reads)
      .slice(0, 10);

    const chronological = [...userDatasets].reverse();
    const biodiversityTrends = chronological
      .filter((d) => bioByDataset.has(d.id))
      .map((d) => {
        const b = bioByDataset.get(d.id)!;
        return {
          datasetId: d.id,
          name: d.sampleName || d.datasetName,
          date: d.collectionDate || new Date(d.createdAt).toISOString().slice(0, 10),
          shannon: b.shannonIndex,
          simpsonDiversity: b.simpsonDiversity,
          richness: b.speciesRichness,
          evenness: b.evenness,
        };
      });

    const sampleComparison = userDatasets
      .filter((d) => bioByDataset.has(d.id))
      .slice(0, 6)
      .map((d) => {
        const b = bioByDataset.get(d.id)!;
        return {
          datasetId: d.id,
          sample: d.sampleName,
          datasetName: d.datasetName,
          sampleType: d.sampleType,
          classified: b.classifiedCount,
          unclassified: b.unclassifiedCount,
          richness: b.speciesRichness,
          shannon: b.shannonIndex,
        };
      });

    const recentDatasets = userDatasets.slice(0, 6).map((d) => {
      const b = bioByDataset.get(d.id);
      return {
        ...d,
        totalSequences: b?.totalSequences ?? 0,
        speciesRichness: b?.speciesRichness ?? 0,
        shannonIndex: b?.shannonIndex ?? 0,
      };
    });

    return res.json({
      isEmpty: false,
      stats: {
        totalDatasets: userDatasets.length,
        totalSamples: distinctSamples,
        totalSequences,
        identifiedTaxa: distinctTaxaSet.size,
        unclassifiedSequences,
        meanSpeciesRichness,
        meanShannonIndex,
      },
      taxonomicDistribution,
      speciesAbundance,
      biodiversityTrends,
      classificationBreakdown: [
        { name: 'Identified', value: statusCounts['Identified'] || 0 },
        { name: 'Partially identified', value: statusCounts['Partially identified'] || 0 },
        { name: 'Potentially novel', value: statusCounts['Potentially novel sequence'] || 0 },
        { name: 'Unclassified', value: statusCounts['Unclassified'] || 0 },
      ],
      sampleComparison,
      recentDatasets,
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    return res.status(500).json({ error: 'Unable to load dashboard analytics.' });
  }
});

app.get('/api/datasets', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.profile!.id;
    const rows = await db
      .select()
      .from(datasets)
      .where(eq(datasets.userId, userId))
      .orderBy(desc(datasets.createdAt));

    if (rows.length === 0) {
      return res.json({ datasets: [] });
    }

    const ids = rows.map((r) => r.id);
    const bioRows = await db
      .select()
      .from(biodiversityResults)
      .where(inArray(biodiversityResults.datasetId, ids));

    const seqCountRows = await db
      .select({
        datasetId: sequences.datasetId,
        seqCount: count(),
      })
      .from(sequences)
      .where(inArray(sequences.datasetId, ids))
      .groupBy(sequences.datasetId);

    const bioMap = new Map(bioRows.map((b) => [b.datasetId, b]));
    const countMap = new Map(seqCountRows.map((c) => [c.datasetId, Number(c.seqCount)]));

    return res.json({
      datasets: rows.map((d) => ({
        ...d,
        sequenceCount: countMap.get(d.id) || 0,
        biodiversity: bioMap.get(d.id) || null,
      })),
    });
  } catch (error) {
    console.error('List datasets error:', error);
    return res.status(500).json({ error: 'Unable to fetch datasets.' });
  }
});

app.post(
  '/api/datasets/upload',
  requireAuth,
  upload.array('files', 5),
  async (req: AuthRequest, res) => {
    try {
      const userId = req.profile!.id;
      const files = (req.files as Express.Multer.File[]) || [];
      const body = req.body || {};

      // Support either multipart file upload OR direct text payload (e.g., loaded sample)
      const uploadItems: Array<{ originalname: string; buffer: Buffer }> = [];
      if (files.length > 0) {
        for (const f of files) {
          uploadItems.push({ originalname: f.originalname, buffer: f.buffer });
        }
      } else if (body.fileContent && body.fileName) {
        uploadItems.push({
          originalname: String(body.fileName),
          buffer: Buffer.from(String(body.fileContent), 'utf8'),
        });
      }

      if (uploadItems.length === 0) {
        return res.status(400).json({
          error: 'Please select at least one FASTA, FASTQ, or CSV eDNA sequence file.',
        });
      }

      const sampleType = ALLOWED_SAMPLE_TYPES.has(String(body.sampleType || 'Marine'))
        ? String(body.sampleType || 'Marine')
        : 'Marine';
      const runImmediately = String(body.runImmediately ?? 'true') !== 'false';

      const createdDatasets: Array<Record<string, unknown>> = [];

      for (let idx = 0; idx < uploadItems.length; idx++) {
        const item = uploadItems[idx];
        const ext = (item.originalname.split('.').pop() || '').toLowerCase();
        if (!['fasta', 'fa', 'fna', 'fastq', 'fq', 'csv', 'txt'].includes(ext)) {
          return res.status(400).json({
            error: `Unsupported file format for "${item.originalname}". Supported formats: FASTA (.fasta, .fa), FASTQ (.fastq, .fq), CSV (.csv).`,
          });
        }

        const rawText = item.buffer.toString('utf8');
        const parsed = parseSequenceFile(rawText, item.originalname);
        if (parsed.sequences.length === 0) {
          return res.status(400).json({
            error: `No valid DNA sequences (>= 20 bp of A/C/G/T/N) were parsed from "${item.originalname}".`,
          });
        }

        const storedRelPath = saveDatasetFileConfined(userId, item.originalname, item.buffer);
        const baseDatasetName = String(body.datasetName || item.originalname.replace(/\.[^.]+$/, '')).trim();
        const datasetName =
          uploadItems.length > 1 ? `${baseDatasetName} (${idx + 1})` : baseDatasetName;
        const sampleName = String(
          body.sampleName || `SAMPLE-${Date.now().toString().slice(-4)}-${idx + 1}`
        ).trim();

        const [ds] = await db
          .insert(datasets)
          .values({
            userId,
            datasetName: datasetName.slice(0, 160),
            sampleName: sampleName.slice(0, 120),
            filePath: storedRelPath,
            fileFormat: parsed.format,
            fileSize: item.buffer.length,
            sampleType,
            collectionLocation: String(body.collectionLocation || '').trim().slice(0, 200),
            collectionDate: String(body.collectionDate || '').trim().slice(0, 40),
            description: String(body.description || '').trim().slice(0, 2000),
            status: 'uploaded',
          })
          .returning();

        // Bulk insert sequences
        const batchSize = 200;
        for (let i = 0; i < parsed.sequences.length; i += batchSize) {
          const batch = parsed.sequences.slice(i, i + batchSize).map((s) => ({
            datasetId: ds.id,
            sequenceId: s.sequenceId,
            dnaSequence: s.dnaSequence,
            sequenceLength: s.sequenceLength,
            qualityScore: s.qualityScore,
            gcContent: s.gcContent,
          }));
          await db.insert(sequences).values(batch);
        }

        await writeAuditLog(userId, 'DATASET_UPLOADED', 'dataset', String(ds.id), {
          fileName: item.originalname,
          format: parsed.format,
          validSequences: parsed.sequences.length,
          filteredOut: parsed.filteredOut,
        });

        let analysis = null;
        if (runImmediately) {
          analysis = await runAnalysisPipeline(ds.id, userId);
        }

        createdDatasets.push({
          dataset: { ...ds, status: runImmediately ? 'completed' : 'uploaded' },
          preprocessing: {
            totalRawRecords: parsed.totalRawRecords,
            validSequences: parsed.sequences.length,
            filteredOut: parsed.filteredOut,
            meanLength: parsed.meanLength,
            meanGcContent: parsed.meanGcContent,
            meanQuality: parsed.meanQuality,
          },
          biodiversity: analysis?.biodiversity || null,
        });
      }

      return res.status(201).json({
        uploaded: createdDatasets,
        message: `${createdDatasets.length} dataset${createdDatasets.length > 1 ? 's' : ''} uploaded${runImmediately ? ' and analyzed' : ''} successfully.`,
      });
    } catch (error) {
      console.error('Upload dataset error:', error);
      return res.status(500).json({ error: 'Dataset upload failed. Please try again.' });
    }
  }
);

app.get('/api/datasets/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid dataset ID.' });
    }

    const rows = await db
      .select()
      .from(datasets)
      .where(and(eq(datasets.id, id), eq(datasets.userId, req.profile!.id)))
      .limit(1);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found or access denied.' });
    }

    const [seqRows, taxRows, bioRows, jobRows] = await Promise.all([
      db.select().from(sequences).where(eq(sequences.datasetId, id)),
      db.select().from(taxonomyResults).where(eq(taxonomyResults.datasetId, id)),
      db.select().from(biodiversityResults).where(eq(biodiversityResults.datasetId, id)).limit(1),
      db
        .select()
        .from(analysisJobs)
        .where(eq(analysisJobs.datasetId, id))
        .orderBy(desc(analysisJobs.startedAt))
        .limit(5),
    ]);

    const seqMap = new Map(seqRows.map((s) => [s.sequenceId, s]));
    const enrichedTaxonomy = taxRows.map((t) => {
      const seq = seqMap.get(t.sequenceId);
      return {
        ...t,
        sequenceLength: seq?.sequenceLength ?? 0,
        gcContent: seq?.gcContent ?? null,
        qualityScore: seq?.qualityScore ?? null,
      };
    });

    return res.json({
      dataset: rows[0],
      sequenceCount: seqRows.length,
      biodiversity: bioRows[0] || null,
      taxonomyResults: enrichedTaxonomy,
      jobs: jobRows,
    });
  } catch (error) {
    console.error('Get dataset detail error:', error);
    return res.status(500).json({ error: 'Unable to load dataset details.' });
  }
});

app.post('/api/datasets/:id/analyze', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid dataset ID.' });
    }

    const rows = await db
      .select()
      .from(datasets)
      .where(and(eq(datasets.id, id), eq(datasets.userId, req.profile!.id)))
      .limit(1);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found or access denied.' });
    }

    const analysis = await runAnalysisPipeline(id, req.profile!.id);
    return res.json({
      message: 'Taxonomic identification and biodiversity analysis completed.',
      ...analysis,
    });
  } catch (error: unknown) {
    console.error('Analyze dataset error:', error);
    const msg = error instanceof Error ? error.message : 'Analysis failed.';
    return res.status(500).json({ error: msg });
  }
});

app.delete('/api/datasets/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid dataset ID.' });
    }

    const rows = await db
      .select()
      .from(datasets)
      .where(and(eq(datasets.id, id), eq(datasets.userId, req.profile!.id)))
      .limit(1);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found or access denied.' });
    }

    await db.delete(datasets).where(eq(datasets.id, id));
    removeDatasetFileConfined(rows[0].filePath);

    await writeAuditLog(req.profile!.id, 'DATASET_DELETED', 'dataset', String(id), {
      datasetName: rows[0].datasetName,
    });

    return res.json({ message: 'Dataset deleted successfully.' });
  } catch (error) {
    console.error('Delete dataset error:', error);
    return res.status(500).json({ error: 'Failed to delete dataset.' });
  }
});

// ==================== TAXONOMY EXPLORER & SAMPLE COMPARISON ====================

app.get('/api/taxonomy/explorer', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.profile!.id;
    const userDatasets = await db
      .select()
      .from(datasets)
      .where(eq(datasets.userId, userId))
      .orderBy(desc(datasets.createdAt));

    if (userDatasets.length === 0) {
      return res.json({
        datasets: [],
        records: [],
        facets: { kingdoms: [], phyla: [], classes: [], genera: [] },
        tree: [],
      });
    }

    const datasetFilterId = req.query.datasetId ? Number.parseInt(String(req.query.datasetId), 10) : null;
    const targetIds =
      datasetFilterId && userDatasets.some((d) => d.id === datasetFilterId)
        ? [datasetFilterId]
        : userDatasets.map((d) => d.id);

    const dsNameMap = new Map(userDatasets.map((d) => [d.id, d.datasetName]));

    const allTax = await db
      .select()
      .from(taxonomyResults)
      .where(inArray(taxonomyResults.datasetId, targetIds));

    const kingdoms = Array.from(new Set(allTax.map((t) => t.kingdom))).sort();
    const phyla = Array.from(new Set(allTax.map((t) => t.phylum))).sort();
    const classes = Array.from(new Set(allTax.map((t) => t.className))).sort();
    const genera = Array.from(new Set(allTax.map((t) => t.genus))).sort();

    const search = String(req.query.search || '').trim().toLowerCase();
    const fKingdom = String(req.query.kingdom || '').trim();
    const fPhylum = String(req.query.phylum || '').trim();
    const fClass = String(req.query.className || '').trim();
    const fGenus = String(req.query.genus || '').trim();
    const fStatus = String(req.query.status || '').trim();

    const filtered = allTax.filter((t) => {
      if (fKingdom && t.kingdom !== fKingdom) return false;
      if (fPhylum && t.phylum !== fPhylum) return false;
      if (fClass && t.className !== fClass) return false;
      if (fGenus && t.genus !== fGenus) return false;
      if (fStatus && t.identificationStatus !== fStatus) return false;
      if (search) {
        const hay = `${t.sequenceId} ${t.kingdom} ${t.phylum} ${t.className} ${t.orderName} ${t.family} ${t.genus} ${t.species} ${t.clusterId || ''}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });

    // Build scientific taxonomy hierarchy tree: Kingdom -> Phylum -> Class -> Genus -> Species
    interface TreeNode {
      name: string;
      rank: string;
      count: number;
      avgConfidence: number;
      datasets: string[];
      children: TreeNode[];
    }

    const kingdomMap = new Map<string, typeof filtered>();
    for (const r of filtered) {
      const list = kingdomMap.get(r.kingdom) || [];
      list.push(r);
      kingdomMap.set(r.kingdom, list);
    }

    const buildLevel = (
      items: typeof filtered,
      ranks: Array<{ key: keyof (typeof filtered)[0]; label: string }>
    ): TreeNode[] => {
      if (ranks.length === 0) return [];
      const [current, ...rest] = ranks;
      const groups = new Map<string, typeof filtered>();
      for (const item of items) {
        const val = String(item[current.key] || 'Unclassified');
        const list = groups.get(val) || [];
        list.push(item);
        groups.set(val, list);
      }
      return Array.from(groups.entries())
        .map(([name, groupItems]) => {
          const avgConf = Number(
            (
              groupItems.reduce((acc, g) => acc + g.confidenceScore, 0) /
              groupItems.length
            ).toFixed(1)
          );
          const dsList = Array.from(
            new Set(groupItems.map((g) => dsNameMap.get(g.datasetId) || `Dataset #${g.datasetId}`))
          );
          return {
            name,
            rank: current.label,
            count: groupItems.length,
            avgConfidence: avgConf,
            datasets: dsList,
            children:
              name === 'Unclassified' && rest.length > 0
                ? []
                : buildLevel(groupItems, rest),
          };
        })
        .sort((a, b) => b.count - a.count);
    };

    const tree = buildLevel(filtered, [
      { key: 'kingdom', label: 'Kingdom' },
      { key: 'phylum', label: 'Phylum' },
      { key: 'className', label: 'Class' },
      { key: 'orderName', label: 'Order' },
      { key: 'family', label: 'Family' },
      { key: 'genus', label: 'Genus' },
      { key: 'species', label: 'Species' },
    ]);

    return res.json({
      datasets: userDatasets.map((d) => ({
        id: d.id,
        datasetName: d.datasetName,
        sampleName: d.sampleName,
      })),
      records: filtered.map((r) => ({
        ...r,
        datasetName: dsNameMap.get(r.datasetId) || `Dataset #${r.datasetId}`,
      })),
      facets: { kingdoms, phyla, classes, genera },
      tree,
    });
  } catch (error) {
    console.error('Taxonomy explorer error:', error);
    return res.status(500).json({ error: 'Failed to load taxonomy explorer.' });
  }
});

app.get('/api/compare', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.profile!.id;
    const rawIds = String(req.query.ids || '')
      .split(',')
      .map((s) => Number.parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n));

    const userDatasets = await db
      .select()
      .from(datasets)
      .where(eq(datasets.userId, userId))
      .orderBy(desc(datasets.createdAt));

    const selected =
      rawIds.length > 0
        ? userDatasets.filter((d) => rawIds.includes(d.id))
        : userDatasets.slice(0, 4);

    if (selected.length === 0) {
      return res.json({ samples: [], taxaMatrix: [], similarityPairs: [] });
    }

    const ids = selected.map((d) => d.id);
    const [bioRows, taxRows] = await Promise.all([
      db.select().from(biodiversityResults).where(inArray(biodiversityResults.datasetId, ids)),
      db.select().from(taxonomyResults).where(inArray(taxonomyResults.datasetId, ids)),
    ]);

    const bioMap = new Map(bioRows.map((b) => [b.datasetId, b]));
    const taxaByDataset = new Map<number, Map<string, number>>();
    const allTaxaSet = new Set<string>();

    for (const d of selected) {
      taxaByDataset.set(d.id, new Map());
    }
    for (const t of taxRows) {
      const label =
        t.identificationStatus === 'Identified'
          ? t.species
          : t.identificationStatus === 'Partially identified'
            ? `${t.genus} sp.`
            : t.clusterId || 'Unclassified';
      allTaxaSet.add(label);
      const map = taxaByDataset.get(t.datasetId);
      if (map) map.set(label, (map.get(label) || 0) + 1);
    }

    const samples = selected.map((d) => {
      const bio = bioMap.get(d.id);
      return {
        id: d.id,
        datasetName: d.datasetName,
        sampleName: d.sampleName,
        sampleType: d.sampleType,
        collectionLocation: d.collectionLocation,
        collectionDate: d.collectionDate,
        totalSequences: bio?.totalSequences ?? 0,
        speciesRichness: bio?.speciesRichness ?? 0,
        shannonIndex: bio?.shannonIndex ?? 0,
        simpsonIndex: bio?.simpsonIndex ?? 0,
        simpsonDiversity: bio?.simpsonDiversity ?? 0,
        evenness: bio?.evenness ?? 0,
        classifiedCount: bio?.classifiedCount ?? 0,
        unclassifiedCount: bio?.unclassifiedCount ?? 0,
      };
    });

    const taxaMatrix = Array.from(allTaxaSet)
      .map((taxon) => {
        const row: Record<string, string | number> = { taxon };
        let total = 0;
        for (const d of selected) {
          const map = taxaByDataset.get(d.id)!;
          const cnt = map.get(taxon) || 0;
          const bio = bioMap.get(d.id);
          const pct =
            bio && bio.totalSequences > 0
              ? Number(((cnt / bio.totalSequences) * 100).toFixed(2))
              : 0;
          row[`ds_${d.id}`] = pct;
          row[`cnt_${d.id}`] = cnt;
          total += cnt;
        }
        row.totalReads = total;
        return row;
      })
      .sort((a, b) => Number(b.totalReads) - Number(a.totalReads));

    // Pairwise Jaccard index between selected samples
    const similarityPairs: Array<{
      sampleA: string;
      sampleB: string;
      sharedTaxa: number;
      unionTaxa: number;
      jaccardIndex: number;
    }> = [];

    for (let i = 0; i < selected.length; i++) {
      for (let j = i + 1; j < selected.length; j++) {
        const setA = new Set(taxaByDataset.get(selected[i].id)?.keys() || []);
        const setB = new Set(taxaByDataset.get(selected[j].id)?.keys() || []);
        let shared = 0;
        for (const t of setA) {
          if (setB.has(t)) shared++;
        }
        const union = setA.size + setB.size - shared;
        similarityPairs.push({
          sampleA: selected[i].sampleName,
          sampleB: selected[j].sampleName,
          sharedTaxa: shared,
          unionTaxa: union,
          jaccardIndex: union > 0 ? Number((shared / union).toFixed(3)) : 0,
        });
      }
    }

    return res.json({ samples, taxaMatrix, similarityPairs });
  } catch (error) {
    console.error('Compare samples error:', error);
    return res.status(500).json({ error: 'Unable to compare samples.' });
  }
});

// ==================== REPORT DATA ENDPOINT ====================

app.get('/api/datasets/:id/report', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid dataset ID.' });
    }
    const rows = await db
      .select()
      .from(datasets)
      .where(and(eq(datasets.id, id), eq(datasets.userId, req.profile!.id)))
      .limit(1);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found.' });
    }

    const ds = rows[0];
    const [bioRows, taxRows, seqRows] = await Promise.all([
      db.select().from(biodiversityResults).where(eq(biodiversityResults.datasetId, id)).limit(1),
      db.select().from(taxonomyResults).where(eq(taxonomyResults.datasetId, id)),
      db.select().from(sequences).where(eq(sequences.datasetId, id)),
    ]);

    const bio = bioRows[0] || null;
    const meta = (bio?.analysisMetadata || {}) as Record<string, unknown>;

    const classifiedRate =
      bio && bio.totalSequences > 0
        ? Number(((bio.classifiedCount / bio.totalSequences) * 100).toFixed(1))
        : 0;

    const scientificInterpretation = bio
      ? `Analysis of ${bio.totalSequences} environmental DNA sequences from sample ${ds.sampleName} (${ds.sampleType}) identified ${bio.speciesRichness} operational taxonomic units (${Number(meta.identifiedSpeciesCount || 0)} resolved to species level) with a ${classifiedRate}% classification rate against ${REFERENCE_DATABASE_NAME}. The Shannon diversity index (H' = ${bio.shannonIndex.toFixed(3)}) and Gini-Simpson diversity (1 - D = ${bio.simpsonDiversity.toFixed(3)}) indicate ${bio.shannonIndex >= 2.0 ? 'high' : bio.shannonIndex >= 1.2 ? 'moderate' : 'low-to-moderate'} community diversity, with Pielou evenness J' = ${bio.evenness.toFixed(3)}.`
      : 'Analysis has not yet been executed on this dataset. Run taxonomic identification first to generate ecological interpretations.';

    return res.json({
      generatedAt: new Date().toISOString(),
      researcher: {
        fullName: req.profile!.fullName,
        email: req.profile!.email,
        institution: req.profile!.institution || 'Independent Researcher',
      },
      dataset: ds,
      preprocessing: {
        validSequences: seqRows.length,
        meanSequenceLength: meta.meanSequenceLength ?? 0,
        meanGcContent: meta.meanGcContent ?? 0,
        meanQualityScore: meta.meanQualityScore ?? null,
        referenceDatabase: meta.referenceDatabase ?? REFERENCE_DATABASE_NAME,
        method:
          meta.method ??
          'Local k-mer sequence similarity alignment and greedy centroid OTU clustering',
      },
      biodiversity: bio,
      taxonomyResults: taxRows,
      relativeAbundance: meta.relativeAbundance || [],
      unclassifiedClusters: meta.clusterSummary || [],
      scientificInterpretation,
      limitations: [
        'eDNA sequence read counts represent relative molecular abundance affected by PCR amplification bias, marker copy number variation, and differential DNA shedding/degradation rates—not exact organism population census counts.',
        'Taxonomic assignments in this prototype use local curated marine marker references (COI, 16S rRNA, 18S rRNA) rather than live external NCBI BLAST alignment; sequences below similarity thresholds are strictly labeled Partially identified, Potentially novel sequence, or Unclassified.',
        'Unclassified or potentially novel OTU clusters reflect computational divergence from local reference records and do not constitute formal new-species discovery without morphological, phylogenetic, and expanded reference verification.',
      ],
      conclusion: bio
        ? `Environmental DNA screening of ${ds.datasetName} successfully profiled community composition across ${bio.speciesRichness} operational taxa and flagged ${bio.unclassifiedCount} unclassified/divergent reads for targeted follow-up sequencing.`
        : 'Pending sequence classification run.',
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return res.status(500).json({ error: 'Unable to compile scientific report.' });
  }
});

// ==================== BIOAI ASSISTANT ROUTES ====================

app.get('/api/assistant/messages', requireAuth, async (req: AuthRequest, res) => {
  try {
    const msgs = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, req.profile!.id))
      .orderBy(chatMessages.createdAt);
    return res.json({ messages: msgs });
  } catch (error) {
    console.error('Get assistant messages error:', error);
    return res.status(500).json({ error: 'Failed to load conversation history.' });
  }
});

app.delete('/api/assistant/messages', requireAuth, async (req: AuthRequest, res) => {
  try {
    await db.delete(chatMessages).where(eq(chatMessages.userId, req.profile!.id));
    return res.json({ message: 'Conversation cleared.' });
  } catch (error) {
    console.error('Clear assistant messages error:', error);
    return res.status(500).json({ error: 'Failed to clear conversation.' });
  }
});

app.post('/api/assistant/chat', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.profile!.id;
    const message = String(req.body?.message || '').trim();
    const datasetId = req.body?.datasetId ? Number.parseInt(String(req.body.datasetId), 10) : null;

    if (!message) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    // Load user's actual dataset(s) from PostgreSQL as grounded scientific context
    const userDatasets = await db
      .select()
      .from(datasets)
      .where(eq(datasets.userId, userId))
      .orderBy(desc(datasets.createdAt));

    const targetDatasets =
      datasetId && userDatasets.some((d) => d.id === datasetId)
        ? userDatasets.filter((d) => d.id === datasetId)
        : userDatasets.slice(0, 3);

    const contexts: DatasetScientificContext[] = [];
    if (targetDatasets.length > 0) {
      const bioRows = await db
        .select()
        .from(biodiversityResults)
        .where(
          inArray(
            biodiversityResults.datasetId,
            targetDatasets.map((d) => d.id)
          )
        );
      const bioMap = new Map(bioRows.map((b) => [b.datasetId, b]));

      for (const ds of targetDatasets) {
        const bio = bioMap.get(ds.id);
        if (!bio) continue;
        const meta = (bio.analysisMetadata || {}) as Record<string, unknown>;
        const abundance = Array.isArray(meta.relativeAbundance)
          ? (meta.relativeAbundance as DatasetScientificContext['topTaxa']).slice(0, 12)
          : [];
        const clusters = Array.isArray(meta.clusterSummary)
          ? (meta.clusterSummary as DatasetScientificContext['clusters']).slice(0, 8)
          : [];

        contexts.push({
          datasetName: ds.datasetName,
          sampleName: ds.sampleName,
          sampleType: ds.sampleType,
          collectionLocation: ds.collectionLocation || 'Not specified',
          collectionDate: ds.collectionDate || 'Not specified',
          fileFormat: ds.fileFormat,
          totalSequences: bio.totalSequences,
          classifiedCount: bio.classifiedCount,
          unclassifiedCount: bio.unclassifiedCount,
          speciesRichness: bio.speciesRichness,
          shannonIndex: bio.shannonIndex,
          simpsonIndex: bio.simpsonIndex,
          simpsonDiversity: bio.simpsonDiversity,
          evenness: bio.evenness,
          topTaxa: abundance,
          clusters,
          referenceDatabase: String(meta.referenceDatabase || REFERENCE_DATABASE_NAME),
        });
      }
    }

    const previousMsgs = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(chatMessages.createdAt);

    const [savedUserMsg] = await db
      .insert(chatMessages)
      .values({
        userId,
        datasetId: datasetId || null,
        role: 'user',
        content: message.slice(0, 4000),
      })
      .returning();

    const reply = await askBioAIAssistant({
      message,
      history: previousMsgs.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      datasetContexts: contexts,
    });

    const [savedAssistantMsg] = await db
      .insert(chatMessages)
      .values({
        userId,
        datasetId: datasetId || null,
        role: 'assistant',
        content: reply,
      })
      .returning();

    return res.json({
      userMessage: savedUserMsg,
      assistantMessage: savedAssistantMsg,
    });
  } catch (error: unknown) {
    console.error('BioAI Assistant error:', error);
    const msg =
      error instanceof Error
        ? error.message
        : 'BioAI Assistant is temporarily unavailable. Please try again.';
    return res.status(502).json({ error: msg });
  }
});

// ==================== RESTRICTED ADMIN CONTROL CENTER ROUTES ====================

app.get('/api/admin/bootstrap-status', async (_req, res) => {
  try {
    const existingPasswordAdmin = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(and(eq(profiles.role, 'admin'), sql`${profiles.passwordHash} IS NOT NULL`))
      .limit(1);

    const envPasscodeConfigured = Boolean(
      process.env.ADMIN_BOOTSTRAP_PASSCODE && process.env.ADMIN_BOOTSTRAP_PASSCODE.trim().length > 0
    );

    return res.json({
      needsSetup: existingPasswordAdmin.length === 0,
      envPasscodeConfigured,
    });
  } catch (error) {
    console.error('Admin bootstrap status error:', error);
    return res.status(500).json({ error: 'Unable to check administrator setup status.' });
  }
});

app.post('/api/admin/bootstrap', async (req, res) => {
  try {
    const { fullName, email, password, bootstrapPasscode } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanName = String(fullName || 'Platform Administrator').trim();

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ error: 'Valid administrator email is required.' });
    }
    const pwErr = validatePasswordStrength(String(password || ''));
    if (pwErr) {
      return res.status(400).json({ error: pwErr });
    }

    const envPasscode = (process.env.ADMIN_BOOTSTRAP_PASSCODE || '').trim();
    const existingPasswordAdmins = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(and(eq(profiles.role, 'admin'), sql`${profiles.passwordHash} IS NOT NULL`))
      .limit(1);

    if (envPasscode) {
      const provided = String(bootstrapPasscode || '');
      const a = Buffer.from(provided);
      const b = Buffer.from(envPasscode);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return res.status(403).json({ error: 'Invalid server bootstrap passcode.' });
      }
    } else if (existingPasswordAdmins.length > 0) {
      return res.status(403).json({
        error: 'Administrator account has already been initialized. Please sign in with your administrator credentials.',
      });
    }

    const existingUser = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, cleanEmail))
      .limit(1);

    let adminProfile;
    if (existingUser.length > 0) {
      const [updated] = await db
        .update(profiles)
        .set({
          fullName: cleanName.slice(0, 120),
          passwordHash: hashPassword(String(password)),
          role: 'admin',
          emailVerified: true,
          isSuspended: false,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, existingUser[0].id))
        .returning();
      adminProfile = updated;
    } else {
      const [created] = await db
        .insert(profiles)
        .values({
          id: `adm_${crypto.randomUUID()}`,
          fullName: cleanName.slice(0, 120),
          email: cleanEmail,
          passwordHash: hashPassword(String(password)),
          authProvider: 'email',
          emailVerified: true,
          role: 'admin',
          institution: 'DeepSea BioAI Administration',
          researchInterest: 'Bioinformatics',
        })
        .returning();
      adminProfile = created;
    }

    await writeAuditLog(adminProfile.id, 'ADMIN_INITIALIZED', 'profile', adminProfile.id, {
      email: adminProfile.email,
    });

    const token = createSessionToken(adminProfile.id, false);
    return res.status(201).json({
      token,
      profile: toSafeProfile(adminProfile),
    });
  } catch (error) {
    console.error('Admin bootstrap error:', error);
    return res.status(500).json({ error: 'Administrator initialization failed.' });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail) || !password) {
      return res.status(400).json({ error: 'Administrator email and password are required.' });
    }

    const rows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, cleanEmail))
      .limit(1);

    const user = rows[0];
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid administrator credentials.' });
    }
    if (!verifyPassword(String(password), user.passwordHash)) {
      await writeAuditLog(user.id, 'ADMIN_LOGIN_FAILED', 'auth', cleanEmail, {
        reason: 'invalid_password',
      });
      return res.status(401).json({ error: 'Invalid administrator credentials.' });
    }

    if (user.role !== 'admin') {
      await writeAuditLog(user.id, 'ADMIN_LOGIN_DENIED_NON_ADMIN', 'auth', cleanEmail, {
        role: user.role,
      });
      return res.status(403).json({
        error: 'Access denied. This account does not hold administrator privileges.',
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({ error: 'Administrator account is suspended.' });
    }

    await writeAuditLog(user.id, 'ADMIN_LOGIN_SUCCESS', 'auth', user.id, {
      email: user.email,
    });

    const token = createSessionToken(user.id, false);
    return res.json({
      token,
      profile: toSafeProfile(user),
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'Administrator authentication failed.' });
  }
});

app.get('/api/admin/overview', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [
      totalUsersRes,
      verifiedUsersRes,
      totalDatasetsRes,
      totalJobsRes,
      failedJobsRes,
      totalSeqsRes,
      recentLogs,
      recentJobs,
    ] = await Promise.all([
      db.select({ value: count() }).from(profiles),
      db.select({ value: count() }).from(profiles).where(eq(profiles.emailVerified, true)),
      db.select({ value: count() }).from(datasets),
      db.select({ value: count() }).from(analysisJobs),
      db.select({ value: count() }).from(analysisJobs).where(eq(analysisJobs.status, 'failed')),
      db.select({ value: count() }).from(sequences),
      db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(25),
      db.select().from(analysisJobs).orderBy(desc(analysisJobs.startedAt)).limit(20),
    ]);

    return res.json({
      stats: {
        totalUsers: Number(totalUsersRes[0]?.value || 0),
        verifiedUsers: Number(verifiedUsersRes[0]?.value || 0),
        totalDatasets: Number(totalDatasetsRes[0]?.value || 0),
        totalJobs: Number(totalJobsRes[0]?.value || 0),
        failedJobs: Number(failedJobsRes[0]?.value || 0),
        totalSequencesProcessed: Number(totalSeqsRes[0]?.value || 0),
      },
      systemStatus: {
        database: 'Connected (Cloud SQL PostgreSQL)',
        aiEngine: process.env.GEMINI_API_KEY ? 'Configured (Gemini API)' : 'Awaiting GEMINI_API_KEY',
        referenceDatabase: REFERENCE_DATABASE_NAME,
        storageMode: 'Private Confined Storage (edna-datasets)',
      },
      recentAuditLogs: recentLogs,
      recentJobs,
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    return res.status(500).json({ error: 'Failed to load administrator overview.' });
  }
});

app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const search = String(req.query.search || '').trim().toLowerCase();
    const allUsers = await db.select().from(profiles).orderBy(desc(profiles.createdAt));
    const safeUsers = allUsers
      .map(toSafeProfile)
      .filter((u) => {
        if (!search) return true;
        return (
          u.fullName.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          u.institution.toLowerCase().includes(search) ||
          u.role.toLowerCase().includes(search)
        );
      });
    return res.json({ users: safeUsers });
  } catch (error) {
    console.error('Admin users error:', error);
    return res.status(500).json({ error: 'Unable to list users.' });
  }
});

app.patch('/api/admin/users/:id/status', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const targetId = req.params.id;
    const { isSuspended } = req.body || {};
    if (typeof isSuspended !== 'boolean') {
      return res.status(400).json({ error: 'isSuspended boolean is required.' });
    }
    if (targetId === req.profile!.id && isSuspended) {
      return res.status(400).json({ error: 'You cannot suspend your own administrator account.' });
    }

    const [updated] = await db
      .update(profiles)
      .set({ isSuspended, updatedAt: new Date() })
      .where(eq(profiles.id, targetId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await writeAuditLog(
      req.profile!.id,
      isSuspended ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
      'profile',
      targetId,
      { targetEmail: updated.email }
    );

    return res.json({ user: toSafeProfile(updated) });
  } catch (error) {
    console.error('Admin update status error:', error);
    return res.status(500).json({ error: 'Failed to update account status.' });
  }
});

app.patch('/api/admin/users/:id/role', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const targetId = req.params.id;
    const role = String(req.body?.role || '') as UserRole;
    if (!ALLOWED_ROLES.has(role)) {
      return res.status(400).json({ error: 'Invalid role. Allowed: user, researcher, admin.' });
    }
    if (targetId === req.profile!.id && role !== 'admin') {
      return res.status(400).json({ error: 'You cannot remove your own administrator role.' });
    }

    const [updated] = await db
      .update(profiles)
      .set({ role, updatedAt: new Date() })
      .where(eq(profiles.id, targetId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await writeAuditLog(req.profile!.id, 'USER_ROLE_UPDATED', 'profile', targetId, {
      targetEmail: updated.email,
      newRole: role,
    });

    return res.json({ user: toSafeProfile(updated) });
  } catch (error) {
    console.error('Admin update role error:', error);
    return res.status(500).json({ error: 'Failed to update user role.' });
  }
});

app.get('/api/admin/datasets', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    // Metadata-only governance view — never leaks private raw DNA sequences
    const rows = await db
      .select({
        id: datasets.id,
        datasetName: datasets.datasetName,
        sampleName: datasets.sampleName,
        fileFormat: datasets.fileFormat,
        fileSize: datasets.fileSize,
        sampleType: datasets.sampleType,
        status: datasets.status,
        createdAt: datasets.createdAt,
        ownerName: profiles.fullName,
        ownerEmail: profiles.email,
      })
      .from(datasets)
      .innerJoin(profiles, eq(datasets.userId, profiles.id))
      .orderBy(desc(datasets.createdAt))
      .limit(100);

    await writeAuditLog(req.profile!.id, 'ADMIN_VIEWED_DATASET_METADATA', 'datasets', 'catalog', {
      count: rows.length,
    });

    return res.json({ datasets: rows });
  } catch (error) {
    console.error('Admin datasets error:', error);
    return res.status(500).json({ error: 'Failed to load dataset metadata.' });
  }
});

app.get('/api/admin/settings', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const rows = await db.select().from(systemSettings);
    const map: Record<string, unknown> = {
      maxUploadSizeMb: 15,
      allowPublicRegistration: true,
      requireEmailVerificationForExport: false,
      allowAdminRawSequenceInspection: false,
      defaultReferenceDatabase: REFERENCE_DATABASE_NAME,
    };
    for (const r of rows) {
      map[r.key] = r.value?.val ?? r.value;
    }
    return res.json({ settings: map });
  } catch (error) {
    console.error('Admin get settings error:', error);
    return res.status(500).json({ error: 'Failed to fetch system settings.' });
  }
});

app.put('/api/admin/settings', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const allowedKeys = [
      'maxUploadSizeMb',
      'allowPublicRegistration',
      'requireEmailVerificationForExport',
      'allowAdminRawSequenceInspection',
      'defaultReferenceDatabase',
    ];
    const updates = req.body || {};

    for (const key of allowedKeys) {
      if (key in updates) {
        await db
          .insert(systemSettings)
          .values({
            key,
            value: { val: updates[key] },
            updatedBy: req.profile!.email,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: systemSettings.key,
            set: {
              value: { val: updates[key] },
              updatedBy: req.profile!.email,
              updatedAt: new Date(),
            },
          });
      }
    }

    await writeAuditLog(req.profile!.id, 'SYSTEM_SETTINGS_UPDATED', 'system_settings', 'global', {
      keys: Object.keys(updates).filter((k) => allowedKeys.includes(k)),
    });

    return res.json({ message: 'System settings saved.' });
  } catch (error) {
    console.error('Admin update settings error:', error);
    return res.status(500).json({ error: 'Failed to update system settings.' });
  }
});

// ==================== SERVER STARTUP (DEV VITE MIDDLEWARE / PROD STATIC) ====================

async function startServer() {
  const PORT = Number(process.env.PORT || 3000);
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DeepSea BioAI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
