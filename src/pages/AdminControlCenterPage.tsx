import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Database,
  Eye,
  EyeOff,
  LogOut,
  Search,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import {
  LoadingSpinner,
  MetricCard,
  NotificationBanner,
  StatusText,
} from '../components/UI';
import { useAuth, useRole, type UserProfile, type UserRole } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

interface AdminOverview {
  stats: {
    totalUsers: number;
    verifiedUsers: number;
    totalDatasets: number;
    totalJobs: number;
    failedJobs: number;
    totalSequencesProcessed: number;
  };
  systemStatus: {
    database: string;
    aiEngine: string;
    referenceDatabase: string;
    storageMode: string;
  };
  recentAuditLogs: Array<{
    id: number;
    actorUserId: string;
    action: string;
    targetType: string;
    targetId: string;
    metadata: Record<string, unknown>;
    createdAt: string;
  }>;
  recentJobs: Array<{
    id: number;
    userId: string;
    datasetId: number;
    status: string;
    progress: number;
    errorMessage: string | null;
    startedAt: string;
    completedAt: string | null;
  }>;
}

interface AdminDatasetRow {
  id: number;
  datasetName: string;
  sampleName: string;
  fileFormat: string;
  fileSize: number;
  sampleType: string;
  status: string;
  createdAt: string;
  ownerName: string;
  ownerEmail: string;
}

