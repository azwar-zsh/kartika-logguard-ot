# ============================================================================
# KARTIKA LogGuard-OT — Router: XAI (Explainable AI via Ollama)
# ============================================================================

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.services.state_manager import state
from app.services.ollama_client import generate_analysis, stream_analysis

router = APIRouter(prefix="/api/xai", tags=["xai"])


# ---------------------------------------------------------------------------
# POST /api/xai/{incident_id}/analyze
# ---------------------------------------------------------------------------

@router.post("/{incident_id}/analyze")
async def analyze_incident(incident_id: str) -> dict:
    """
    Panggil Ollama LLM lokal untuk menganalisis insiden dan kembalikan
    ringkasan taktis berbahasa Indonesia (non-streaming).
    """
    incident = state.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Insiden {incident_id} tidak ditemukan.")

    analysis = await generate_analysis(incident)
    return {"incident_id": incident_id, "analysis": analysis}


# ---------------------------------------------------------------------------
# GET /api/xai/{incident_id}/stream
# ---------------------------------------------------------------------------

@router.get("/{incident_id}/stream")
async def stream_incident_analysis(incident_id: str):
    """
    Stream token per token dari Ollama via Server-Sent Events (SSE).
    Frontend dapat menggunakan EventSource atau fetch reader untuk konsumsi bertahap.

    Format SSE: setiap baris dimulai dengan "data: <token>\n\n"
    """
    incident = state.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Insiden {incident_id} tidak ditemukan.")

    async def sse_generator():
        async for token in stream_analysis(incident):
            # Escape newline dalam token agar tidak merusak format SSE
            safe_token = token.replace("\n", "\\n")
            yield f"data: {safe_token}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        sse_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # Nginx passthrough
        },
    )
