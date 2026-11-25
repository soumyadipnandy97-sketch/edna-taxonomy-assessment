import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon' | 'compact' | 'login' | 'admin';
  inverted?: boolean;
  className?: string;
}

export function Logo({ variant = 'full', inverted = false, className = '' }: LogoProps) {
  const iconSize =
    variant === 'login'
      ? 44
      : variant === 'admin'
        ? 36
        : variant === 'compact'
          ? 30
          : variant === 'icon'
            ? 36
            : 36;

  const mark = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dsbOceanGrad" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#071B35" />
          <stop offset="100%" stopColor="#0A4C7A" />
        </linearGradient>
        <linearGradient id="dsbCyanTeal" x1="16" y1="14" x2="48" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#21D4FD" />
          <stop offset="100%" stopColor="#13B8A6" />
        </linearGradient>
      </defs>
      {/* Circular ocean emblem */}
      <circle cx="32" cy="32" r="30" fill="url(#dsbOceanGrad)" stroke="#21D4FD" strokeWidth="1.75" />
      <circle cx="32" cy="32" r="24.5" stroke="#13B8A6" strokeOpacity="0.35" strokeWidth="1" />

      {/* Subtle ocean wave arc along lower basin */}
      <path
        d="M11.5 44.5C17.5 40.5 23.5 40.5 32 44.5C40.5 48.5 46.5 48.5 52.5 44.5"
        stroke="#13B8A6"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Coral / marine polyp micro-motif at base */}
      <path
        d="M25 52.5V48.5M25 50.5L22.5 48.8M25 50.2L27.5 48.5M39 52.5V48.2M39 50.2L36.8 48.6M39 50.0L41.4 48.3"
        stroke="#21D4FD"
        strokeOpacity="0.85"
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* DNA double helix */}
      <path
        d="M22.5 13C34.5 20.5 34.5 28.5 22.5 36C18.5 38.5 18 41.2 21 43.8"
        stroke="url(#dsbCyanTeal)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M41.5 13C29.5 20.5 29.5 28.5 41.5 36C45.5 38.5 46 41.2 43 43.8"
        stroke="#FFFFFF"
        strokeWidth="2.8"
        strokeLinecap="round"
      />

      {/* Base-pair rungs */}
      <line x1="25.5" y1="18.2" x2="38.5" y2="18.2" stroke="#13B8A6" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="28.2" y1="24.5" x2="35.8" y2="24.5" stroke="#21D4FD" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="25.5" y1="30.8" x2="38.5" y2="30.8" stroke="#13B8A6" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="22.8" y1="37.0" x2="41.2" y2="37.0" stroke="#21D4FD" strokeOpacity="0.85" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );

  if (variant === 'icon') {
    return <span className={`inline-flex items-center ${className}`}>{mark}</span>;
  }

  const primaryColor = inverted
    ? 'text-white'
    : 'text-[#071B35] dark:text-white';
  const accentColor = inverted
    ? 'text-[#21D4FD]'
    : 'text-[#0A4C7A] dark:text-[#21D4FD]';

  if (variant === 'compact') {
    return (
      <span className={`inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 ${className}`}>
        {mark}
        <span className={`text-base font-bold tracking-tight ${primaryColor}`}>
          DeepSea <span className={accentColor}>BioAI</span>
        </span>
      </span>
    );
  }

  if (variant === 'admin') {
    return (
      <span className={`inline-flex items-center gap-3 whitespace-nowrap shrink-0 ${className}`}>
        {mark}
        <span className="flex flex-col leading-tight">
          <span className="text-base font-bold tracking-tight text-white">
            DeepSea <span className="text-[#21D4FD]">BioAI</span>
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            Control Center
          </span>
        </span>
      </span>
    );
  }

  if (variant === 'login') {
    return (
      <span className={`inline-flex items-center gap-3.5 whitespace-nowrap shrink-0 ${className}`}>
        {mark}
        <span className="flex flex-col leading-tight">
          <span className={`text-xl font-bold tracking-tight ${primaryColor}`}>
            DeepSea <span className={accentColor}>BioAI</span>
          </span>
          <span className={`text-xs ${inverted ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
            Discover Life Through Environmental DNA
          </span>
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 ${className}`}>
      {mark}
      <span className={`text-lg font-bold tracking-tight ${primaryColor}`}>
        DeepSea <span className={accentColor}>BioAI</span>
      </span>
    </span>
  );
}
