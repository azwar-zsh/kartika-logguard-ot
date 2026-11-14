// ============================================================================
// KARTIKA LogGuard-OT — Type Definitions
// Sesuai PRD: Sistem Deteksi Anomali & Mitigasi Aktif IT/OT Militer
// ============================================================================

export type SeverityLevel = 'KRITIS' | 'TINGGI' | 'SEDANG' | 'RENDAH' | 'AMAN';
export type DomainSource = 'OT' | 'IT' | 'IT/OT';
export type MitigationAction = 'BLOKIR_IP' | 'KUNCI_AKUN' | 'PUTUS_SCADA' | 'ROLLBACK_PLC' | 'DIIZINKAN' | 'TOLAK_PAKET';

export interface TelemetryPoint {
  time: string;
  suhuAmmo: number;
  batasAman: number;
  sshAuthRate: number;
  modbusWriteCount: number;
  isolationScore: number; // Isolation Forest anomaly score (0-1, higher = more anomalous)
  isAnomaly?: boolean;
}

export interface XaiReason {
  faktor: string;
  bobot: number;
  detail: string;
}

export interface SopItem {
  id: string;
  kode: string;
  tindakan: string;
  target: string;
  selesai: boolean;
}

export interface MitigationRecord {
  action: MitigationAction;
  target: string;
  detail: string;
  executedAt: string;
  latencyMs: number;
  success: boolean;
}

export interface IncidentLog {
  id: string;
  timestamp: string;
  sumber: DomainSource;
  asetTarget: string;
  ipPenyerang: string;
  protokol: string;
  skorRisiko: number;       // 0-100
  kategoriRisiko: SeverityLevel;
  statusBlokir: string;
  waktuMitigasiMs: number;
  judulInsiden: string;
  ringkasanAi: string;
  vektorSerangan: string;
  alasanDeteksi: XaiReason[];
  rekomendasiSop: SopItem[];
  mitigations: MitigationRecord[];
  suhuPuncak?: number;
  sshSpike?: number;
  rawLogSnippet?: string;    // Snippet log mentah untuk XAI
  aiAnalysisLoading?: boolean; // Status loading analisis AI
}

export interface SystemMetrics {
  totalInsiden: number;
  kritisCount: number;
  tinggiCount: number;
  sedangCount: number;
  rendahCount: number;
  amanCount: number;
  avgMitigasiMs: number;
  uptimePercent: number;
  logsPerMinute: number;
  blockedIPs: string[];
}
