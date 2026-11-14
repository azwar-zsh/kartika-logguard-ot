# ============================================================================
# KARTIKA LogGuard-OT — FastAPI Application Entry Point
# Lapis 1-4: Ingestion → Anomali → Mitigasi → XAI Dashboard
# ============================================================================

from __future__ import annotations

import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import incidents, telemetry, websocket, xai

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("kartika.logguard")

# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------

app = FastAPI(
    title="KARTIKA LogGuard-OT API",
    description=(
        "Sistem Deteksi Anomali & Mitigasi Aktif IT/OT Militer — "
        "Backend FastAPI untuk KARTIKA LogGuard-OT. "
        "Arsitektur 100% On-Premise / Air-Gapped."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS — izinkan frontend Vite dev server (port 3000) dan build statis
# ---------------------------------------------------------------------------

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(incidents.router)
app.include_router(telemetry.router)
app.include_router(xai.router)
app.include_router(websocket.router)   # WebSocket — tidak ada prefix

# ---------------------------------------------------------------------------
# Health / root
# ---------------------------------------------------------------------------

@app.get("/", tags=["health"])
async def root():
    return {
        "system": "KARTIKA LogGuard-OT",
        "version": "1.0.0",
        "status": "ONLINE",
        "mode": "Air-Gapped / On-Premise",
    }


@app.get("/health", tags=["health"])
async def health():
    from app.services.state_manager import state
    incidents = state.incidents
    return {
        "status": "healthy",
        "totalInsiden": len(incidents),
        "systemNormalized": state.system_normalized,
        "isStreaming": state.is_streaming,
    }


# ---------------------------------------------------------------------------
# Startup event
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def on_startup():
    logger.info("=" * 60)
    logger.info("KARTIKA LogGuard-OT Backend v1.0.0 — ONLINE")
    logger.info("Docs: http://localhost:8000/docs")
    logger.info("WebSocket Telemetry: ws://localhost:8000/ws/telemetry")
    logger.info("WebSocket Incidents: ws://localhost:8000/ws/incidents")
    logger.info("=" * 60)
    # Isolation Forest sudah di-fit saat import anomaly_detector
    from app.services.anomaly_detector import detector  # noqa: F401
    logger.info("Isolation Forest model: READY")
