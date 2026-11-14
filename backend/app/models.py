# ============================================================================
# KARTIKA LogGuard-OT — Pydantic Models (mirror dari src/types.ts)
# ============================================================================

from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, Field


# --- Enums / Literal types ---

SeverityLevel = Literal["KRITIS", "TINGGI", "SEDANG", "RENDAH", "AMAN"]
DomainSource  = Literal["OT", "IT", "IT/OT"]
MitigationAction = Literal[
    "BLOKIR_IP", "KUNCI_AKUN", "PUTUS_SCADA",
    "ROLLBACK_PLC", "DIIZINKAN", "TOLAK_PAKET",
]


# --- Sub-models ---

class TelemetryPoint(BaseModel):
    time:              str
    suhuAmmo:          float
    batasAman:         float   = 24.0
    sshAuthRate:       int
    modbusWriteCount:  int
    isolationScore:    float   = Field(..., ge=0.0, le=1.0)
    isAnomaly:         bool    = False


class XaiReason(BaseModel):
    faktor: str
    bobot:  int    = Field(..., ge=0, le=100)
    detail: str


class SopItem(BaseModel):
    id:       str
    kode:     str
    tindakan: str
    target:   str
    selesai:  bool


class MitigationRecord(BaseModel):
    action:      MitigationAction
    target:      str
    detail:      str
    executedAt:  str
    latencyMs:   int
    success:     bool


# --- Main incident model ---

class IncidentLog(BaseModel):
    id:               str
    timestamp:        str
    sumber:           DomainSource
    asetTarget:       str
    ipPenyerang:      str
    protokol:         str
    skorRisiko:       int      = Field(..., ge=0, le=100)
    kategoriRisiko:   SeverityLevel
    statusBlokir:     str
    waktuMitigasiMs:  int
    judulInsiden:     str
    ringkasanAi:      str
    vektorSerangan:   str
    alasanDeteksi:    list[XaiReason]
    rekomendasiSop:   list[SopItem]
    mitigations:      list[MitigationRecord]
    suhuPuncak:       Optional[float] = None
    sshSpike:         Optional[int]   = None
    rawLogSnippet:    Optional[str]   = None
    aiAnalysisLoading: Optional[bool] = False


# --- System-level aggregation ---

class SystemMetrics(BaseModel):
    totalInsiden:   int
    kritisCount:    int
    tinggiCount:    int
    sedangCount:    int
    rendahCount:    int
    amanCount:      int
    avgMitigasiMs:  int
    uptimePercent:  float
    logsPerMinute:  int
    blockedIPs:     list[str]


# --- Request / Response payloads ---

class SimulateAttackRequest(BaseModel):
    """Opsional: pilih indeks template (0-2). Jika kosong, pakai round-robin."""
    template_index: Optional[int] = None


class SimulateAttackResponse(BaseModel):
    incident:       IncidentLog
    telemetrySpike: TelemetryPoint


class SopToggleResponse(BaseModel):
    incident: IncidentLog


class NormalizeResponse(BaseModel):
    message:       str
    newTelemetry:  list[TelemetryPoint]


class ResetResponse(BaseModel):
    message:   str
    incidents: list[IncidentLog]
    telemetry: list[TelemetryPoint]
