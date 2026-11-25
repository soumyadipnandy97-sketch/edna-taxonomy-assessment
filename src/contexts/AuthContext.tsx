import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { Navigate, useLocation } from 'react-router-dom';
import { auth, googleAuthProvider, initFirebaseAnalytics, trackScientificEvent } from '../lib/firebase';
import { apiFetch, getSessionToken, setSessionToken } from '../lib/api';

export type UserRole = 'user' | 'researcher' | 'admin';

export interface UserProfile {
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
  createdAt: string;
  updatedAt: string;
}

interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  institution?: string;
  researchInterest?: string;
}

interface AuthContextValue {
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  loginWithEmail: (email: string, password: string, rememberMe?: boolean) => Promise<UserProfile>;
  registerWithEmail: (
    payload: RegisterPayload
  ) => Promise<{ profile: UserProfile; verificationToken?: string; message: string }>;
  loginWithGoogle: () => Promise<UserProfile>;
  loginAsAdmin: (email: string, password: string) => Promise<UserProfile>;
  bootstrapAdmin: (payload: {
    fullName: string;
    email: string;
    password: string;
    bootstrapPasscode?: string;
  }) => Promise<UserProfile>;
  verifyEmailToken: (token: string) => Promise<UserProfile>;
  refreshProfile: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
}

interface RoleContextValue {
  role: UserRole | null;
  isAdmin: boolean;
  isResearcher: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentProfile = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const data = await apiFetch<{ profile: UserProfile }>('/api/auth/me');
      setProfile(data.profile);
      return data.profile;
    } catch {
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    initFirebaseAnalytics();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setSessionToken(null);
        await fetchCurrentProfile();
      } else if (!getSessionToken()) {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchCurrentProfile]);

  const loginWithEmail = async (
    email: string,
    password: string,
    rememberMe = false
  ): Promise<UserProfile> => {
    const res = await apiFetch<{ token: string; profile: UserProfile }>('/api/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email, password, rememberMe }),
    });
    setSessionToken(res.token);
    setProfile(res.profile);
    trackScientificEvent('login', { method: 'email' });
    return res.profile;
  };

  const registerWithEmail = async (payload: RegisterPayload) => {
    const res = await apiFetch<{
      token: string;
      profile: UserProfile;
      verificationToken?: string;
      message: string;
    }>('/api/auth/register', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify(payload),
    });
    setSessionToken(res.token);
    setProfile(res.profile);
    trackScientificEvent('sign_up', { method: 'email' });
    return {
      profile: res.profile,
      verificationToken: res.verificationToken,
      message: res.message,
    };
  };

  const loginWithGoogle = async (): Promise<UserProfile> => {
    setSessionToken(null);
    await signInWithPopup(auth, googleAuthProvider);
    const loaded = await fetchCurrentProfile();
    if (!loaded) {
      throw new Error('Google sign-in completed, but profile synchronization failed.');
    }
    trackScientificEvent('login', { method: 'google' });
    return loaded;
  };

  const loginAsAdmin = async (email: string, password: string): Promise<UserProfile> => {
    const res = await apiFetch<{ token: string; profile: UserProfile }>('/api/admin/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email, password }),
    });
    setSessionToken(res.token);
    setProfile(res.profile);
    return res.profile;
  };

  const bootstrapAdmin = async (payload: {
    fullName: string;
    email: string;
    password: string;
    bootstrapPasscode?: string;
  }): Promise<UserProfile> => {
    const res = await apiFetch<{ token: string; profile: UserProfile }>('/api/admin/bootstrap', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify(payload),
    });
    setSessionToken(res.token);
    setProfile(res.profile);
    return res.profile;
  };

  const verifyEmailToken = async (token: string): Promise<UserProfile> => {
    const res = await apiFetch<{ profile: UserProfile }>('/api/auth/verify-email', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ token }),
    });
    setProfile(res.profile);
    return res.profile;
  };

  const logout = async () => {
    setSessionToken(null);
    setProfile(null);
    try {
      await signOut(auth);
    } catch {
      // Ignore if not signed into Firebase
    }
  };

  const roleValue: RoleContextValue = {
    role: profile?.role ?? null,
    isAdmin: profile?.role === 'admin',
    isResearcher: profile?.role === 'researcher' || profile?.role === 'admin',
  };

  return (
    <AuthContext.Provider
      value={{
        profile,
        loading,
        isAuthenticated: Boolean(profile),
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginAsAdmin,
        bootstrapAdmin,
        verifyEmailToken,
        refreshProfile: fetchCurrentProfile,
        logout,
      }}
    >
      <RoleContext.Provider value={roleValue}>{children}</RoleContext.Provider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used inside AuthProvider');
  return ctx;
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#061326]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Verifying researcher session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const { isAdmin } = useRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#061326]">
        <div className="h-8 w-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  // If authenticated as a regular non-admin user, redirect away cleanly
  if (isAuthenticated && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
