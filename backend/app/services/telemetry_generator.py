# ============================================================================
# KARTIKA LogGuard-OT — Synthetic Telemetry Generator
# Lapis 1: Data Ingestion — Mirror logika dari App.tsx useEffect stream
# ============================================================================

from __future__ import annotations

import random
from datetime import datetime

from app.models import TelemetryPoint
from app.services.anomaly_detector import detector


def generate_next_point(
    last: TelemetryPoint,
    system_normalized: bool,
) -> TelemetryPoint:
    """
    Hasilkan satu TelemetryPoint baru berdasarkan state sistem saat ini.
    Logika ini adalah mirror 1:1 dari useEffect stream di App.tsx.
    """
    time_str = datetime.now().strftime("%H:%M:%S")

    if not system_normalized and last.suhuAmmo >= 60.0:
        # Kondisi kritis — pertahankan anomali
        jitter   = (random.random() - 0.5) * 1.0
        suhu     = round(min(86.5, max(83.5, 85.0 + jitter)), 1)
        ssh      = random.randint(360, 500)
        modbus   = random.randint(40, 68)
        iso      = round(0.94 + random.random() * 0.05, 2)
        is_anom  = True
    else:
        # Trafik normal baseline
        suhu     = round(min(23.8, max(18.2, 20.8 + (random.random() - 0.5) * 3.6)), 1)
        ssh      = random.randint(4, 14)
        modbus   = random.randint(0, 1)
        iso      = round(0.03 + random.random() * 0.12, 2)
        is_anom  = False

    # Override iso_score dengan nilai dari ML model jika lebih tinggi
    ml_score, ml_anomaly, _ = detector.predict(
        TelemetryPoint(
            time=time_str,
            suhuAmmo=suhu,
            batasAman=24.0,
            sshAuthRate=ssh,
            modbusWriteCount=modbus,
            isolationScore=iso,
        )
    )
    final_iso   = max(iso, ml_score)
    final_anom  = is_anom or ml_anomaly

    return TelemetryPoint(
        time=time_str,
        suhuAmmo=suhu,
        batasAman=24.0,
        sshAuthRate=ssh,
        modbusWriteCount=modbus,
        isolationScore=round(final_iso, 2),
        isAnomaly=final_anom,
    )


def generate_attack_spike(suhu_puncak: float, ssh_spike: int) -> TelemetryPoint:
    """Buat satu titik data spike untuk menandai simulasi serangan di chart."""
    time_str = datetime.now().strftime("%H:%M:%S")
    iso = round(min(0.99, 0.90 + random.random() * 0.09), 2)
    return TelemetryPoint(
        time=time_str,
        suhuAmmo=suhu_puncak,
        batasAman=24.0,
        sshAuthRate=ssh_spike,
        modbusWriteCount=55,
        isolationScore=iso,
        isAnomaly=suhu_puncak > 24.0,
    )


def generate_normalize_points() -> list[TelemetryPoint]:
    """Dua titik pemulihan setelah sistem dinormalisasi (mirror handleNormalizeSystem)."""
    t = datetime.now().strftime("%H:%M:%S")
    return [
        TelemetryPoint(time=t, suhuAmmo=27.5, batasAman=24.0, sshAuthRate=15,  modbusWriteCount=2, isolationScore=0.42, isAnomaly=False),
        TelemetryPoint(time=t, suhuAmmo=20.8, batasAman=24.0, sshAuthRate=8,   modbusWriteCount=1, isolationScore=0.06, isAnomaly=False),
    ]
