// ============================================================================
// KARTIKA LogGuard-OT — Main App
// Sistem Deteksi Anomali & Mitigasi Aktif IT/OT Militer
// Arsitektur: 100% On-Premise / Air-Gapped (Demo Mode)
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import Header        from './components/Header';
import ControlStrip  from './components/ControlStrip';
import MetricCards   from './components/MetricCards';
import TelemetryPanel from './components/TelemetryPanel';
import MitigationTable from './components/MitigationTable';
import XaiPanel      from './components/XaiPanel';

import { INITIAL_TELEMETRY, INITIAL_INCIDENTS, SIMULATED_ATTACK_TEMPLATES } from './data/mockData';
import type { TelemetryPoint, IncidentLog, SeverityLevel, SystemMetrics } from './types';

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

export default function App() {
  // --- Clock ---
  const [currentTime, setCurrentTime] = useState<string>(() => new Date().toTimeString().split(' ')[0]);

  // --- State Inti ---
  const [telemetry,        setTelemetry]        = useState<TelemetryPoint[]>(INITIAL_TELEMETRY);
  const [incidents,        setIncidents]        = useState<IncidentLog[]>(INITIAL_INCIDENTS);
  const [selectedId,       setSelectedId]       = useState<string>(INITIAL_INCIDENTS[0].id);
  const [isStreaming,      setIsStreaming]       = useState<boolean>(true);
  const [systemNormalized, setSystemNormalized] = useState<boolean>(false);
  const [simCounter,       setSimCounter]       = useState<number>(0);
  const [actionBanner,     setActionBanner]     = useState<string | null>(null);

  // --- Navigasi ---
  const [activeSection, setActiveSection] = useState<string>('semua');

  // --- Real-time Clock ---
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date().toTimeString().split(' ')[0]), 1000);
    return () => clearInterval(t);
  }, []);

  // --- Live Telemetry Stream ---
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      const timeStr = new Date().toTimeString().split(' ')[0];
      setTelemetry((prev) => {
        const last = prev[prev.length - 1];
        let suhu: number, ssh: number, modbus: number, isoScore: number, isAnomaly = false;

        if (!systemNormalized && last?.suhuAmmo >= 60) {
          // Pertahankan kondisi kritis
          const j = (Math.random() - 0.5) * 1.0;
          suhu      = Number(Math.min(86.5, Math.max(83.5, 85.0 + j)).toFixed(1));
          ssh       = Math.floor(360 + Math.random() * 140);
          modbus    = Math.floor(40 + Math.random() * 28);
          isoScore  = 0.94 + Math.random() * 0.05;
          isAnomaly = true;
        } else {
          // Trafik normal baseline
          suhu      = Number(Math.min(23.8, Math.max(18.2, 20.8 + (Math.random() - 0.5) * 3.6)).toFixed(1));
          ssh       = Math.floor(4 + Math.random() * 10);
          modbus    = Math.floor(Math.random() * 2);
          isoScore  = 0.03 + Math.random() * 0.12;
          isAnomaly = false;
        }

        return [
          ...prev.slice(1),
          { time: timeStr, suhuAmmo: suhu, batasAman: 24.0, sshAuthRate: ssh, modbusWriteCount: modbus, isolationScore: Number(isoScore.toFixed(2)), isAnomaly },
        ];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isStreaming, systemNormalized]);

  // --- Derived State ---
  const selectedIncident = useMemo(() => incidents.find((i) => i.id === selectedId) ?? incidents[0], [incidents, selectedId]);
  const latestPoint = telemetry[telemetry.length - 1] ?? INITIAL_TELEMETRY[INITIAL_TELEMETRY.length - 1];

  const overallStatus: SeverityLevel = useMemo(() => {
    if (systemNormalized) return 'AMAN';
    if (incidents.some((i) => i.kategoriRisiko === 'KRITIS')) return 'KRITIS';
    if (incidents.some((i) => i.kategoriRisiko === 'TINGGI')) return 'TINGGI';
    if (incidents.some((i) => i.kategoriRisiko === 'SEDANG')) return 'SEDANG';
    return 'AMAN';
  }, [incidents, systemNormalized]);

  const metrics: SystemMetrics = useMemo(() => {
    const sum = incidents.reduce((acc, i) => acc + i.waktuMitigasiMs, 0);
    const blockedIPs = [...new Set(
      incidents.filter((i) => i.kategoriRisiko !== 'AMAN').map((i) => i.ipPenyerang)
    )];
    return {
      totalInsiden:  incidents.length,
      kritisCount:   incidents.filter((i) => i.kategoriRisiko === 'KRITIS').length,
      tinggiCount:   incidents.filter((i) => i.kategoriRisiko === 'TINGGI').length,
      sedangCount:   incidents.filter((i) => i.kategoriRisiko === 'SEDANG').length,
      rendahCount:   incidents.filter((i) => i.kategoriRisiko === 'RENDAH').length,
      amanCount:     incidents.filter((i) => i.kategoriRisiko === 'AMAN').length,
      avgMitigasiMs: incidents.length > 0 ? Math.round(sum / incidents.length) : 0,
      uptimePercent: 99.97,
      logsPerMinute: Math.floor(12 + Math.random() * 8),
      blockedIPs,
    };
  }, [incidents]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSimulateAttack = () => {
    const template = SIMULATED_ATTACK_TEMPLATES[simCounter % SIMULATED_ATTACK_TEMPLATES.length];
    const now     = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const msStr   = String(now.getMilliseconds()).padStart(3, '0');
    const newId   = `INC-2026-${892 + simCounter}`;

    const newIncident: IncidentLog = {
      id:              newId,
      timestamp:       `${timeStr}.${msStr}`,
      sumber:          template.sumber!,
      asetTarget:      template.asetTarget!,
      ipPenyerang:     template.ipPenyerang!,
      protokol:        template.protokol!,
      skorRisiko:      template.skorRisiko!,
      kategoriRisiko:  template.kategoriRisiko!,
      statusBlokir:    template.mitigations?.[0]?.action === 'BLOKIR_IP'
                         ? `IP Diblokir (${template.waktuMitigasiMs} ms)`
                         : `Ditangani (${template.waktuMitigasiMs} ms)`,
      waktuMitigasiMs: template.waktuMitigasiMs!,
      judulInsiden:    template.judulInsiden!,
      vektorSerangan:  template.vektorSerangan!,
      ringkasanAi:     template.ringkasanAi!,
      alasanDeteksi:   template.alasanDeteksi!,
      rekomendasiSop:  (template.rekomendasiSop ?? []).map((s, idx) => ({
        ...s,
        id: `sop-sim-${simCounter}-${idx}`,
      })),
      mitigations: (template.mitigations ?? []).map((m) => ({
        ...m,
        executedAt: `${timeStr}.${msStr}`,
      })),
      suhuPuncak:  template.suhuPuncak,
      sshSpike:    template.sshSpike,
      rawLogSnippet: template.rawLogSnippet,
    };

    setSystemNormalized(false);
    setIncidents((prev) => [newIncident, ...prev]);
    setSelectedId(newId);
    setSimCounter((prev) => prev + 1);

    // Masukkan spike ke chart telemetri
    setTelemetry((prev) => [
      ...prev.slice(1),
      {
        time: timeStr,
        suhuAmmo: template.suhuPuncak ?? 50,
        batasAman: 24.0,
        sshAuthRate: template.sshSpike ?? 200,
        modbusWriteCount: 55,
        isolationScore: Math.min(0.99, 0.90 + Math.random() * 0.09),
        isAnomaly: (template.suhuPuncak ?? 0) > 24.0,
      },
    ]);

    setActionBanner(
      `[${newId}] Serangan baru dari ${template.ipPenyerang} terdeteksi & diblokir dalam ${template.waktuMitigasiMs} ms.`
    );
  };

  const handleNormalizeSystem = () => {
    const timeStr = new Date().toTimeString().split(' ')[0];
    setSystemNormalized(true);
    setTelemetry((prev) => [
      ...prev.slice(2),
      { time: timeStr, suhuAmmo: 27.5, batasAman: 24.0, sshAuthRate: 15,  modbusWriteCount: 2, isolationScore: 0.42, isAnomaly: false },
      { time: timeStr, suhuAmmo: 20.8, batasAman: 24.0, sshAuthRate: 8,   modbusWriteCount: 1, isolationScore: 0.06, isAnomaly: false },
    ]);
    setIncidents((prev) =>
      prev.map((inc) => ({
        ...inc,
        rekomendasiSop: inc.rekomendasiSop.map((s) => ({ ...s, selesai: true })),
      }))
    );
    setActionBanner('Interlock Pendingin Darurat diaktifkan: Suhu OT-PLC-AMMO-04 kembali ke rentang aman (20.8°C). Semua SOP ditandai selesai.');
  };

  const handleResetScenario = () => {
    setTelemetry(INITIAL_TELEMETRY);
    setIncidents(INITIAL_INCIDENTS);
    setSelectedId(INITIAL_INCIDENTS[0].id);
    setSystemNormalized(false);
    setSimCounter(0);
    setActionBanner("Skenario utama dipulihkan: Insiden Brute-Force 'admin_logistik' & Manipulasi Modbus TCP OT-PLC-AMMO-04 (85.0°C).");
  };

  const handleToggleSop = (incidentId: string, sopId: string) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id !== incidentId ? inc : {
          ...inc,
          rekomendasiSop: inc.rekomendasiSop.map((s) => s.id === sopId ? { ...s, selesai: !s.selesai } : s),
        }
      )
    );
  };

  // Callback ketika Local LLM selesai generate — update ringkasan di state
  const handleUpdateAiAnalysis = (_incidentId: string, _analysis: string) => {
    // Output LLM disimpan lokal di XaiPanel; tidak perlu update global state
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const showTelemetri = activeSection === 'semua' || activeSection === 'telemetri';
  const showMitigasi  = activeSection === 'semua' || activeSection === 'mitigasi';
  const showXai       = activeSection === 'semua' || activeSection === 'xai';
  const isFullWidth   = activeSection !== 'semua';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">

      {/* === HEADER === */}
      <Header
        currentTime={currentTime}
        overallSystemStatus={overallStatus}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onSimulateAttack={handleSimulateAttack}
      />

      {/* === CONTROL STRIP === */}
      <ControlStrip
        latestPoint={latestPoint}
        avgMitigationMs={metrics.avgMitigasiMs}
        isStreaming={isStreaming}
        actionBanner={actionBanner}
        onToggleStream={() => setIsStreaming((p) => !p)}
        onNormalizeSystem={handleNormalizeSystem}
        onResetScenario={handleResetScenario}
        onDismissBanner={() => setActionBanner(null)}
      />

      {/* === METRIC SUMMARY CARDS === */}
      <MetricCards metrics={metrics} />

      {/* === MAIN DASHBOARD GRID ===
          Responsive breakpoints:
          - Mobile (default):  1 kolom, semua panel stack vertikal
          - md (768px):        2 kolom — Telemetri kiri, Mitigasi kanan; XAI penuh di bawah
          - xl (1280px):       3 kolom — Telemetri | Mitigasi | XAI berdampingan
          - Full-width mode:   1 kolom penuh (saat section filter aktif)
      === */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 pb-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 items-start">

        {/* LAPIS 1 & 2: TELEMETRI */}
        {showTelemetri && (
          <div className={isFullWidth ? 'md:col-span-2 xl:col-span-3' : ''}>
            <TelemetryPanel telemetry={telemetry} isFullWidth={isFullWidth} />
          </div>
        )}

        {/* LAPIS 3: MITIGASI TABLE */}
        {showMitigasi && (
          <div className={isFullWidth ? 'md:col-span-2 xl:col-span-3' : ''}>
            <MitigationTable
              incidents={incidents}
              selectedIncidentId={selectedId}
              onSelectIncident={setSelectedId}
              isFullWidth={isFullWidth}
            />
          </div>
        )}

        {/* LAPIS 4: XAI PANEL */}
        {showXai && selectedIncident && (
          /* Saat semua panel tampil: di md XAI mengambil penuh baris ke-2 */
          <div className={
            isFullWidth
              ? 'md:col-span-2 xl:col-span-3'
              : (showTelemetri && showMitigasi ? 'md:col-span-2 xl:col-span-1' : '')
          }>
            <XaiPanel
              incident={selectedIncident}
              onToggleSop={handleToggleSop}
              onUpdateAiAnalysis={handleUpdateAiAnalysis}
              isFullWidth={isFullWidth}
            />
          </div>
        )}

      </main>

      {/* === FOOTER === */}
      <footer className="border-t border-zinc-800 bg-zinc-950 px-4 sm:px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] sm:text-[11px] font-mono text-zinc-500">
          <span>KARTIKA LogGuard-OT v1.0 · On-Premise / Air-Gapped · Mode Demo</span>
          <span className="text-zinc-600">ML: Isolation Forest + Heuristic · Mitigasi: eBPF/XDP &lt; 50 ms</span>
        </div>
      </footer>
    </div>
  );
}
