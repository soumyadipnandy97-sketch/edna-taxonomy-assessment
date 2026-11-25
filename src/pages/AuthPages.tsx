import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Logo } from '../components/Logo';
import { NotificationBanner, SafeImage } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

const AUTH_IMG = '/src/assets/images/auth_marine_lab_1795609535671.jpg';

const RESEARCH_INTERESTS = [
  'Marine Biodiversity',
  'Environmental DNA',
  'Bioinformatics',
  'Ecology',
  'Conservation Biology',
  'Molecular Biology',
  'Other',
];

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
      />
    </svg>
  );
}

function AuthSplitShell({
  heading,
  subheading,
  children,
}: {
  heading: string;
  subheading: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 dark:bg-[#061326]">
      {/* Left Scientific Brand Column */}
      <div className="hidden lg:flex lg:col-span-5 relative overflow-hidden bg-[#071B35] text-white flex-col justify-between p-10">
        <div className="absolute inset-0">
          <SafeImage
            src={AUTH_IMG}
            alt="Marine genomics filtration laboratory"
            className="w-full h-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#071B35]/90 via-[#071B35]/70 to-[#071B35]/95" />
        </div>

        <div className="relative z-10">
          <Link to="/">
            <Logo variant="login" inverted />
          </Link>
        </div>

        <div className="relative z-10 space-y-4 max-w-md">
          <h2 className="text-2xl font-bold tracking-tight text-white text-balance">
            {heading}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">{subheading}</p>
          <div className="pt-4 border-t border-white/15 text-xs font-mono text-cyan-300/90">
            Problem Statement ID 25042 · Taxonomic Identification & Biodiversity Assessment
          </div>
        </div>
      </div>

      {/* Right Form Column */}
      <div className="lg:col-span-7 flex flex-col justify-center px-5 sm:px-10 py-10">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#071B35] dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to DeepSea BioAI</span>
            </Link>
            <div className="lg:hidden">
              <Logo variant="compact" />
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    setLoading(true);
    try {
      await loginWithEmail(email.trim(), password, rememberMe);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Google sign-in was cancelled or failed. Please try again.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthSplitShell
      heading="Welcome back to your eDNA research workspace"
      subheading="Access your environmental DNA datasets, taxonomic classification runs, biodiversity assessments, and BioAI Assistant conversations."
    >
      <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-[#071B35] dark:text-white">Sign In</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Sign in with your researcher account or Google workspace credentials.
          </p>
        </div>

        {error && <NotificationBanner type="error" message={error} onDismiss={() => setError('')} />}

        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-[#244878] bg-white dark:bg-[#071B35] text-sm font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#102B4F] transition-colors disabled:opacity-50"
        >
          <GoogleIcon />
          <span>{googleLoading ? 'Connecting Google...' : 'Continue with Google'}</span>
        </button>

        <div className="relative flex items-center">
          <div className="flex-1 border-t border-slate-200 dark:border-[#1B3A63]" />
          <span className="px-3 text-xs text-slate-400">or sign in with email</span>
          <div className="flex-1 border-t border-slate-200 dark:border-[#1B3A63]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="login-email" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="researcher@institution.edu"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-[#0A4C7A] focus:ring-cyan-500"
              />
              <span>Remember session</span>
            </label>
            <Link
              to="/forgot-password"
              className="font-medium text-[#0A4C7A] dark:text-[#21D4FD] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326] text-sm font-semibold hover:bg-[#0A4C7A] dark:hover:bg-[#21D4FD] transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 dark:text-slate-400">
          New to DeepSea BioAI?{' '}
          <Link to="/register" className="font-semibold text-[#0A4C7A] dark:text-[#21D4FD] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </AuthSplitShell>
  );
}

export function RegisterPage() {
  const { registerWithEmail, loginWithGoogle, verifyEmailToken } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [institution, setInstitution] = useState('');
  const [researchInterest, setResearchInterest] = useState('Marine Biodiversity');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationState, setVerificationState] = useState<{
    email: string;
    token?: string;
    verified: boolean;
  } | null>(null);

  const strength = useMemo(() => {
    const checks = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    };
    const score = Object.values(checks).filter(Boolean).length;
    const label = score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong';
    return { checks, score, label };
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (fullName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (strength.score < 4) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, and a number.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!acceptedTerms) {
      setError('Please accept the Terms and Conditions and Privacy Policy to continue.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerWithEmail({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        institution: institution.trim(),
        researchInterest,
      });
      setVerificationState({
        email: res.profile.email,
        token: res.verificationToken,
        verified: false,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyNow = async () => {
    if (!verificationState?.token) return;
    setLoading(true);
    try {
      await verifyEmailToken(verificationState.token);
      setVerificationState((prev) => (prev ? { ...prev, verified: true } : null));
      setTimeout(() => navigate('/dashboard'), 900);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-up failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitShell
      heading="Create your DeepSea BioAI researcher profile"
      subheading="Upload FASTA, FASTQ, or CSV environmental DNA sequences, identify organisms across taxonomic hierarchies, and quantify marine biodiversity."
    >
      <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 sm:p-8 space-y-5">
        {verificationState ? (
          <div className="space-y-5 py-4 text-center">
            <CheckCircle2 className="h-11 w-11 text-teal-600 dark:text-teal-400 mx-auto" />
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-[#071B35] dark:text-white">
                {verificationState.verified ? 'Email Verified' : 'Verify Your Email Address'}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {verificationState.verified
                  ? 'Your researcher account is verified. Redirecting to your dashboard...'
                  : `We prepared a verification confirmation for ${verificationState.email}. Complete verification below to activate full researcher privileges.`}
              </p>
            </div>
            {!verificationState.verified && (
              <div className="flex flex-col gap-2.5 pt-2">
                {verificationState.token && (
                  <button
                    type="button"
                    onClick={handleVerifyNow}
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326] text-sm font-semibold hover:opacity-90"
                  >
                    {loading ? 'Verifying...' : 'Confirm Email Verification'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-2.5 px-4 rounded-lg border border-slate-300 dark:border-[#1B3A63] text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Continue to Dashboard
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-[#071B35] dark:text-white">Create Account</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Register for your private eDNA analysis workspace.
              </p>
            </div>

            {error && <NotificationBanner type="error" message={error} onDismiss={() => setError('')} />}

            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-[#244878] bg-white dark:bg-[#071B35] text-sm font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#102B4F] transition-colors"
            >
              <GoogleIcon />
              <span>Register with Google</span>
            </button>

            <div className="relative flex items-center">
              <div className="flex-1 border-t border-slate-200 dark:border-[#1B3A63]" />
              <span className="px-3 text-xs text-slate-400">or register with email</span>
              <div className="flex-1 border-t border-slate-200 dark:border-[#1B3A63]" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Elena Rostova"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="researcher@institution.edu"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Institution (Optional)
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Marine Science Lab"
                    className="w-full px-3 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Research Interest
                  </label>
                  <select
                    value={researchInterest}
                    onChange={(e) => setResearchInterest(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {RESEARCH_INTERESTS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            strength.score >= step
                              ? strength.score === 4
                                ? 'bg-teal-500'
                                : strength.score >= 3
                                  ? 'bg-sky-500'
                                  : 'bg-amber-500'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Strength: <span className="font-medium">{strength.label}</span> · 8+ chars,
                      uppercase, lowercase, and number required
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#0A4C7A] focus:ring-cyan-500"
                />
                <span>
                  I agree to the{' '}
                  <Link to="/terms" className="text-[#0A4C7A] dark:text-[#21D4FD] underline">
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-[#0A4C7A] dark:text-[#21D4FD] underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326] text-sm font-semibold hover:bg-[#0A4C7A] dark:hover:bg-[#21D4FD] transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-xs text-slate-600 dark:text-slate-400">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-[#0A4C7A] dark:text-[#21D4FD] hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthSplitShell>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ message: string; resetToken?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<{ message: string; resetToken?: string }>(
        '/api/auth/forgot-password',
        {
          method: 'POST',
          skipAuth: true,
          body: JSON.stringify({ email: email.trim() }),
        }
      );
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to send reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitShell
      heading="Reset your DeepSea BioAI credentials"
      subheading="Enter your registered researcher email address to generate a secure, time-limited password reset link."
    >
      <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 sm:p-8 space-y-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[#071B35] dark:text-white">Forgot Password</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            We will prepare a password reset link for your account.
          </p>
        </div>

        {error && <NotificationBanner type="error" message={error} />}

        {result ? (
          <div className="space-y-4">
            <NotificationBanner type="success" message={result.message} />
            {result.resetToken && (
              <Link
                to={`/reset-password?token=${encodeURIComponent(result.resetToken)}`}
                className="block w-full text-center py-2.5 px-4 rounded-lg bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326] text-sm font-semibold"
              >
                Proceed to Reset Password
              </Link>
            )}
            <Link
              to="/login"
              className="block text-center text-xs font-medium text-[#0A4C7A] dark:text-[#21D4FD] hover:underline"
            >
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Registered Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="researcher@institution.edu"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326] text-sm font-semibold disabled:opacity-50"
            >
              {loading ? 'Sending Reset Link...' : 'Send Password Reset Link'}
            </button>
          </form>
        )}
      </div>
    </AuthSplitShell>
  );
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token.trim()) {
      setError('Reset token is missing.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ token: token.trim(), newPassword }),
      });
      setDone(true);
      setTimeout(() => navigate('/login'), 1400);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitShell
      heading="Choose a new password"
      subheading="Passwords require at least 8 characters including uppercase, lowercase, and numeric characters."
    >
      <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 sm:p-8 space-y-5">
        <h1 className="text-2xl font-bold text-[#071B35] dark:text-white">Reset Password</h1>
        {error && <NotificationBanner type="error" message={error} />}
        {done ? (
          <NotificationBanner
            type="success"
            message="Password updated successfully. Redirecting to Sign In..."
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!searchParams.get('token') && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Reset Token
                </label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm font-mono bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars, upper, lower, number"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326] text-sm font-semibold disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </AuthSplitShell>
  );
}
