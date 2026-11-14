# ============================================================================
# KARTIKA LogGuard-OT — WebSocket Endpoints
# Real-time push: telemetry stream + incident feed
# ============================================================================

from __future__ import annotations

import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.state_manager import state
from app.services.telemetry_generator import generate_next_point

logger = logging.getLogger(__name__)
router = APIRouter(tags=["websocket"])

# Interval antar push (detik) — sama dengan setInterval 3000 ms di App.tsx
TELEMETRY_INTERVAL = 3.0


# ---------------------------------------------------------------------------
# WebSocket Connection Manager
# ---------------------------------------------------------------------------

class ConnectionManager:
    """Kelola semua koneksi WebSocket aktif."""

    def __init__(self) -> None:
        self._telemetry_clients: list[WebSocket] = []
        self._incident_clients:  list[WebSocket] = []

    async def connect_telemetry(self, ws: WebSocket) -> None:
        await ws.accept()
        self._telemetry_clients.append(ws)
        logger.info("Telemetry WS client connected. Total: %d", len(self._telemetry_clients))

    async def connect_incident(self, ws: WebSocket) -> None:
        await ws.accept()
        self._incident_clients.append(ws)
        logger.info("Incident WS client connected. Total: %d", len(self._incident_clients))

    def disconnect_telemetry(self, ws: WebSocket) -> None:
        self._telemetry_clients.discard(ws) if hasattr(self._telemetry_clients, "discard") else None
        if ws in self._telemetry_clients:
            self._telemetry_clients.remove(ws)

    def disconnect_incident(self, ws: WebSocket) -> None:
        if ws in self._incident_clients:
            self._incident_clients.remove(ws)

    async def broadcast_telemetry(self, point: dict) -> None:
        dead: list[WebSocket] = []
        for ws in list(self._telemetry_clients):
            try:
                await ws.send_json(point)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect_telemetry(ws)

    async def broadcast_incident(self, incident: dict) -> None:
        dead: list[WebSocket] = []
        for ws in list(self._incident_clients):
            try:
                await ws.send_json(incident)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect_incident(ws)


manager = ConnectionManager()


# ---------------------------------------------------------------------------
# WS /ws/telemetry
# ---------------------------------------------------------------------------

@router.websocket("/ws/telemetry")
async def ws_telemetry(websocket: WebSocket):
    """
    Stream telemetri real-time ke frontend.
    - Saat koneksi: kirim seluruh window saat ini (12 titik).
    - Setiap TELEMETRY_INTERVAL detik: generate & kirim titik baru.
    - Klien dapat mengirim JSON {"command": "pause"} / {"command": "resume"}.
    """
    await manager.connect_telemetry(websocket)
    paused = False

    # Kirim snapshot awal
    snapshot = [p.model_dump() for p in state.telemetry]
    await websocket.send_json({"type": "snapshot", "data": snapshot})

    try:
        async def push_loop():
            nonlocal paused
            while True:
                await asyncio.sleep(TELEMETRY_INTERVAL)
                if not paused and state.is_streaming:
                    latest = state.latest_telemetry()
                    new_point = generate_next_point(latest, state.system_normalized)
                    state.push_telemetry(new_point)
                    await manager.broadcast_telemetry({
                        "type": "point",
                        "data": new_point.model_dump(),
                    })

        # Jalankan push loop dan listener pesan klien secara bersamaan
        push_task = asyncio.create_task(push_loop())

        async def listen_loop():
            nonlocal paused
            while True:
                try:
                    msg = await websocket.receive_json()
                    cmd = msg.get("command", "")
                    if cmd == "pause":
                        paused = True
                    elif cmd == "resume":
                        paused = False
                    elif cmd == "ping":
                        await websocket.send_json({"type": "pong"})
                except Exception:
                    break

        await listen_loop()
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.warning("WS telemetry error: %s", exc)
    finally:
        push_task.cancel()
        manager.disconnect_telemetry(websocket)
        logger.info("Telemetry WS client disconnected.")


# ---------------------------------------------------------------------------
# WS /ws/incidents
# ---------------------------------------------------------------------------

@router.websocket("/ws/incidents")
async def ws_incidents(websocket: WebSocket):
    """
    Push-notifikasi insiden baru ke frontend secara real-time.
    Digunakan saat simulate_attack() dipanggil via REST;
    backend broadcast insiden baru ke semua klien WS yang terhubung.

    Klien juga menerima snapshot awal daftar insiden saat koneksi.
    """
    await manager.connect_incident(websocket)

    # Kirim snapshot awal
    snapshot = [i.model_dump() for i in state.incidents]
    await websocket.send_json({"type": "snapshot", "data": snapshot})

    try:
        # Terus terhubung — tunggu disconnect
        while True:
            try:
                msg = await websocket.receive_json()
                if msg.get("command") == "ping":
                    await websocket.send_json({"type": "pong"})
            except Exception:
                break
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect_incident(websocket)
        logger.info("Incident WS client disconnected.")


# ---------------------------------------------------------------------------
# Helper untuk broadcast dari router lain (incidents.py)
# ---------------------------------------------------------------------------

async def notify_new_incident(incident_dict: dict) -> None:
    """Dipanggil oleh incidents router setelah simulasi serangan."""
    await manager.broadcast_incident({"type": "new_incident", "data": incident_dict})
