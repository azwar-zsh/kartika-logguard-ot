// ============================================================================
// KARTIKA LogGuard-OT — Telemetry Panel (Lapis 1 & 2)
// Sensor fisik OT + trafik IT + Isolation Forest anomaly score
// ============================================================================

import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Thermometer, Activity, Cpu } from 'lucide-react';
import type { TelemetryPoint } from '../types';

interface TelemetryPanelProps {
  telemetry: TelemetryPoint[];
  isFullWidth?: boolean;
}

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#09090b',
  borderColor: '#3f3f46',
  borderRadius: '6px',
  fontSize: '12px',
  fontFamily: 'JetBrains Mono, monospace',
};

export default function TelemetryPanel({ telemetry, isFullWidth = false }: TelemetryPanelProps) {
  const latest = telemetry[telemetry.length - 1];
  const isThermalCritical = latest?.suhuAmmo > 24.0;
  const isSshAnomaly = latest?.sshAuthRate > 50;
  const isIsolationHigh = latest?.isolationScore > 0.7;

  return (
    <div className={`flex flex-col gap-4 sm:gap-6 ${isFullWidth ? 'lg:col-span-12' : ''}`}>

      {/* === LAPIS 1: SENSOR FISIK OT === */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-xs font-mono text-zinc-400 mb-1 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-red-400" />
              01. Lapis 1 · Sensor Fisik OT (Modbus TCP / MQTT)
            </div>
            <h2 className="text-base font-bold text-zinc-100 font-display">
              Suhu Gudang Amunisi — OT-PLC-AMMO-04
            </h2>
          </div>
          <div className="text-right font-mono tabular-nums shrink-0">
            <div className={`text-2xl font-bold ${isThermalCritical ? 'text-red-500' : 'text-emerald-400'}`}>
              {latest?.suhuAmmo.toFixed(1)}°C
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              {isThermalCritical ? `KRITIS: +${(latest.suhuAmmo - 24).toFixed(1)}°C di atas batas` : 'AMAN: Rentang 18–24°C'}
            </div>
          </div>
        </div>

        {/* OT Temperature Chart */}
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={telemetry} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="time" stroke="#71717a" fontSize={10} tickMargin={6} />
              <YAxis stroke="#71717a" fontSize={10} domain={[10, 95]} unit="°C" />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value: number, name: string) => [
                  `${Number(value).toFixed(1)}°C`,
                  name === 'suhuAmmo' ? 'Suhu Aktual PLC-04' : 'Batas Aman',
                ]}
              />
              <ReferenceLine y={24} stroke="#eab308" strokeDasharray="4 4" label={{ value: 'Batas Aman 24°C', position: 'insideTopLeft', fill: '#eab308', fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="suhuAmmo"
                stroke={isThermalCritical ? '#ef4444' : '#10b981'}
                strokeWidth={2.5}
                dot={(props) => {
                  const { cx, cy, payload } = props as { cx: number; cy: number; payload: TelemetryPoint };
                  return payload.isAnomaly
                    ? <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#7f1d1d" strokeWidth={2} />
                    : <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={2.5} fill={isThermalCritical ? '#ef4444' : '#10b981'} />;
                }}
                activeDot={{ r: 5, fill: '#f87171' }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* OT PLC Register Status */}
        <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono tabular-nums">
          <StatCell label="Holding Reg #40012" value={isThermalCritical ? '0x0352 (85.0°C)' : '0x00D0 (20.8°C)'} color={isThermalCritical ? 'text-red-400' : 'text-emerald-400'} />
          <StatCell label="Modbus FC-06 (Tulis)" value={`${latest?.modbusWriteCount ?? 0} paket / detik`} color={latest?.modbusWriteCount > 5 ? 'text-red-400' : 'text-zinc-200'} />
          <StatCell label="Katup Pendingin" value={isThermalCritical ? 'INTERLOCK AKTIF' : 'SIRKULASI NORMAL'} color={isThermalCritical ? 'text-amber-400' : 'text-emerald-400'} />
          <StatCell label="Kelembaban Silo" value="44.2% RH" color="text-zinc-200" />
        </div>
      </div>

      {/* === LAPIS 2: TRAFIK IT (SSH Auth) === */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-xs font-mono text-zinc-400 mb-1 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              02. Lapis 2 · Telemetri Trafik IT (Syslog / Auth Log)
            </div>
            <h2 className="text-base font-bold text-zinc-100 font-display">
              Lonjakan SSH Authentication Rate
            </h2>
          </div>
          <div className="text-right font-mono tabular-nums shrink-0">
            <div className={`text-xl font-bold ${isSshAnomaly ? 'text-amber-400' : 'text-emerald-400'}`}>
              {latest?.sshAuthRate} req/dtk
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">Target: admin_logistik</div>
          </div>
        </div>

        <div className="h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={telemetry} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="time" stroke="#71717a" fontSize={10} tickMargin={6} />
              <YAxis stroke="#71717a" fontSize={10} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number) => [`${v} req/dtk`, 'SSH Auth Attempts']} />
              <ReferenceLine y={10} stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'Baseline', position: 'insideTopLeft', fill: '#22c55e', fontSize: 9 }} />
              <Area type="monotone" dataKey="sshAuthRate" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2 text-xs font-mono tabular-nums">
          <MetricRow label="Akun Sasaran Brute-Force" value="admin_logistik (UID: 1004)" valueColor="text-zinc-100" />
          <MetricRow label="Host Sumber Anomali" value="10.24.88.105 (VLAN-24)" valueColor="text-red-400" />
          <MetricRow label="Rasio Gagal Autentikasi SSH" value="99.4% (1.462 gagal / 3 dtk)" valueColor="text-amber-400" />
          <MetricRow label="Injeksi Paket Modbus FC-06" value={`${latest?.modbusWriteCount ?? 0} paket tulis → Port 502`} valueColor={latest?.modbusWriteCount > 5 ? 'text-red-400' : 'text-zinc-300'} />
        </div>
      </div>

      {/* === LAPIS 2: ISOLATION FOREST SCORE === */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-xs font-mono text-zinc-400 mb-1 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-violet-400" />
              02b. Lapis 2 · Mesin ML — Isolation Forest Anomaly Score
            </div>
            <h2 className="text-base font-bold text-zinc-100 font-display">
              Skor Anomali Sensor OT (Unsupervised ML)
            </h2>
          </div>
          <div className="text-right font-mono tabular-nums shrink-0">
            <div className={`text-xl font-bold ${isIsolationHigh ? 'text-red-400' : latest?.isolationScore > 0.4 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {((latest?.isolationScore ?? 0) * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              {isIsolationHigh ? 'OUTLIER TERDETEKSI' : 'Normal Baseline'}
            </div>
          </div>
        </div>

        <div className="h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={telemetry} margin={{ top: 4, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="time" stroke="#71717a" fontSize={10} tickMargin={6} />
              <YAxis stroke="#71717a" fontSize={10} domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number) => [`${(v * 100).toFixed(0)}%`, 'Anomaly Score']} />
              <ReferenceLine y={0.7} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Threshold 70%', position: 'insideTopLeft', fill: '#ef4444', fontSize: 9 }} />
              <Bar dataKey="isolationScore" isAnimationActive={false}
                fill="#8b5cf6"
                label={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 pt-3 border-t border-zinc-800 text-xs font-mono text-zinc-400">
          <span className="text-violet-400 font-semibold">Isolation Forest:</span> Deteksi anomali <em>unsupervised</em> berdasarkan penyimpangan dari baseline normal 30 hari.
          Score &gt;70% = outlier statistik yang memicu investigasi Lapis 3.
        </div>
      </div>
    </div>
  );
}

function StatCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="text-zinc-400">{label}</div>
      <div className={`font-semibold mt-0.5 ${color}`}>{value}</div>
    </div>
  );
}

function MetricRow({ label, value, valueColor }: { label: string; value: string; valueColor: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-zinc-400">{label}</span>
      <span className={`font-semibold ${valueColor}`}>{value}</span>
    </div>
  );
}
