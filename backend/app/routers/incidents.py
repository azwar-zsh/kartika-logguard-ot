# ============================================================================
# KARTIKA LogGuard-OT — Router: Incidents
# ============================================================================

from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.models import (
    IncidentLog, MitigationRecord, SopItem, XaiReason,
    SimulateAttackRequest, SimulateAttackResponse,
    SopToggleResponse,
)
from app.services.state_manager import state
from app.services.telemetry_generator import generate_attack_spike

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


# ---------------------------------------------------------------------------
# GET /api/incidents
# ---------------------------------------------------------------------------

@router.get("", response_model=list[IncidentLog])
async def list_incidents(
    kategori: Optional[str] = Query(None, description="Filter by kategoriRisiko: KRITIS|TINGGI|SEDANG|RENDAH|AMAN"),
    sumber:   Optional[str] = Query(None, description="Filter by sumber domain: OT|IT|IT/OT"),
    limit:    int            = Query(50, ge=1, le=200),
):
    """Kembalikan daftar insiden, opsional filter dan limit."""
    incidents = state.incidents
    if kategori:
        incidents = [i for i in incidents if i.kategoriRisiko == kategori.upper()]
    if sumber:
        incidents = [i for i in incidents if i.sumber == sumber.upper()]
    return incidents[:limit]


# ---------------------------------------------------------------------------
# GET /api/incidents/{id}
# ---------------------------------------------------------------------------

@router.get("/{incident_id}", response_model=IncidentLog)
async def get_incident(incident_id: str):
    """Kembalikan satu insiden berdasarkan ID."""
    incident = state.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Insiden {incident_id} tidak ditemukan.")
    return incident


# ---------------------------------------------------------------------------
# POST /api/incidents/simulate
# ---------------------------------------------------------------------------

@router.post("/simulate", response_model=SimulateAttackResponse)
async def simulate_attack(body: SimulateAttackRequest = SimulateAttackRequest()):
    """
    Buat insiden baru dari template serangan.
    Mirror logika handleSimulateAttack() di App.tsx.
    """
    from app.data.mock_data import ATTACK_TEMPLATES

    now     = datetime.now()
    time_str = now.strftime("%H:%M:%S")
    ms_str   = str(now.microsecond // 1000).zfill(3)

    # Pilih template
    if body.template_index is not None:
        idx = body.template_index % len(ATTACK_TEMPLATES)
        template = ATTACK_TEMPLATES[idx]
        # Pastikan sim_counter tetap ter-update
        state.next_template()   # consume (increment counter)
        # Rewind ke template yang dipilih
        state._sim_counter -= 1  # noqa: SLF001 — internal workaround
        state._sim_counter = (state._sim_counter + idx) % len(ATTACK_TEMPLATES)
    else:
        template = state.next_template()

    new_id = f"INC-2026-{892 + state._sim_counter}"  # noqa: SLF001

    # Build mitigations
    mitigations = [
        MitigationRecord(
            action=m["action"],
            target=m["target"],
            detail=m["detail"],
            executedAt=f"{time_str}.{ms_str}",
            latencyMs=m["latencyMs"],
            success=m["success"],
        )
        for m in template.get("mitigations", [])
    ]

    # Build SOP items
    sop_items = [
        SopItem(
            id=f"sop-sim-{state._sim_counter}-{idx}",  # noqa: SLF001
            kode=s["kode"],
            tindakan=s["tindakan"],
            target=s["target"],
            selesai=s["selesai"],
        )
        for idx, s in enumerate(template.get("rekomendasiSop", []))
    ]

    # Build XAI reasons
    xai_reasons = [
        XaiReason(faktor=r["faktor"], bobot=r["bobot"], detail=r["detail"])
        for r in template.get("alasanDeteksi", [])
    ]

    # Determine statusBlokir label
    first_action = mitigations[0].action if mitigations else "DIIZINKAN"
    if first_action == "BLOKIR_IP":
        status = f"IP Diblokir ({template['waktuMitigasiMs']} ms)"
    else:
        status = f"Ditangani ({template['waktuMitigasiMs']} ms)"

    new_incident = IncidentLog(
        id=new_id,
        timestamp=f"{time_str}.{ms_str}",
        sumber=template["sumber"],
        asetTarget=template["asetTarget"],
        ipPenyerang=template["ipPenyerang"],
        protokol=template["protokol"],
        skorRisiko=template["skorRisiko"],
        kategoriRisiko=template["kategoriRisiko"],
        statusBlokir=status,
        waktuMitigasiMs=template["waktuMitigasiMs"],
        judulInsiden=template["judulInsiden"],
        vektorSerangan=template["vektorSerangan"],
        ringkasanAi=template["ringkasanAi"],
        alasanDeteksi=xai_reasons,
        rekomendasiSop=sop_items,
        mitigations=mitigations,
        suhuPuncak=template.get("suhuPuncak"),
        sshSpike=template.get("sshSpike"),
        rawLogSnippet=template.get("rawLogSnippet"),
    )

    state.system_normalized = False
    state.prepend_incident(new_incident)

    spike = generate_attack_spike(
        suhu_puncak=template.get("suhuPuncak", 50.0),
        ssh_spike=template.get("sshSpike", 200),
    )
    state.push_telemetry(spike)

    return SimulateAttackResponse(incident=new_incident, telemetrySpike=spike)


# ---------------------------------------------------------------------------
# PATCH /api/incidents/{id}/sop/{sop_id}
# ---------------------------------------------------------------------------

@router.patch("/{incident_id}/sop/{sop_id}", response_model=SopToggleResponse)
async def toggle_sop(incident_id: str, sop_id: str):
    """Toggle status selesai/belum selesai untuk satu item SOP."""
    updated = state.update_sop(incident_id, sop_id)
    if not updated:
        raise HTTPException(
            status_code=404,
            detail=f"Insiden {incident_id} atau SOP {sop_id} tidak ditemukan.",
        )
    return SopToggleResponse(incident=updated)
