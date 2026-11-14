# ============================================================================
# KARTIKA LogGuard-OT — In-Memory State Manager
# Menyimpan state global: incidents, telemetry, system flags
# ============================================================================
"""
Karena proyek ini air-gapped / on-premise demo, state disimpan in-memory.
Untuk deployment produksi, ganti dengan Redis atau PostgreSQL.
"""

from __future__ import annotations

import copy
import threading
from datetime import datetime

from app.models import IncidentLog, TelemetryPoint, SopItem, MitigationRecord
from app.data.mock_data import INITIAL_INCIDENTS, INITIAL_TELEMETRY, ATTACK_TEMPLATES


class AppState:
    """Thread-safe in-memory state container."""

    TELEMETRY_WINDOW = 12   # Jumlah titik telemetri yang disimpan (sama dengan frontend)

    def __init__(self) -> None:
        self._lock             = threading.Lock()
        self._incidents:        list[IncidentLog]     = copy.deepcopy(INITIAL_INCIDENTS)
        self._telemetry:        list[TelemetryPoint]  = copy.deepcopy(INITIAL_TELEMETRY)
        self._system_normalized: bool                 = False
        self._sim_counter:       int                  = 0
        self._is_streaming:      bool                 = True

    # ------------------------------------------------------------------
    # Telemetry
    # ------------------------------------------------------------------

    @property
    def telemetry(self) -> list[TelemetryPoint]:
        with self._lock:
            return list(self._telemetry)

    def push_telemetry(self, point: TelemetryPoint) -> None:
        with self._lock:
            self._telemetry = [*self._telemetry[1:], point]

    def set_telemetry(self, points: list[TelemetryPoint]) -> None:
        with self._lock:
            self._telemetry = list(points[-self.TELEMETRY_WINDOW:])

    def latest_telemetry(self) -> TelemetryPoint:
        with self._lock:
            return self._telemetry[-1]

    # ------------------------------------------------------------------
    # Incidents
    # ------------------------------------------------------------------

    @property
    def incidents(self) -> list[IncidentLog]:
        with self._lock:
            return list(self._incidents)

    def get_incident(self, incident_id: str) -> IncidentLog | None:
        with self._lock:
            return next((i for i in self._incidents if i.id == incident_id), None)

    def prepend_incident(self, incident: IncidentLog) -> None:
        with self._lock:
            self._incidents = [incident, *self._incidents]

    def update_sop(self, incident_id: str, sop_id: str) -> IncidentLog | None:
        with self._lock:
            for i, inc in enumerate(self._incidents):
                if inc.id == incident_id:
                    updated_sop = [
                        SopItem(**{**s.model_dump(), "selesai": not s.selesai})
                        if s.id == sop_id else s
                        for s in inc.rekomendasiSop
                    ]
                    updated = inc.model_copy(update={"rekomendasiSop": updated_sop})
                    self._incidents[i] = updated
                    return updated
            return None

    def normalize_all_sop(self) -> None:
        """Tandai semua SOP selesai di semua insiden."""
        with self._lock:
            self._incidents = [
                inc.model_copy(update={
                    "rekomendasiSop": [
                        SopItem(**{**s.model_dump(), "selesai": True})
                        for s in inc.rekomendasiSop
                    ]
                })
                for inc in self._incidents
            ]

    # ------------------------------------------------------------------
    # System flags
    # ------------------------------------------------------------------

    @property
    def system_normalized(self) -> bool:
        with self._lock:
            return self._system_normalized

    @system_normalized.setter
    def system_normalized(self, value: bool) -> None:
        with self._lock:
            self._system_normalized = value

    @property
    def is_streaming(self) -> bool:
        with self._lock:
            return self._is_streaming

    @is_streaming.setter
    def is_streaming(self, value: bool) -> None:
        with self._lock:
            self._is_streaming = value

    # ------------------------------------------------------------------
    # Simulation counter & template
    # ------------------------------------------------------------------

    def next_template(self) -> dict:
        with self._lock:
            template = ATTACK_TEMPLATES[self._sim_counter % len(ATTACK_TEMPLATES)]
            self._sim_counter += 1
            return template

    def next_incident_id(self) -> str:
        with self._lock:
            return f"INC-2026-{892 + self._sim_counter}"

    # ------------------------------------------------------------------
    # Reset
    # ------------------------------------------------------------------

    def reset(self) -> None:
        with self._lock:
            self._incidents         = copy.deepcopy(INITIAL_INCIDENTS)
            self._telemetry         = copy.deepcopy(INITIAL_TELEMETRY)
            self._system_normalized = False
            self._sim_counter       = 0


# Singleton
state = AppState()
