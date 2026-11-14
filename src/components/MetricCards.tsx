// ============================================================================
// KARTIKA LogGuard-OT — Metric Cards (Responsive)
// ============================================================================

import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Zap, Activity, Clock } from 'lucide-react';
import type { SystemMetrics } from '../types';

interface MetricCardsProps {
  metrics: SystemMetrics;
}

export default function MetricCards({ metrics }: MetricCardsProps) {
  return (
    <section className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-3">
      {/* 2 kolom di xs, 3 di sm, 6 di lg */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <MetricCard
          label="Total Insiden"
          value={String(metrics.totalInsiden)}
          sub="sesi aktif"
          icon={<Activity className="w-4 h-4 text-zinc-400" />}
          color="text-zinc-100"
        />
        <MetricCard
          label="KRITIS"
          value={String(metrics.kritisCount)}
          sub="skor 86–100"
          icon={<ShieldAlert className="w-4 h-4 text-red-500" />}
          color="text-red-400"
          borderColor="border-red-900/50"
          highlight={metrics.kritisCount > 0}
        />
        <MetricCard
          label="TINGGI"
          value={String(metrics.tinggiCount)}
          sub="skor 71–85"
          icon={<AlertTriangle className="w-4 h-4 text-orange-400" />}
          color="text-orange-400"
          borderColor="border-orange-900/50"
        />
        <MetricCard
          label="SEDANG"
          value={String(metrics.sedangCount)}
          sub="skor 41–70"
          icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
          color="text-amber-400"
          borderColor="border-amber-900/50"
        />
        <MetricCard
          label="Avg. Blokir"
          value={`${metrics.avgMitigasiMs} ms`}
          sub={metrics.avgMitigasiMs <= 50 ? '✓ SLA OK' : '⚠ Melewati SLA'}
          icon={<Clock className="w-4 h-4 text-emerald-400" />}
          color={metrics.avgMitigasiMs <= 50 ? 'text-emerald-400' : 'text-amber-400'}
          borderColor={metrics.avgMitigasiMs <= 50 ? 'border-emerald-900/50' : 'border-amber-900/50'}
        />
        <MetricCard
          label="IP Diblokir"
          value={String(metrics.blockedIPs.length)}
          sub="firewall aktif"
          icon={<Zap className="w-4 h-4 text-violet-400" />}
          color="text-violet-400"
          borderColor="border-violet-900/50"
        />
      </div>
    </section>
  );
}

function MetricCard({
  label, value, sub, icon, color,
  borderColor = 'border-zinc-800',
  highlight = false,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  borderColor?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`bg-zinc-900 border rounded-lg p-3 ${borderColor} ${highlight ? 'ring-1 ring-red-900/60' : ''}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] sm:text-xs font-mono text-zinc-400 leading-tight">{label}</span>
        <span className="shrink-0">{icon}</span>
      </div>
      <div className={`text-lg sm:text-xl font-bold font-mono tabular-nums ${color}`}>{value}</div>
      <div className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5 leading-tight">{sub}</div>
    </div>
  );
}
