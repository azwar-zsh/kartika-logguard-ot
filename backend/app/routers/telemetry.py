# ============================================================================
# KARTIKA LogGuard-OT — Router: Telemetry + System Control
# ============================================================================

from __future__ import annotations

from fastapi import APIRouter

from app.models import (
    TelemetryPoint, SystemMetrics,
    NormalizeResponse, ResetResponse,
)
from app.services.state_manager import state
from app.services.telemetry_generator import generate_normalize_points
from app.data.mock_data import INITIAL_INCIDENTS, INITIAL_TELEMETRY

import random

router = APIRouter(tags=["telemetry"])


# ---------------------------------------------------------------------------
# GET /api/telemetry
# ---------------------------------------------------------------------------

@router.get("/api/telemetry", response_model=list[TelemetryPoint])
async def get_telemetry():
    """Kembalikan window telemetri saat ini (12 titik terakhir)."""
    return state.telemetry


# ---------------------------------------------------------------------------
# GET /api/metrics
# ---------------------------------------------------------------------------

@router.get("/api/metrics", response_model=SystemMetrics)
async def get_metrics():
    """Agregasi metrik sistem — mirror kalkulasi useMemo metrics di App.tsx."""
    incidents = state.incidents
    total = len(incidents)
    total_ms = sum(i.waktuMitigasiMs for i in incidents)
    blocked_ips = list({
        i.ipPenyerang for i in incidents if i.kategoriRisiko != "AMAN"
    })
    return SystemMetrics(
        totalInsiden=total,
        kritisCount=sum(1 for i in incidents if i.kategoriRisiko == "KRITIS"),
        tinggiCount=sum(1 for i in incidents if i.kategoriRisiko == "TINGGI"),
        sedangCount=sum(1 for i in incidents if i.kategoriRisiko == "SEDANG"),
        rendahCount=sum(1 for i in incidents if i.kategoriRisiko == "RENDAH"),
        amanCount=sum(1  for i in incidents if i.kategoriRisiko == "AMAN"),
        avgMitigasiMs=round(total_ms / total) if total else 0,
        uptimePercent=99.97,
        logsPerMinute=random.randint(12, 20),
        blockedIPs=blocked_ips,
    )


# ---------------------------------------------------------------------------
# POST /api/system/normalize
# ---------------------------------------------------------------------------

@router.post("/api/system/normalize", response_model=NormalizeResponse)
async def normalize_system():
    """
    Aktifkan fail-safe: set suhu kembali normal, tandai semua SOP selesai.
    Mirror handleNormalizeSystem() di App.tsx.
    """
    state.system_normalized = True
    new_points = generate_normalize_points()
    # Ganti dua titik terakhir
    current = state.telemetry
    state.set_telemetry([*current[:-2], *new_points])
    state.normalize_all_sop()

    return NormalizeResponse(
        message=(
            "Interlock Pendingin Darurat diaktifkan: Suhu OT-PLC-AMMO-04 kembali ke rentang aman (20.8°C). "
            "Semua SOP ditandai selesai."
        ),
        newTelemetry=state.telemetry,
    )


# ---------------------------------------------------------------------------
# POST /api/system/reset
# ---------------------------------------------------------------------------

@router.post("/api/system/reset", response_model=ResetResponse)
async def reset_scenario():
    """
    Pulihkan skenario awal: insiden dan telemetri kembali ke data mock awal.
    Mirror handleResetScenario() di App.tsx.
    """
    state.reset()
    return ResetResponse(
        message=(
            "Skenario utama dipulihkan: Insiden Brute-Force 'admin_logistik' "
            "& Manipulasi Modbus TCP OT-PLC-AMMO-04 (85.0°C)."
        ),
        incidents=state.incidents,
        telemetry=state.telemetry,
    )
