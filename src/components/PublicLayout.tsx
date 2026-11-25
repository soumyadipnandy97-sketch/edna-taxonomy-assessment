import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const PUBLIC_NAV = [
  { to: '/about', label: 'About' },
  { to: '/features', label: 'Features' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/scientific-workflow', label: 'Workflow' },
  { to: '/contact', label: 'Contact' },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-[#061326] dark:text-slate-100">
      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#071B35]/95 backdrop-blur-sm border-b border-slate-200 dark:border-[#17345A]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand wordmark */}
          <Link to="/" className="whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md">
            <Logo variant="compact" />
          </Link>

          {/* Zone 2: 5 concise single-line nav links */}
          <nav aria-label="Primary" className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            {PUBLIC_NAV.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#071B35] dark:hover:text-white ${
                    active
                      ? 'text-[#0A4C7A] dark:text-[#21D4FD] underline underline-offset-8 decoration-2'
                      : ''
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary CTA */}
          <div className="hidden md:flex items-center shrink-0">
            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[#071B35] text-white hover:bg-[#0A4C7A] dark:bg-[#13B8A6] dark:text-[#061326] dark:hover:bg-[#21D4FD] transition-colors whitespace-nowrap shrink-0"
            >
              {isAuthenticated ? 'Open Dashboard' : 'Start Analysis'}
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0E2A4F]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-[#17345A] bg-white dark:bg-[#071B35] px-5 py-4 space-y-3">
            <nav className="flex flex-col gap-2">
              {PUBLIC_NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-[#0A4C7A] dark:hover:text-[#21D4FD]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="pt-3 border-t border-slate-200 dark:border-[#17345A] flex items-center justify-between gap-3">
              <Link
                to={isAuthenticated ? '/dashboard' : '/login'}
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center px-4 py-2.5 text-sm font-medium rounded-lg bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326]"
              >
                {isAuthenticated ? 'Open Dashboard' : 'Start Analysis'}
              </Link>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle color theme"
                className="p-2.5 rounded-lg border border-slate-200 dark:border-[#1B3A63] text-slate-600 dark:text-slate-300"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {/* Clean Scientific Footer (never contains Admin links) */}
      <footer className="bg-[#071B35] text-slate-300 border-t border-[#15345B]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2 space-y-4">
            <Logo variant="full" inverted />
            <p className="text-sm text-slate-300/90 max-w-md leading-relaxed">
              An intelligent environmental DNA analysis platform for taxonomic identification,
              ecological biodiversity assessment, unknown sequence clustering, and reproducible
              scientific reporting.
            </p>
            <p className="text-xs font-mono text-cyan-300/90">
              Problem Statement ID 25042 · Identifying Taxonomy and Assessing Biodiversity from eDNA Datasets
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-300/85">
              <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link to="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link to="/scientific-workflow" className="hover:text-white transition-colors">Scientific Workflow</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Researcher Sign In</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Create Account</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Governance & Contact</h4>
            <ul className="space-y-2 text-sm text-slate-300/85">
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Research Desk</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms and Conditions</Link></li>
              <li className="pt-2 text-xs text-slate-400">
                Contact: research-desk@deepseabioai.example
              </li>
            </ul>
            <div className="pt-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center gap-2 text-xs text-slate-300 hover:text-white border border-slate-700 rounded-md px-3 py-1.5 transition-colors"
              >
                {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                <span>{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-[#143054]">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span>© {new Date().getFullYear()} DeepSea BioAI. Discover Life Through Environmental DNA.</span>
            <span>Research Prototype · Problem Statement 25042</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