export function AdminControlCenterPage() {
  const { profile, isAuthenticated, loginAsAdmin, bootstrapAdmin, loginWithGoogle, logout } =
    useAuth();
  const { isAdmin } = useRole();

  // Auth / first-run setup state
  const [bootstrapStatus, setBootstrapStatus] = useState<{
    needsSetup: boolean;
    envPasscodeConfigured: boolean;
  } | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('DeepSea Administrator');
  const [bootstrapPasscode, setBootstrapPasscode] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Admin dashboard state
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'datasets' | 'jobs' | 'settings'
  >('overview');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [datasetMeta, setDatasetMeta] = useState<AdminDatasetRow[]>([]);
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [loadingData, setLoadingData] = useState(false);
  const [adminNotice, setAdminNotice] = useState('');
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      apiFetch<{ needsSetup: boolean; envPasscodeConfigured: boolean }>(
        '/api/admin/bootstrap-status',
        { skipAuth: true }
      )
        .then(setBootstrapStatus)
        .catch(() => setBootstrapStatus({ needsSetup: false, envPasscodeConfigured: false }));
    }
  }, [isAdmin]);

  const loadAdminData = async () => {
    setLoadingData(true);
    setAdminError('');
    try {
      const [ov, us, ds, st] = await Promise.all([
        apiFetch<AdminOverview>('/api/admin/overview'),
        apiFetch<{ users: UserProfile[] }>('/api/admin/users'),
        apiFetch<{ datasets: AdminDatasetRow[] }>('/api/admin/datasets'),
        apiFetch<{ settings: Record<string, unknown> }>('/api/admin/settings'),
      ]);
      setOverview(ov);
      setUsers(us.users);
      setDatasetMeta(ds.datasets);
      setSettings(st.settings);
    } catch (err: unknown) {
      setAdminError(
        err instanceof Error ? err.message : 'Unable to load administrator telemetry.'
      );
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadAdminData();
    }
  }, [isAuthenticated, isAdmin]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      await loginAsAdmin(email.trim(), password);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Administrator sign-in failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      await bootstrapAdmin({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        bootstrapPasscode: bootstrapPasscode.trim() || undefined,
      });
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Administrator setup failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleAdminSignIn = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const signedIn = await loginWithGoogle();
      if (signedIn.role !== 'admin') {
        setAuthError('Signed-in Google account does not hold administrator authorization.');
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Google authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const toggleUserSuspended = async (u: UserProfile) => {
    setAdminError('');
    setAdminNotice('');
    try {
      await apiFetch(`/api/admin/users/${u.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isSuspended: !u.isSuspended }),
      });
      setAdminNotice(
        `${u.email} ${!u.isSuspended ? 'suspended' : 'reactivated'} and recorded in audit logs.`
      );
      await loadAdminData();
    } catch (err: unknown) {
      setAdminError(err instanceof Error ? err.message : 'Failed to update user status.');
    }
  };

  const updateUserRole = async (u: UserProfile, role: UserRole) => {
    setAdminError('');
    setAdminNotice('');
    try {
      await apiFetch(`/api/admin/users/${u.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      setAdminNotice(`Updated role for ${u.email} to ${role} and recorded in audit logs.`);
      await loadAdminData();
    } catch (err: unknown) {
      setAdminError(err instanceof Error ? err.message : 'Failed to update role.');
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminNotice('');
    try {
      await apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      setAdminNotice('Platform system settings updated and audit-logged.');
      await loadAdminData();
    } catch (err: unknown) {
      setAdminError(err instanceof Error ? err.message : 'Failed to save system settings.');
    }
  };

  // Unauthenticated Administrator Login / First-Run Claim Screen
  if (!isAuthenticated || !isAdmin) {
    const showBootstrap = Boolean(bootstrapStatus?.needsSetup);

    return (
      <div className="min-h-screen bg-[#061326] text-slate-100 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <Logo variant="admin" inverted />
          </div>

          <div className="bg-[#0C2342] border border-[#1B3A63] rounded-xl p-6 sm:p-8 space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono text-[#21D4FD]">
                <Shield className="h-4 w-4" />
                <span>Restricted Server-Authorized Portal</span>
              </div>
              <h1 className="text-xl font-bold text-white">
                {showBootstrap
                  ? 'Initialize Administrator Account'
                  : 'Administrator Sign In'}
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed">
                {showBootstrap
                  ? 'No password-based administrator has been claimed yet. Create the initial administrator credential below; this one-time form locks automatically once claimed.'
                  : 'Authenticate with an administrator account verified on the server.'}
              </p>
            </div>

            {authError && (
              <NotificationBanner
                type="error"
                message={authError}
                onDismiss={() => setAuthError('')}
              />
            )}

            <button
              type="button"
              onClick={handleGoogleAdminSignIn}
              disabled={authLoading}
              className="w-full py-2.5 px-4 rounded-lg border border-[#244878] bg-[#071B35] text-xs font-semibold text-white hover:bg-[#102B4F] transition-colors disabled:opacity-50"
            >
              Sign in with Authorized Google Account
            </button>

            <div className="relative flex items-center">
              <div className="flex-1 border-t border-[#1B3A63]" />
              <span className="px-3 text-[11px] text-slate-400">or administrator credentials</span>
              <div className="flex-1 border-t border-[#1B3A63]" />
            </div>

            <form
              onSubmit={showBootstrap ? handleBootstrap : handleAdminLogin}
              className="space-y-4"
            >
              {showBootstrap && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Administrator Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[#071B35] border border-[#1B3A63] text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Administrator Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@institution.edu"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[#071B35] border border-[#1B3A63] text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 chars (upper, lower, number)"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-lg text-sm bg-[#071B35] border border-[#1B3A63] text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {showBootstrap && bootstrapStatus?.envPasscodeConfigured && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Server Bootstrap Passcode
                  </label>
                  <input
                    type="password"
                    required
                    value={bootstrapPasscode}
                    onChange={(e) => setBootstrapPasscode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[#071B35] border border-[#1B3A63] text-white"
                  />
                </div>
              )}

              {!showBootstrap && (
                <div className="text-right">
                  <Link
                    to="/forgot-password"
                    className="text-xs text-[#21D4FD] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#13B8A6] text-[#061326] text-sm font-semibold hover:bg-[#21D4FD] transition-colors disabled:opacity-50"
              >
                {authLoading
                  ? 'Verifying...'
                  : showBootstrap
                    ? 'Claim Administrator Account'
                    : 'Authenticate to Control Center'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.institution.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#061326] text-slate-100">
      <header className="sticky top-0 z-30 bg-[#071B35] border-b border-[#17345A] px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
        <Logo variant="admin" inverted />
        <div className="flex items-center gap-4 text-xs">
          <span className="hidden sm:inline text-slate-300 font-mono">
            {profile?.email} (admin)
          </span>
          <Link
            to="/dashboard"
            className="px-3 py-1.5 rounded-lg border border-[#1B3A63] text-slate-200 hover:bg-[#102B4F]"
          >
            Researcher View
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-200 hover:bg-rose-900/60"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Secure Control Center</h1>
            <p className="text-xs text-slate-400 mt-1">
              Server-authorized governance, user lifecycle management, analysis job diagnostics, and
              immutable audit logging.
            </p>
          </div>
          <div className="flex flex-wrap gap-1 p-1 bg-[#0C2342] border border-[#1B3A63] rounded-lg">
            {(
              [
                { id: 'overview', label: 'Overview', icon: Activity },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'datasets', label: 'Datasets', icon: Database },
                { id: 'jobs', label: 'Jobs & Audit', icon: Shield },
                { id: 'settings', label: 'Settings', icon: Settings },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#13B8A6] text-[#061326]'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {adminError && (
          <NotificationBanner type="error" message={adminError} onDismiss={() => setAdminError('')} />
        )}
        {adminNotice && (
          <NotificationBanner
            type="success"
            message={adminNotice}
            onDismiss={() => setAdminNotice('')}
          />
        )}

        {loadingData && !overview ? (
          <LoadingSpinner label="Querying platform telemetry..." />
        ) : (
          <>
            {activeTab === 'overview' && overview && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <MetricCard label="Registered Users" value={overview.stats.totalUsers} />
                  <MetricCard label="Verified Users" value={overview.stats.verifiedUsers} />
                  <MetricCard label="Total Datasets" value={overview.stats.totalDatasets} />
                  <MetricCard label="Analysis Jobs" value={overview.stats.totalJobs} />
                  <MetricCard label="Failed Jobs" value={overview.stats.failedJobs} />
                  <MetricCard
                    label="Sequences Processed"
                    value={overview.stats.totalSequencesProcessed.toLocaleString()}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <section className="lg:col-span-5 bg-[#0C2342] border border-[#1B3A63] rounded-xl p-5 space-y-3">
                    <h2 className="text-sm font-semibold text-white">Infrastructure Status</h2>
                    <dl className="divide-y divide-[#1B3A63] text-xs">
                      <div className="py-2.5 flex justify-between gap-2">
                        <dt className="text-slate-400">Database</dt>
                        <dd className="font-mono text-teal-300">{overview.systemStatus.database}</dd>
                      </div>
                      <div className="py-2.5 flex justify-between gap-2">
                        <dt className="text-slate-400">BioAI Engine</dt>
                        <dd className="font-mono text-cyan-300">{overview.systemStatus.aiEngine}</dd>
                      </div>
                      <div className="py-2.5 flex justify-between gap-2">
                        <dt className="text-slate-400">Storage Bucket</dt>
                        <dd className="text-slate-200">{overview.systemStatus.storageMode}</dd>
                      </div>
                      <div className="py-2.5 flex justify-between gap-2">
                        <dt className="text-slate-400">Reference DB</dt>
                        <dd className="text-slate-200 text-right">
                          {overview.systemStatus.referenceDatabase}
                        </dd>
                      </div>
                    </dl>
                  </section>

                  <section className="lg:col-span-7 bg-[#0C2342] border border-[#1B3A63] rounded-xl p-5 space-y-3">
                    <h2 className="text-sm font-semibold text-white">Recent Audit Activity</h2>
                    <div className="overflow-x-auto max-h-72">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-[#1B3A63] text-slate-400">
                            <th className="py-2 pr-3">Action</th>
                            <th className="py-2 pr-3">Target</th>
                            <th className="py-2 text-right">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1B3A63]">
                          {overview.recentAuditLogs.slice(0, 10).map((log) => (
                            <tr key={log.id}>
                              <td className="py-2 pr-3 font-mono text-cyan-300">{log.action}</td>
                              <td className="py-2 pr-3 text-slate-300">
                                {log.targetType}: {log.targetId}
                              </td>
                              <td className="py-2 text-right font-mono text-slate-400 whitespace-nowrap">
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <section className="bg-[#0C2342] border border-[#1B3A63] rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-white">
                    Registered Accounts ({filteredUsers.length})
                  </h2>
                  <div className="relative w-full sm:w-72">
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search name, email, institution..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-[#071B35] border border-[#1B3A63] text-white"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#1B3A63] text-slate-400">
                        <th className="py-2.5 pr-4">User</th>
                        <th className="py-2.5 pr-4">Institution &amp; Focus</th>
                        <th className="py-2.5 pr-4">Role</th>
                        <th className="py-2.5 pr-4">Status</th>
                        <th className="py-2.5 text-right">Governance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1B3A63]">
                      {filteredUsers.map((u) => (
                        <tr key={u.id}>
                          <td className="py-3 pr-4">
                            <div className="font-medium text-white">{u.fullName}</div>
                            <div className="text-slate-400 font-mono">{u.email}</div>
                          </td>
                          <td className="py-3 pr-4 text-slate-300">
                            <div>{u.institution || '—'}</div>
                            <div className="text-slate-400">{u.researchInterest}</div>
                          </td>
                          <td className="py-3 pr-4">
                            <select
                              value={u.role}
                              disabled={u.id === profile?.id}
                              onChange={(e) => updateUserRole(u, e.target.value as UserRole)}
                              className="px-2 py-1 rounded bg-[#071B35] border border-[#1B3A63] text-xs font-mono text-white disabled:opacity-60"
                            >
                              <option value="user">user</option>
                              <option value="researcher">researcher</option>
                              <option value="admin">admin</option>
                            </select>
                          </td>
                          <td className="py-3 pr-4">
                            <StatusText status={u.isSuspended ? 'Suspended' : 'Active'} />
                            <div className="text-[11px] text-slate-400">
                              {u.emailVerified ? 'Verified' : 'Unverified'}
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              disabled={u.id === profile?.id}
                              onClick={() => toggleUserSuspended(u)}
                              className="px-3 py-1.5 rounded-md border border-[#1B3A63] text-xs font-medium text-slate-200 hover:bg-[#133058] disabled:opacity-40"
                            >
                              {u.isSuspended ? 'Reactivate' : 'Suspend'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === 'datasets' && (
              <section className="bg-[#0C2342] border border-[#1B3A63] rounded-xl p-5 space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Dataset Metadata Catalog ({datasetMeta.length})
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Privacy-preserving administrative catalog: raw private DNA sequences are not
                    exposed here by default.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#1B3A63] text-slate-400">
                        <th className="py-2.5 pr-4">Dataset / Sample</th>
                        <th className="py-2.5 pr-4">Owner</th>
                        <th className="py-2.5 pr-4">Type &amp; Format</th>
                        <th className="py-2.5 pr-4">Status</th>
                        <th className="py-2.5 text-right">Uploaded</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1B3A63]">
                      {datasetMeta.map((d) => (
                        <tr key={d.id}>
                          <td className="py-3 pr-4">
                            <div className="font-medium text-white">{d.datasetName}</div>
                            <div className="font-mono text-slate-400">{d.sampleName}</div>
                          </td>
                          <td className="py-3 pr-4 text-slate-300">
                            <div>{d.ownerName}</div>
                            <div className="font-mono text-slate-400">{d.ownerEmail}</div>
                          </td>
                          <td className="py-3 pr-4 text-slate-300">
                            {d.sampleType} · {d.fileFormat} ({(d.fileSize / 1024).toFixed(1)} KB)
                          </td>
                          <td className="py-3 pr-4">
                            <StatusText status={d.status} />
                          </td>
                          <td className="py-3 text-right font-mono text-slate-400">
                            {new Date(d.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === 'jobs' && overview && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="bg-[#0C2342] border border-[#1B3A63] rounded-xl p-5 space-y-3">
                  <h2 className="text-sm font-semibold text-white">Analysis Job History &amp; Errors</h2>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-[#1B3A63] text-slate-400">
                          <th className="py-2 pr-3">Job #</th>
                          <th className="py-2 pr-3">Status</th>
                          <th className="py-2 pr-3">Error Log</th>
                          <th className="py-2 text-right">Started</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1B3A63]">
                        {overview.recentJobs.map((j) => (
                          <tr key={j.id}>
                            <td className="py-2.5 pr-3 font-mono text-white">
                              #{j.id} (DS-{j.datasetId})
                            </td>
                            <td className="py-2.5 pr-3">
                              <StatusText status={j.status} />
                            </td>
                            <td className="py-2.5 pr-3 text-rose-300">
                              {j.errorMessage || '—'}
                            </td>
                            <td className="py-2.5 text-right font-mono text-slate-400">
                              {new Date(j.startedAt).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="bg-[#0C2342] border border-[#1B3A63] rounded-xl p-5 space-y-3">
                  <h2 className="text-sm font-semibold text-white">Security &amp; Governance Audit Log</h2>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-[#1B3A63] text-slate-400">
                          <th className="py-2 pr-3">Action</th>
                          <th className="py-2 pr-3">Actor / Target</th>
                          <th className="py-2 text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1B3A63]">
                        {overview.recentAuditLogs.map((log) => (
                          <tr key={log.id}>
                            <td className="py-2.5 pr-3 font-mono text-cyan-300">{log.action}</td>
                            <td className="py-2.5 pr-3 text-slate-300">
                              {log.targetType}:{log.targetId}
                            </td>
                            <td className="py-2.5 text-right font-mono text-slate-400">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'settings' && (
              <section className="bg-[#0C2342] border border-[#1B3A63] rounded-xl p-6 max-w-2xl space-y-5">
                <h2 className="text-sm font-semibold text-white">Platform Policy Settings</h2>
                <form onSubmit={saveSettings} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1">Max Upload File Size (MB)</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={Number(settings.maxUploadSizeMb ?? 15)}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          maxUploadSizeMb: Number(e.target.value),
                        }))
                      }
                      className="w-36 px-3 py-2 rounded-lg bg-[#071B35] border border-[#1B3A63] text-white font-mono"
                    />
                  </div>
                  <label className="flex items-center gap-2.5 text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.allowPublicRegistration ?? true)}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          allowPublicRegistration: e.target.checked,
                        }))
                      }
                    />
                    <span>Allow public researcher account registration (always assigns user role)</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.allowAdminRawSequenceInspection ?? false)}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          allowAdminRawSequenceInspection: e.target.checked,
                        }))
                      }
                    />
                    <span>
                      Require explicit policy flag before permitting administrative sequence audits
                    </span>
                  </label>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-lg bg-[#13B8A6] text-[#061326] font-semibold hover:bg-[#21D4FD]"
                  >
                    Save System Settings
                  </button>
                </form>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
