import React, { useState } from 'react';
import { Camera, Moon, Save, ShieldCheck, Sun } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { NotificationBanner, StatusText } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiFetch } from '../lib/api';
import { firebaseStatus } from '../lib/firebase';

const RESEARCH_INTERESTS = [
  'Marine Biodiversity',
  'Environmental DNA',
  'Bioinformatics',
  'Ecology',
  'Conservation Biology',
  'Molecular Biology',
  'Other',
];

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [institution, setInstitution] = useState(profile?.institution || '');
  const [researchInterest, setResearchInterest] = useState(
    profile?.researchInterest || 'Marine Biodiversity'
  );
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Profile picture must be PNG, JPEG, or WEBP.');
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      setError('Profile picture must be smaller than 1.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      await apiFetch('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: fullName.trim(),
          institution: institution.trim(),
          researchInterest,
          avatarUrl,
        }),
      });
      await refreshProfile();
      setMessage('Researcher profile updated successfully.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwMessage('');
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    setPwSaving(true);
    try {
      const res = await apiFetch<{ message: string }>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPwMessage(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'Password update failed.');
    } finally {
      setPwSaving(false);
    }
  };

  const initials = (profile?.fullName || 'R')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <DashboardLayout
      title="Researcher Profile"
      subtitle="Manage your academic profile, institution affiliation, avatar, and account credentials."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Details Form */}
        <section className="lg:col-span-7 bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-[#1B3A63]">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={profile?.fullName}
                  referrerPolicy="no-referrer"
                  className="h-14 w-14 rounded-full object-cover border border-slate-200 dark:border-[#1B3A63]"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-[#0A4C7A] text-white text-lg font-bold flex items-center justify-center">
                  {initials}
                </div>
              )}
              <div>
                <h2 className="text-base font-semibold text-[#071B35] dark:text-white">
                  {profile?.fullName}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {profile?.email} ·{' '}
                  <StatusText
                    status={profile?.emailVerified ? 'Verified' : 'Pending'}
                  />
                </p>
              </div>
            </div>

            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-[#1B3A63] text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#133058]">
              <Camera className="h-3.5 w-3.5" />
              <span>Upload Photo</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>

          {error && <NotificationBanner type="error" message={error} onDismiss={() => setError('')} />}
          {message && <NotificationBanner type="success" message={message} onDismiss={() => setMessage('')} />}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Institution / Organization
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="University or Marine Laboratory"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Research Interest
                </label>
                <select
                  value={researchInterest}
                  onChange={(e) => setResearchInterest(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white"
                >
                  {RESEARCH_INTERESTS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span>
                Assigned Role:{' '}
                <strong className="font-mono text-[#071B35] dark:text-white">
                  {profile?.role}
                </strong>{' '}
                (managed server-side)
              </span>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326] text-xs font-semibold disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </section>

        {/* Change Password Panel */}
        <section className="lg:col-span-5 bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-[#071B35] dark:text-white">
            Update Password
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Set or change your email/password login credential. Passwords require at least 8
            characters including uppercase, lowercase, and a digit.
          </p>

          {pwError && <NotificationBanner type="error" message={pwError} />}
          {pwMessage && <NotificationBanner type="success" message={pwMessage} />}

          <form onSubmit={handleChangePassword} className="space-y-3.5">
            {profile?.authProvider === 'email' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white"
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
                className="w-full px-3.5 py-2 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white"
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
                className="w-full px-3.5 py-2 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={pwSaving}
              className="w-full py-2.5 px-4 rounded-lg bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326] text-xs font-semibold disabled:opacity-50"
            >
              {pwSaving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
}

export function AccountSettingsPage() {
  const { profile } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <DashboardLayout
      title="Account Settings"
      subtitle="Configure display appearance, review account authentication status, and inspect optional telemetry integrations."
    >
      <div className="max-w-3xl space-y-6">
        <section className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-[#071B35] dark:text-white">
            Interface Appearance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Choose between crisp clinical light mode and deep-ocean dark mode for prolonged
            bioinformatics review sessions.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                theme === 'light'
                  ? 'bg-[#071B35] text-white border-[#071B35]'
                  : 'border-slate-300 dark:border-[#1B3A63] text-slate-600 dark:text-slate-300'
              }`}
            >
              <Sun className="h-4 w-4" />
              <span>Light Mode</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                theme === 'dark'
                  ? 'bg-[#13B8A6] text-[#061326] border-[#13B8A6]'
                  : 'border-slate-300 dark:border-[#1B3A63] text-slate-600 dark:text-slate-300'
              }`}
            >
              <Moon className="h-4 w-4" />
              <span>Dark Mode</span>
            </button>
          </div>
        </section>

        <section className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-[#0A4C7A] dark:text-[#21D4FD]" />
            <h2 className="text-base font-semibold text-[#071B35] dark:text-white">
              Security &amp; Integration Status
            </h2>
          </div>
          <dl className="divide-y divide-slate-200 dark:divide-[#1B3A63] text-xs">
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">Primary Authentication</dt>
              <dd className="font-medium text-[#071B35] dark:text-white">
                {profile?.authProvider === 'google' ? 'Google OAuth (Firebase Auth)' : 'Email & Scrypt Password'}
              </dd>
            </div>
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">Email Verification</dt>
              <dd>
                <StatusText status={profile?.emailVerified ? 'Verified' : 'Pending'} />
              </dd>
            </div>
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">Dataset Privacy Scope</dt>
              <dd className="font-medium text-[#071B35] dark:text-white">
                Private per-user isolation (edna-datasets)
              </dd>
            </div>
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">Optional Firebase Analytics</dt>
              <dd className="text-right text-slate-600 dark:text-slate-300">
                {firebaseStatus.hasAnalytics
                  ? `Active (${firebaseStatus.projectId})`
                  : 'Optional measurement ID not configured; core platform fully operational.'}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </DashboardLayout>
  );
}
