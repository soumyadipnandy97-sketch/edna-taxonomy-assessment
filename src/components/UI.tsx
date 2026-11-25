import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export function MetricCard({
  label,
  value,
  unit,
  detail,
}: {
  label: string;
  value: string | number;
  unit?: string;
  detail?: string;
}) {
  return (
    <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-5 flex flex-col justify-between gap-2">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-mono font-semibold tabular-nums text-[#071B35] dark:text-white tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {unit}
          </span>
        )}
      </div>
      {detail && (
        <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
          {detail}
        </span>
      )}
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-5 sm:p-6 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="text-base font-semibold text-[#071B35] dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

export function LoadingSpinner({ label = 'Loading scientific data...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
      <div className="h-7 w-7 rounded-full border-2 border-[#0A4C7A] dark:border-[#21D4FD] border-t-transparent animate-spin" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl px-6 py-14 text-center flex flex-col items-center max-w-2xl mx-auto">
      {icon && (
        <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-[#133058] text-[#0A4C7A] dark:text-[#21D4FD] flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[#071B35] dark:text-white">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-md leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function NotificationBanner({
  type = 'info',
  message,
  onDismiss,
}: {
  type?: 'info' | 'success' | 'error' | 'warning';
  message: string;
  onDismiss?: () => void;
}) {
  const styles = {
    info: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60 text-sky-900 dark:text-sky-200',
    success:
      'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60 text-teal-900 dark:text-teal-200',
    warning:
      'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200',
    error:
      'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200',
  }[type];

  const Icon =
    type === 'success' ? CheckCircle2 : type === 'error' || type === 'warning' ? AlertCircle : Info;

  return (
    <div
      role="status"
      className={`border rounded-lg px-4 py-3 text-sm flex items-start gap-3 ${styles}`}
    >
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <span className="flex-1 leading-relaxed">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="opacity-70 hover:opacity-100 p-0.5 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#1B3A63]">
          <h3 className="text-base font-semibold text-[#071B35] dark:text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-[#133058] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
}

export function SafeImage({
  src,
  alt,
  className = '',
  fallbackLabel,
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`bg-gradient-to-br from-[#071B35] via-[#0A4C7A] to-[#0E3A5E] flex items-center justify-center p-6 text-center ${className}`}
      >
        <span className="text-xs font-medium text-cyan-200/80">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

export function StatusText({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  if (normalized === 'identified' || normalized === 'completed' || normalized === 'active' || normalized === 'verified') {
    return <span className="text-xs font-medium text-teal-700 dark:text-teal-300">{status}</span>;
  }
  if (normalized === 'partially identified' || normalized === 'processing' || normalized === 'queued' || normalized === 'uploaded') {
    return <span className="text-xs font-medium text-sky-700 dark:text-sky-300">{status}</span>;
  }
  if (normalized.includes('novel') || normalized === 'pending') {
    return <span className="text-xs font-medium text-amber-700 dark:text-amber-300">{status}</span>;
  }
  if (normalized === 'failed' || normalized === 'suspended') {
    return <span className="text-xs font-medium text-rose-700 dark:text-rose-300">{status}</span>;
  }
  return <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{status}</span>;
}
