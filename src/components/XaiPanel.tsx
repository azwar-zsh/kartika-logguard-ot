// ============================================================================
// KARTIKA LogGuard-OT — XAI Panel (Lapis 4)
// Explainable AI: narasi forensik (Local LLM simulasi), risk scoring, SOP, mitigasi
// Tech Stack sesuai PRD: React.js + Tailwind CSS
// LLM Engine: Ollama + Qwen2.5-3B / Llama-3.2-3B (100% lokal — simulasi mode demo)
// ============================================================================

import React, { useState } from 'react';
import {
  Terminal,
  Lock,
  CheckSquare,
  Square,
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Cpu,
  Server,
  Network,
  RotateCcw,
  Loader,
  BrainCircuit,
} from 'lucide-react';
import type { IncidentLog, SeverityLevel, MitigationAction } from '../types';

interface XaiPanelProps {
  incident: IncidentLog;
  onToggleSop: (incidentId: string, sopId: string) => void;
  onUpdateAiAnalysis: (incidentId: string, analysis: string) => void;
  isFullWidth?: boolean;
}

const MITIGATION_ICON_MAP: Record<MitigationAction, React.ReactNode> = {
  BLOKIR_IP:    <Network  className="w-3.5 h-3.5 text-red-400"     />,
  KUNCI_AKUN:   <Lock     className="w-3.5 h-3.5 text-orange-400"  />,
  PUTUS_SCADA:  <Cpu      className="w-3.5 h-3.5 text-purple-400"  />,
  ROLLBACK_PLC: <Server   className="w-3.5 h-3.5 text-amber-400"   />,
  DIIZINKAN:    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
  TOLAK_PAKET:  <ShieldAlert className="w-3.5 h-3.5 text-red-300"  />,
};

function SeverityIcon({ level }: { level: SeverityLevel }) {
  switch (level) {
    case 'KRITIS': return <ShieldAlert   className="w-4 h-4 text-red-500"     />;
    case 'TINGGI': return <AlertTriangle className="w-4 h-4 text-orange-400"  />;
    case 'SEDANG': return <AlertTriangle className="w-4 h-4 text-amber-400"   />;
    default:       return <ShieldCheck   className="w-4 h-4 text-emerald-400" />;
  }
}

function getSeverityColor(level: SeverityLevel) {
  switch (level) {
    case 'KRITIS': return 'text-red-500';
    case 'TINGGI': return 'text-orange-400';
    case 'SEDANG': return 'text-amber-400';
    case 'RENDAH': return 'text-sky-400';
    default:       return 'text-emerald-400';
  }
}

// ============================================================================
// Simulasi output Local LLM (Ollama Qwen2.5-3B / Llama-3.2-3B)
// Pada deployment nyata, ini akan diganti dengan fetch() ke endpoint Ollama lokal:
//   POST http://localhost:11434/api/generate  { model: "qwen2.5:3b", prompt: "..." }
// ============================================================================
function buildLlmNarrative(incident: IncidentLog): string {
  const alasanTeks = incident.alasanDeteksi
    .map((a) => `• ${a.faktor} (+${a.bobot} poin): ${a.detail}`)
    .join('\n');

  const mitigasiTeks = incident.mitigations
    .map((m) => `• [${m.action}] ${m.target} — ${m.latencyMs} ms — ${m.success ? 'BERHASIL' : 'GAGAL'}`)
    .join('\n');

  return `**RINGKASAN EKSEKUTIF**
Insiden ${incident.id} (${incident.kategoriRisiko}, skor ${incident.skorRisiko}/100) terdeteksi pada ${incident.timestamp} dari IP ${incident.ipPenyerang} menyerang aset ${incident.asetTarget} via ${incident.protokol}. Sistem LogGuard-OT mengeksekusi mitigasi otonom dalam ${incident.waktuMitigasiMs} ms — jauh di bawah ambang SLA 50 ms.

**ANALISIS TEKNIS**
Vektor serangan: ${incident.vektorSerangan}

Faktor-faktor deteksi mesin ML (Isolation Forest + Heuristic):
${alasanTeks}

**PENILAIAN RISIKO**
${incident.kategoriRisiko === 'KRITIS' || incident.kategoriRisiko === 'TINGGI'
  ? `Skor risiko ${incident.skorRisiko}/100 mencerminkan ancaman nyata terhadap keselamatan fisik dan integritas data militer. Tanpa intervensi, eskalasi dapat menyebabkan kerusakan infrastruktur OT kritis dan kompromi data operasional sensitif.`
  : `Skor risiko ${incident.skorRisiko}/100 menunjukkan aktivitas mencurigakan yang perlu dipantau. Belum terjadi dampak operasional langsung, namun merupakan indikator awal potensi eskalasi.`
}

**TINDAKAN MITIGASI DIEKSEKUSI**
${mitigasiTeks}

**REKOMENDASI PRIORITAS**
Tindak lanjuti semua butir SOP yang belum selesai, khususnya isolasi fisik aset yang terpengaruh dan rotasi kredensial yang terkompromi. Kirim laporan insiden ini ke Satuan Siber Komando untuk analisis intelijen lanjutan.

---
*Analisis dihasilkan oleh Local LLM (Ollama Qwen2.5-3B) — Air-Gapped Mode*`;
}

