// ============================================================================
// KARTIKA LogGuard-OT — Control Strip (Responsive)
// ============================================================================

import React, { useState } from 'react';
import { ShieldCheck, RotateCcw, Pause, Play, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import type { TelemetryPoint } from '../types';

interface ControlStripProps {
  latestPoint: TelemetryPoint;
  avgMitigationMs: number;
  isStreaming: boolean;
  actionBanner: string | null;
  onToggleStream: () => void;
  onNormalizeSystem: () => void;
  onResetScenario: () => void;
  onDismissBanner: () => void;
}

export default function ControlStrip({
  latestPoint,
  avgMitigationMs,
  isStreaming,
  actionBanner,
  onToggleStream,
  onNormalizeSystem,
  onResetScenario,
  onDismissBanner,
}: ControlStripProps) {
  const [metricsExpanded, setMetricsExpanded] = useState(false);
  const isCritical  = latestPoint.suhuAmmo > 24.0;
  const isoHigh     = latestPoint.isolationScore > 0.7;
  const isoMedium   = latestPoint.isolationScore > 0.4;

  return (
    <section className="bg-zinc-900/70 border-b border-zinc-800 px-4 sm:px-6 py-2.5">
      <div className="max-w-[1600px] mx-auto space-y-2">

        {/* === BARIS UTAMA: ringkasan kritis + tombol === */}
        <div className="flex items-center justify-between gap-3 flex-wrap">

          {/* Kiri: metrik ringkas + toggle expand */}
          <div className="flex items-center gap-3 flex-wrap text-xs font-mono">
            {/* Suhu — selalu tampil */}
            <div className="flex items-center gap-1.5 tabular-nums">
              <span className="text-zinc-400 hidden sm:inline">Suhu AMMO-04:</span>
              <span className="text-zinc-400 sm:hidden">Suhu:</span>
              <span className={`font-bold ${isCritical ? 'text-red-400' : 'text-emerald-400'}`}>
                {latestPoint.suhuAmmo.toFixed(1)}°C
              </span>
            </div>

            <span className="text-zinc-700 hidden sm:inline">·</span>

            {/* Isolation score — tersembunyi di xs */}
            <div className="hidden sm:flex items-center gap-1.5 tabular-nums">
              <span className="text-zinc-400">IF Score:</span>
              <span className={`font-bold ${isoHigh ? 'text-red-400' : isoMedium ? 'text-amber-400' : 'text-emerald-400'}`}>
                {(latestPoint.isolationScore * 100).toFixed(0)}%
              </span>
            </div>

            <span className="text-zinc-700 hidden md:inline">·</span>

            {/* Avg blokir — tersembunyi di sm ke bawah */}
            <div className="hidden md:flex items-center gap-1.5 tabular-nums">
              <span className="text-zinc-400">Avg Blokir:</span>
              <span className={`font-bold ${avgMitigationMs <= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {avgMitigationMs} ms
              </span>
            </div>

            {/* Toggle detail — mobile */}
            <button
              onClick={() => setMetricsExpanded((v) => !v)}
              className="sm:hidden flex items-center gap-1 text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              {metricsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <span>Detail</span>
            </button>
          </div>

          {/* Kanan: tombol kontrol */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onToggleStream}
              className="px-2.5 py-1.5 text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              {isStreaming
                ? <><Pause className="w-3.5 h-3.5 text-amber-400 shrink-0" /><span className="hidden sm:inline">Jeda</span></>
                : <><Play  className="w-3.5 h-3.5 text-emerald-400 shrink-0" /><span className="hidden sm:inline">Lanjut</span></>
              }
            </button>

            <button
              onClick={onNormalizeSystem}
              className="px-2.5 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-800/80 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">Override Pendingin</span>
              <span className="sm:hidden">Override</span>
            </button>

            <button
              onClick={onResetScenario}
              className="px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="hidden sm:inline">Reset Skenario</span>
              <span className="sm:hidden">Reset</span>
            </button>
          </div>
        </div>

        {/* === PANEL DETAIL — mobile expand / selalu terlihat sm+ === */}
        <div className={`${metricsExpanded ? 'block' : 'hidden'} sm:block`}>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-mono text-zinc-400 sm:hidden">
            <div className="flex gap-1.5">
              <span>IF Score:</span>
              <span className={`font-semibold ${isoHigh ? 'text-red-400' : isoMedium ? 'text-amber-400' : 'text-emerald-400'}`}>
                {(latestPoint.isolationScore * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex gap-1.5">
              <span>Avg Blokir:</span>
              <span className={`font-semibold ${avgMitigationMs <= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {avgMitigationMs} ms
              </span>
            </div>
            <div className="flex gap-1.5">
              <span>Sektor:</span>
              <span className="text-zinc-300 font-medium">DEPO AMUNISI PUSAT</span>
            </div>
          </div>

          {/* Sektor — hanya desktop */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-zinc-400 pt-1 border-t border-zinc-800/60">
            <span>Sektor Operasi:</span>
            <span className="font-medium text-zinc-300">DEPO AMUNISI PUSAT &amp; JARINGAN LOGISTIK IV</span>
          </div>
        </div>

        {/* === ACTION BANNER === */}
        {actionBanner && (
          <div className="pt-2 border-t border-zinc-800/80 flex items-start justify-between gap-3 text-xs font-mono text-zinc-200">
            <div className="flex items-start gap-2 min-w-0">
              <Terminal className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span className="break-words">{actionBanner}</span>
            </div>
            <button
              onClick={onDismissBanner}
              className="text-zinc-500 hover:text-zinc-200 text-xs underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
