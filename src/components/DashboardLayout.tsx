import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  Database,
  Dna,
  FileText,
  GitCompare,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Network,
  Settings,
  Sun,
  Upload,
  User,
  X,
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const SIDEBAR_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/upload', label: 'Upload Dataset', icon: Upload },
  { to: '/dashboard/datasets', label: 'Dataset Library', icon: Database },
  { to: '/dashboard/analysis', label: 'Taxonomic Analysis', icon: Dna },
  { to: '/dashboard/taxonomy', label: 'Taxonomy Explorer', icon: Network },
  { to: '/dashboard/biodiversity', label: 'Biodiversity', icon: BarChart3 },
  { to: '/dashboard/compare', label: 'Sample Comparison', icon: GitCompare },
  { to: '/dashboard/assistant', label: 'BioAI Assistant', icon: MessageSquare },
  { to: '/dashboard/reports', label: 'Scientific Reports', icon: FileText },
];

const ACCOUNT_ITEMS = [
  { to: '/dashboard/profile', label: 'Profile', icon: User },
  { to: '/dashboard/settings', label: 'Account Settings', icon: Settings },
];

export function DashboardLayout({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = (profile?.fullName || 'R')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const renderNavLinks = (onNavigate?: () => void) => (
    <div className="flex flex-col h-full">
      <div className="px-5 h-16 flex items-center justify-between border-b border-slate-200 dark:border-[#17345A] shrink-0">
        <Link to="/" onClick={onNavigate}>
          <Logo variant="compact" />
        </Link>
        {onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Close sidebar"
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-[#133058]"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <nav aria-label="Workspace" className="space-y-1">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326]'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#102B4F] hover:text-[#071B35] dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-slate-200 dark:border-[#17345A]">
          <p className="px-3 mb-2 text-xs font-medium text-slate-400">Account</p>
          <nav aria-label="Account" className="space-y-1">
            {ACCOUNT_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326]'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#102B4F] hover:text-[#071B35] dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-3 border-t border-slate-200 dark:border-[#17345A] shrink-0">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#061326] text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-[#071B35] border-r border-slate-200 dark:border-[#17345A] z-30">
        {renderNavLinks()}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-[#071B35] h-full z-10 border-r border-slate-200 dark:border-[#17345A]">
            {renderNavLinks(() => setSidebarOpen(false))}
          </aside>
        </div>
      )}

      {/* Main Content Stage */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 h-16 bg-white/95 dark:bg-[#071B35]/95 backdrop-blur-sm border-b border-slate-200 dark:border-[#17345A] px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open workspace navigation"
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#102B4F]"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Workspace / {title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#102B4F] transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Workspace notifications"
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#102B4F] transition-colors"
              >
                <Bell className="h-4 w-4" />
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-4 shadow-lg z-40">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#1B3A63]">
                    <span className="text-xs font-semibold text-[#071B35] dark:text-white">
                      Account Notices
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      Close
                    </button>
                  </div>
                  <div className="py-3 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                    <p>
                      Email status:{' '}
                      <span className="font-medium text-[#071B35] dark:text-white">
                        {profile?.emailVerified ? 'Verified' : 'Verification pending'}
                      </span>
                    </p>
                    <p>
                      Reference engine: Local Curated Marine eDNA Marker DB (COI / 16S / 18S).
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/dashboard/profile"
              className="flex items-center gap-2.5 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#102B4F] transition-colors"
            >
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  referrerPolicy="no-referrer"
                  className="h-7 w-7 rounded-full object-cover border border-slate-200 dark:border-[#1B3A63]"
                />
              ) : (
                <span className="h-7 w-7 rounded-full bg-[#0A4C7A] text-white text-xs font-semibold flex items-center justify-center">
                  {initials}
                </span>
              )}
              <span className="hidden sm:inline text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[140px] truncate">
                {profile?.fullName}
              </span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#071B35] dark:text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
                  {subtitle}
                </p>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
