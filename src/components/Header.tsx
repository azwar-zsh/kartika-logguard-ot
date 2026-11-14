// ============================================================================
// KARTIKA LogGuard-OT — Header (Responsive)
// ============================================================================

import React, { useState } from 'react';
import {
  ShieldAlert, ShieldCheck, AlertTriangle,
  Clock, Zap, Menu, X,
} from 'lucide-react';
import type { SeverityLevel } from '../types';

interface HeaderProps {
  currentTime: string;
  overallSystemStatus: SeverityLevel | 'AMAN';
  activeSection: string;
  onSectionChange: (section: string) => void;
  onSimulateAttack: () => void;
}

const NAV_ITEMS = [
  { id: 'semua',     label: 'Semua Lapis (1–4)' },
  { id: 'telemetri', label: 'Lapis 1 & 2: Telemetri' },
  { id: 'mitigasi',  label: 'Lapis 3: Mitigasi' },
  { id: 'xai',       label: 'Lapis 4: XAI' },
];

export default function Header({
  currentTime,
  overallSystemStatus,
  activeSection,
  onSectionChange,
  onSimulateAttack,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (id: string) => {
    onSectionChange(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-30">
        {/* === BARIS UTAMA === */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3">

          {/* Zone 1: Brand */}
          <button
            onClick={() => handleNav('semua')}
            className="flex items-center gap-2 text-sm sm:text-base font-bold tracking-wider text-zinc-100 font-display whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
            <span className="hidden xs:inline">KARTIKA LogGuard-OT</span>
            <span className="xs:hidden">KARTIKA</span>
          </button>

          {/* Zone 2: Nav desktop (xl+) */}
          <nav className="hidden xl:flex items-center gap-5 text-xs font-medium text-zinc-400 flex-1 justify-center">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`hover:text-zinc-100 transition-colors whitespace-nowrap py-1 border-b-2 cursor-pointer ${
                  activeSection === item.id
                    ? 'text-zinc-100 border-red-500'
                    : 'border-transparent'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Status + Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Clock + status — hanya md+ */}
            <div className="hidden md:flex items-center gap-2 text-xs font-mono tabular-nums text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="hidden lg:inline">{currentTime} WIB ·</span>
              <SystemStatusBadge status={overallSystemStatus} />
            </div>

            {/* Tombol simulasi */}
            <button
              onClick={onSimulateAttack}
              className="px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Simulasikan Serangan</span>
              <span className="sm:hidden">Serang</span>
            </button>

            {/* Hamburger — hanya di bawah xl */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="xl:hidden p-2 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* === STATUS BAR MOBILE (md dan di bawah) === */}
        <div className="md:hidden flex items-center gap-2 px-4 pb-2 text-xs font-mono text-zinc-400">
          <Clock className="w-3 h-3 shrink-0" />
          <span>{currentTime} WIB</span>
          <span className="text-zinc-700">·</span>
          <SystemStatusBadge status={overallSystemStatus} compact />
        </div>

        {/* === MOBILE DROPDOWN NAV === */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full text-left py-2.5 px-2 text-sm rounded-md transition-colors cursor-pointer flex items-center gap-2 ${
                  activeSection === item.id
                    ? 'text-zinc-100 bg-zinc-800 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                }`}
              >
                {activeSection === item.id && (
                  <span className="w-1 h-4 bg-red-500 rounded-full shrink-0" />
                )}
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>
    </>
  );
}

function SystemStatusBadge({
  status,
  compact = false,
}: {
  status: SeverityLevel | 'AMAN';
  compact?: boolean;
}) {
  if (status === 'KRITIS') {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-red-400 animate-pulse">
        <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0" />
        {compact ? 'KRITIS' : 'SIAGA KRITIS'}
      </span>
    );
  }
  if (status === 'TINGGI') {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-orange-400 animate-pulse">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        {compact ? 'TINGGI' : 'ANCAMAN TINGGI'}
      </span>
    );
  }
  if (status === 'SEDANG') {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        {compact ? 'WASPADA' : 'WASPADA SEDANG'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
      {compact ? 'AMAN' : 'AMAN TERKENDALI'}
    </span>
  );
}
