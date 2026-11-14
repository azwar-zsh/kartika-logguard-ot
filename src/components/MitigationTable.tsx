// ============================================================================
// KARTIKA LogGuard-OT — Mitigation Table (Lapis 3 — Responsive)
// ============================================================================

import React from 'react';
import { Search, Download, ShieldAlert } from 'lucide-react';
import type { IncidentLog, SeverityLevel, DomainSource, MitigationAction } from '../types';

interface MitigationTableProps {
  incidents: IncidentLog[];
  selectedIncidentId: string;
  onSelectIncident: (id: string) => void;
  isFullWidth?: boolean;
}

type DomainFilter   = 'SEMUA' | DomainSource;
type SeverityFilter = 'SEMUA' | SeverityLevel;

const MITIGATION_ACTION_LABELS: Record<MitigationAction, { label: string; color: string }> = {
  BLOKIR_IP:    { label: 'BLOKIR IP',    color: 'text-red-400'     },
  KUNCI_AKUN:   { label: 'KUNCI AKUN',   color: 'text-orange-400'  },
  PUTUS_SCADA:  { label: 'PUTUS SCADA',  color: 'text-purple-400'  },
  ROLLBACK_PLC: { label: 'ROLLBACK PLC', color: 'text-amber-400'   },
  DIIZINKAN:    { label: 'DIIZINKAN',    color: 'text-emerald-400' },
  TOLAK_PAKET:  { label: 'TOLAK PAKET',  color: 'text-red-300'     },
};

function getSeverityColor(level: SeverityLevel): string {
  switch (level) {
    case 'KRITIS': return 'text-red-400';
    case 'TINGGI': return 'text-orange-400';
    case 'SEDANG': return 'text-amber-400';
    case 'RENDAH': return 'text-sky-400';
    default:       return 'text-emerald-400';
  }
}

function getSeverityBg(level: SeverityLevel): string {
  switch (level) {
    case 'KRITIS': return 'bg-red-950/50 text-red-400 border-red-900/60';
    case 'TINGGI': return 'bg-orange-950/50 text-orange-400 border-orange-900/60';
    case 'SEDANG': return 'bg-amber-950/50 text-amber-400 border-amber-900/60';
    case 'RENDAH': return 'bg-sky-950/50 text-sky-400 border-sky-900/60';
    default:       return 'bg-emerald-950/50 text-emerald-400 border-emerald-900/60';
  }
}