// ============================================================================
// KOMPONEN UTAMA
// ============================================================================

export default function XaiPanel({
  incident,
  onToggleSop,
  onUpdateAiAnalysis,
  isFullWidth = false,
}: XaiPanelProps) {
  const [activeTab,  setActiveTab]  = useState<'ringkasan' | 'mitigasi' | 'sop' | 'rawlog'>('ringkasan');
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmOutput,  setLlmOutput]  = useState<string | null>(null);

  const sopDone = incident.rekomendasiSop.filter((s) => s.selesai).length;

  // Simulasi streaming output dari Ollama (typewriter effect)
  const handleRunLocalLlm = () => {
    setLlmLoading(true);
    setLlmOutput(null);
    const narrative = buildLlmNarrative(incident);
    const chars = narrative.split('');
    let i = 0;
    let accumulated = '';

    // Simulasi streaming token per token seperti Ollama /api/generate stream
    const interval = setInterval(() => {
      const chunkSize = Math.floor(Math.random() * 6) + 3;
      const chunk = chars.slice(i, i + chunkSize).join('');
      accumulated += chunk;
      i += chunkSize;
      setLlmOutput(accumulated);

      if (i >= chars.length) {
        clearInterval(interval);
        setLlmLoading(false);
        onUpdateAiAnalysis(incident.id, accumulated);
      }
    }, 18);
  };

  const handleResetLlm = () => {
    setLlmOutput(null);
    setLlmLoading(false);
  };

  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col gap-4 ${isFullWidth ? 'lg:col-span-12' : ''}`}>

      {/* === HEADER === */}
      <div className="flex items-start justify-between gap-4 pb-3 border-b border-zinc-800">
        <div>
          <div className="text-xs font-mono text-zinc-400 mb-1 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-red-400" />
            04. Lapis 4 · Explainable AI (XAI) Terminal
          </div>
          <h2 className="text-base font-bold text-zinc-100 font-display">
            Analisis Forensik &amp; Narasi Keputusan AI
          </h2>
        </div>
        <div className="text-right font-mono text-xs text-zinc-400 shrink-0">
          <div className="font-semibold text-zinc-200">{incident.id}</div>
          <div className="text-zinc-500">{incident.timestamp}</div>
        </div>
      </div>

      {/* === RISK SCORE CARD === */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-zinc-400 mb-1">Skor Risiko &amp; Klasifikasi</div>
            <div className="flex items-center gap-3">
              <SeverityIcon level={incident.kategoriRisiko} />
              <span className={`text-3xl font-bold font-mono tabular-nums ${getSeverityColor(incident.kategoriRisiko)}`}>
                {incident.skorRisiko}
              </span>
              <span className="text-zinc-500 font-mono text-sm">/ 100</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                incident.kategoriRisiko === 'KRITIS' ? 'border-red-800 bg-red-950/50 text-red-400' :
                incident.kategoriRisiko === 'TINGGI' ? 'border-orange-800 bg-orange-950/50 text-orange-400' :
                incident.kategoriRisiko === 'SEDANG' ? 'border-amber-800 bg-amber-950/50 text-amber-400' :
                'border-emerald-800 bg-emerald-950/50 text-emerald-400'
              }`}>
                {incident.kategoriRisiko}
              </span>
            </div>
          </div>
          <div className="text-right font-mono text-xs shrink-0">
            <div className="text-zinc-400 mb-1">Mitigasi Otomatis</div>
            <div className="flex items-center justify-end gap-1.5 text-emerald-400 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              {incident.statusBlokir}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              {incident.waktuMitigasiMs} ms · {incident.protokol}
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-zinc-800/80 grid grid-cols-1 gap-1.5 text-xs font-mono">
          <DetailRow label="IP Penyerang"    value={incident.ipPenyerang}    valueColor="text-red-400"  />
          <DetailRow label="Aset Target"     value={incident.asetTarget}     valueColor="text-zinc-100" />
          <DetailRow label="Vektor Serangan" value={incident.vektorSerangan} valueColor="text-zinc-200" truncate />
        </div>
      </div>

      {/* === TABS === */}
      <div className="flex gap-1 bg-zinc-950 p-1 rounded-md border border-zinc-800 overflow-x-auto">
        {([
          { id: 'ringkasan', label: 'Ringkasan',  labelFull: 'Ringkasan AI'   },
          { id: 'mitigasi',  label: 'Mitigasi',   labelFull: 'Mitigasi IT/OT' },
          { id: 'sop',       label: `SOP (${sopDone}/${incident.rekomendasiSop.length})`, labelFull: `SOP (${sopDone}/${incident.rekomendasiSop.length})` },
          { id: 'rawlog',    label: 'Log',         labelFull: 'Log Mentah'     },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 text-[11px] font-mono rounded transition-colors cursor-pointer whitespace-nowrap min-w-[60px] ${
              activeTab === tab.id
                ? 'bg-zinc-800 text-zinc-100 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="sm:hidden">{tab.label}</span>
            <span className="hidden sm:inline">{tab.labelFull}</span>
          </button>
        ))}
      </div>

      {/* ================================================================
          TAB: RINGKASAN AI
      ================================================================ */}
      {activeTab === 'ringkasan' && (
        <div className="space-y-4">

          {/* Ringkasan heuristik rule-based */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4">
            <h3 className="text-xs font-mono font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              Ringkasan Insiden (Rule-Based Engine)
            </h3>
            <p className="text-xs font-mono leading-relaxed text-zinc-300">{incident.ringkasanAi}</p>
          </div>

          {/* XAI Feature Attribution (Isolation Forest bobot) */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-semibold text-zinc-300 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-violet-400" />
                Alasan Deteksi ML — Bobot Kontribusi XAI
              </h3>
              <span className="text-[11px] font-mono text-zinc-400">Total: {incident.skorRisiko} poin</span>
            </div>
            <div className="space-y-3">
              {incident.alasanDeteksi.map((alasan, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="text-zinc-200 font-medium">{alasan.faktor}</span>
                    <span className="text-red-400 font-semibold shrink-0 ml-2">+{alasan.bobot} poin</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-700 to-red-400 rounded-full"
                      style={{ width: `${Math.min(100, alasan.bobot * 2)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">{alasan.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Local LLM Analysis (Ollama simulasi) */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-semibold text-zinc-300 flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5 text-violet-400" />
                Analisis Mendalam — Local LLM (Ollama Qwen2.5-3B)
              </h3>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                Air-Gapped · Offline
              </span>
            </div>

            {llmOutput ? (
              <div className="space-y-3">
                <pre className="text-[11px] font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {llmOutput}
                  {llmLoading && <span className="inline-block w-1.5 h-3 bg-violet-400 animate-pulse ml-0.5 align-middle" />}
                </pre>
                {!llmLoading && (
                  <button
                    onClick={handleResetLlm}
                    className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Analisis
                  </button>
                )}
              </div>
            ) : llmLoading ? (
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono py-2">
                <Loader className="w-4 h-4 animate-spin text-violet-400" />
                Memuat model Qwen2.5-3B... menganalisis log...
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                  Jalankan Local LLM untuk menghasilkan laporan naratif forensik berbahasa Indonesia berdasarkan log mentah, skor anomali, dan vektor serangan. Model berjalan 100% lokal (Ollama) — tidak ada data yang dikirim ke internet.
                </p>
                <button
                  onClick={handleRunLocalLlm}
                  className="w-full px-3 py-2 text-xs font-semibold text-violet-300 bg-violet-950/50 hover:bg-violet-900/60 border border-violet-800/70 rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  Jalankan Analisis Local LLM
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================
          TAB: MITIGASI IT/OT
      ================================================================ */}
      {activeTab === 'mitigasi' && (
        <div className="space-y-3">
          <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4">
            <h3 className="text-xs font-mono font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Tindakan Mitigasi Otonom — Dieksekusi &lt; 50 ms
            </h3>
            <p className="text-[11px] text-zinc-500 font-mono mb-4">
              Mesin Mitigasi IT: iptables DROP + kunci akun IAM. &nbsp;·&nbsp; Mesin Mitigasi OT: putus sesi SCADA + rollback register PLC ke kondisi fail-safe.
            </p>
            <div className="space-y-3">
              {incident.mitigations.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded border ${
                    m.success
                      ? 'border-emerald-900/70 bg-emerald-950/20'
                      : 'border-red-900/70 bg-red-950/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      {MITIGATION_ICON_MAP[m.action]}
                      <span className="text-xs font-mono font-bold text-zinc-100">{m.action}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className={m.success ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                        {m.success ? '✓ BERHASIL' : '✗ GAGAL'}
                      </span>
                      <span className={`${m.latencyMs <= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {m.latencyMs} ms
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 mb-1.5">
                    Target: <span className="text-zinc-200 font-medium">{m.target}</span>
                  </div>
                  <code className="block text-[10px] font-mono text-emerald-300 bg-zinc-900/80 px-2 py-1.5 rounded border border-zinc-800 leading-relaxed">
                    {m.detail}
                  </code>
                  {m.executedAt && (
                    <div className="text-[10px] font-mono text-zinc-500 mt-1.5">
                      Dieksekusi: {m.executedAt}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          TAB: SOP
      ================================================================ */}
      {activeTab === 'sop' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-mono font-semibold text-zinc-300">
              Rekomendasi Taktis Sesuai SOP
            </h3>
            <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
              {sopDone}/{incident.rekomendasiSop.length} Selesai
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{
                width: `${
                  incident.rekomendasiSop.length > 0
                    ? (sopDone / incident.rekomendasiSop.length) * 100
                    : 0
                }%`,
              }}
            />
          </div>

          <div className="space-y-2.5">
            {incident.rekomendasiSop.map((sop) => (
              <button
                key={sop.id}
                type="button"
                onClick={() => onToggleSop(incident.id, sop.id)}
                className={`w-full text-left p-2.5 rounded border transition-colors flex items-start gap-2.5 cursor-pointer ${
                  sop.selesai
                    ? 'bg-zinc-900/50 border-zinc-800 opacity-70'
                    : 'bg-zinc-900 border-zinc-700/80 hover:border-zinc-600'
                }`}
              >
                {sop.selesai
                  ? <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  : <Square      className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                }
                <div className="text-xs font-mono space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-100">{sop.kode}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-400">{sop.target}</span>
                  </div>
                  <p className={`leading-snug font-sans text-xs ${sop.selesai ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                    {sop.tindakan}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================
          TAB: LOG MENTAH
      ================================================================ */}
      {activeTab === 'rawlog' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4">
          <h3 className="text-xs font-mono font-semibold text-zinc-300 mb-3 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            Cuplikan Log Mentah — Bukti Forensik Digital
          </h3>
          {incident.rawLogSnippet ? (
            <pre className="text-[10px] font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap bg-zinc-900/60 p-3 rounded border border-zinc-800 overflow-x-auto max-h-72">
              {incident.rawLogSnippet}
            </pre>
          ) : (
            <p className="text-xs text-zinc-500 font-mono">Log mentah tidak tersedia.</p>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label, value, valueColor, truncate,
}: {
  label: string; value: string; valueColor: string; truncate?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-zinc-400 shrink-0">{label}:</span>
      <span
        className={`${valueColor} font-semibold text-right ${truncate ? 'truncate max-w-[220px]' : ''}`}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}