export default function MitigationTable({
  incidents,
  selectedIncidentId,
  onSelectIncident,
  isFullWidth = false,
}: MitigationTableProps) {
  const [domainFilter,   setDomainFilter]   = React.useState<DomainFilter>('SEMUA');
  const [severityFilter, setSeverityFilter] = React.useState<SeverityFilter>('SEMUA');
  const [searchQuery,    setSearchQuery]    = React.useState('');

  const filtered = React.useMemo(() => {
    return incidents.filter((item) => {
      const matchDomain   = domainFilter   === 'SEMUA' || item.sumber === domainFilter;
      const matchSeverity = severityFilter === 'SEMUA' || item.kategoriRisiko === severityFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q ||
        item.ipPenyerang.toLowerCase().includes(q) ||
        item.protokol.toLowerCase().includes(q) ||
        item.asetTarget.toLowerCase().includes(q) ||
        item.judulInsiden.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);
      return matchDomain && matchSeverity && matchSearch;
    });
  }, [incidents, domainFilter, severityFilter, searchQuery]);

  const handleExportCsv = () => {
    const headers = ['ID', 'Timestamp', 'Sumber', 'Aset Target', 'IP Penyerang', 'Protokol', 'Skor', 'Kategori', 'Status Blokir', 'Latensi (ms)'];
    const rows = filtered.map((i) => [
      i.id, i.timestamp, i.sumber,
      `"${i.asetTarget}"`, i.ipPenyerang, `"${i.protokol}"`,
      i.skorRisiko, i.kategoriRisiko, `"${i.statusBlokir}"`, i.waktuMitigasiMs,
    ]);
    const csv = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `logguard-ot-insiden-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-5 flex flex-col gap-3 ${isFullWidth ? 'lg:col-span-12' : ''}`}>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-mono text-zinc-400 mb-1 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">03. Lapis 3 · Mitigasi Otonom &lt; 50 ms</span>
          </div>
          <h2 className="text-sm sm:text-base font-bold text-zinc-100 font-display leading-tight">
            Log Kejadian &amp; Pemblokiran Real-Time
          </h2>
        </div>
        <button
          onClick={handleExportCsv}
          title="Unduh CSV"
          className="px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Unduh CSV</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari IP, protokol, aset, atau ID..."
          className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none font-mono"
        />
      </div>

      {/* Filters — scroll horizontal di mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {/* Domain filter */}
        <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-md border border-zinc-800 shrink-0">
          {(['SEMUA', 'IT/OT', 'OT', 'IT'] as DomainFilter[]).map((dom) => (
            <button
              key={dom}
              onClick={() => setDomainFilter(dom)}
              className={`px-2 py-1 text-[11px] font-mono rounded transition-colors whitespace-nowrap cursor-pointer ${
                domainFilter === dom
                  ? 'bg-zinc-700 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {dom}
            </button>
          ))}
        </div>

        {/* Severity filter */}
        <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-md border border-zinc-800 shrink-0">
          {(['SEMUA', 'KRITIS', 'TINGGI', 'SEDANG', 'AMAN'] as SeverityFilter[]).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2 py-1 text-[11px] font-mono rounded transition-colors whitespace-nowrap cursor-pointer ${
                severityFilter === sev
                  ? 'bg-zinc-700 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* === TABEL — desktop === */}
      <div className="hidden sm:block overflow-x-auto border border-zinc-800 rounded-md bg-zinc-950/60">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-zinc-800 text-[11px] font-mono text-zinc-400 bg-zinc-950">
              <th className="py-2.5 px-3 font-medium whitespace-nowrap">Timestamp</th>
              <th className="py-2.5 px-2.5 font-medium whitespace-nowrap">Sumber</th>
              <th className="py-2.5 px-2.5 font-medium whitespace-nowrap">IP Penyerang</th>
              <th className="py-2.5 px-2.5 font-medium whitespace-nowrap hidden md:table-cell">Protokol</th>
              <th className="py-2.5 px-2.5 font-medium text-right whitespace-nowrap">Skor</th>
              <th className="py-2.5 px-2.5 font-medium whitespace-nowrap hidden lg:table-cell">Aksi</th>
              <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">Latensi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70 text-xs font-mono tabular-nums">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 px-4 text-center text-zinc-500 font-sans text-sm">
                  Tidak ada insiden yang cocok.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isSelected = item.id === selectedIncidentId;
                const scoreColor = getSeverityColor(item.kategoriRisiko);
                const primaryMitigation = item.mitigations[0];
                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectIncident(item.id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected ? 'bg-red-950/30 hover:bg-red-950/40' : 'hover:bg-zinc-900/90'
                    }`}
                  >
                    <td className="py-2.5 px-3 text-zinc-300 whitespace-nowrap">
                      <div>{item.timestamp}</div>
                      <div className="text-[10px] text-zinc-500">{item.id}</div>
                    </td>
                    <td className="py-2.5 px-2.5 whitespace-nowrap">
                      <span className={`font-semibold ${item.sumber === 'IT/OT' ? 'text-purple-400' : item.sumber === 'OT' ? 'text-amber-400' : 'text-sky-400'}`}>
                        {item.sumber}
                      </span>
                      <div className="text-[10px] text-zinc-400 max-w-[110px] truncate" title={item.asetTarget}>
                        {item.asetTarget}
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5 text-zinc-100 font-medium whitespace-nowrap">
                      {item.ipPenyerang}
                    </td>
                    <td className="py-2.5 px-2.5 text-zinc-300 whitespace-nowrap hidden md:table-cell">
                      <span className="max-w-[120px] block truncate" title={item.protokol}>{item.protokol}</span>
                    </td>
                    <td className={`py-2.5 px-2.5 text-right whitespace-nowrap ${scoreColor}`}>
                      <div className="font-bold">{item.skorRisiko}</div>
                      <div className="text-[10px]">{item.kategoriRisiko}</div>
                    </td>
                    <td className="py-2.5 px-2.5 whitespace-nowrap hidden lg:table-cell">
                      {primaryMitigation ? (
                        <span className={`${MITIGATION_ACTION_LABELS[primaryMitigation.action]?.color ?? 'text-zinc-300'} font-semibold text-[10px]`}>
                          {MITIGATION_ACTION_LABELS[primaryMitigation.action]?.label}
                          {item.mitigations.length > 1 && <span className="text-zinc-500"> +{item.mitigations.length - 1}</span>}
                        </span>
                      ) : <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <span className={item.waktuMitigasiMs <= 50 ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                        {item.waktuMitigasiMs} ms
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* === CARD LIST — mobile (xs) === */}
      <div className="sm:hidden space-y-2">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-zinc-500 text-sm">Tidak ada insiden yang cocok.</p>
        ) : (
          filtered.map((item) => {
            const isSelected = item.id === selectedIncidentId;
            const primaryMitigation = item.mitigations[0];
            return (
              <button
                key={item.id}
                onClick={() => onSelectIncident(item.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-red-950/30 border-red-900/60'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Baris 1: ID + skor badge */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-mono text-zinc-400">{item.id}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getSeverityBg(item.kategoriRisiko)}`}>
                    {item.skorRisiko} · {item.kategoriRisiko}
                  </span>
                </div>
                {/* Baris 2: Judul singkat */}
                <div className="text-xs text-zinc-200 font-sans leading-snug line-clamp-2 mb-1.5">
                  {item.judulInsiden}
                </div>
                {/* Baris 3: IP + latensi */}
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                  <span className="text-red-400 font-medium">{item.ipPenyerang}</span>
                  <div className="flex items-center gap-2">
                    {primaryMitigation && (
                      <span className={`${MITIGATION_ACTION_LABELS[primaryMitigation.action]?.color ?? ''}`}>
                        {MITIGATION_ACTION_LABELS[primaryMitigation.action]?.label}
                      </span>
                    )}
                    <span className={item.waktuMitigasiMs <= 50 ? 'text-emerald-400' : 'text-amber-400'}>
                      {item.waktuMitigasiMs} ms
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-zinc-500 font-mono pt-1">
        <span>{filtered.length}/{incidents.length} insiden</span>
        <span className="hidden sm:inline">Klik baris → inspeksi XAI</span>
      </div>
    </div>
  );
}

function FilterGroup<T extends string>({
  options, value, onChange,
}: { label: string; options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-md border border-zinc-800">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-2 py-1 text-[11px] font-mono rounded transition-colors whitespace-nowrap cursor-pointer ${
            value === opt ? 'bg-zinc-700 text-zinc-100 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
