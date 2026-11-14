# ============================================================================
# KARTIKA LogGuard-OT — Lapis 2: Anomali Detector (Isolation Forest + Rules)
# ============================================================================
"""
Menggabungkan dua strategi deteksi sesuai PRD:
  1. Rule-Based / Heuristic Triage  → instan, tanpa training
  2. Isolation Forest (scikit-learn) → unsupervised ML, trained on normal baseline
"""

from __future__ import annotations

import random
import numpy as np
from sklearn.ensemble import IsolationForest
from app.models import TelemetryPoint, SeverityLevel


# ---------------------------------------------------------------------------
# Heuristic thresholds — sesuai PRD & mock data
# ---------------------------------------------------------------------------

THRESHOLDS = {
    "ssh_brute_force":   10,    # req/5s  → lebih dari ini = brute force
    "suhu_ammo_max":     24.0,  # °C safe limit gudang amunisi
    "modbus_write_high": 5,     # write count tinggi per interval
    "iso_score_anomaly": 0.70,  # Isolation Forest score ≥ ini = anomali
}


class AnomalyDetector:
    """
    Diinisialisasi sekali saat app startup dan di-reuse sepanjang lifetime proses.
    Thread-safe untuk read (predict), write (refit) harus dijaga oleh caller.
    """

    def __init__(self) -> None:
        self._model: IsolationForest | None = None
        self._is_fitted: bool = False
        # Latih segera dengan data baseline sintetis
        self._fit_baseline()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def predict(self, point: TelemetryPoint) -> tuple[float, bool, SeverityLevel]:
        """
        Kembalikan (isolation_score, is_anomaly, severity_level).
        isolation_score: float 0–1 (makin tinggi makin anomali)
        """
        iso_score = self._isolation_score(point)
        rule_hit  = self._rule_check(point)
        is_anomaly = rule_hit or (iso_score >= THRESHOLDS["iso_score_anomaly"])
        severity   = self._classify_severity(point, iso_score, rule_hit)
        return round(iso_score, 4), is_anomaly, severity

    def score_from_fields(
        self,
        suhu: float,
        ssh_rate: int,
        modbus_writes: int,
    ) -> float:
        """Wrapper ringan untuk kalkulasi skor tanpa objek TelemetryPoint penuh."""
        tp = TelemetryPoint(
            time="",
            suhuAmmo=suhu,
            batasAman=24.0,
            sshAuthRate=ssh_rate,
            modbusWriteCount=modbus_writes,
            isolationScore=0.0,
        )
        score, _, _ = self.predict(tp)
        return score

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _fit_baseline(self) -> None:
        """Latih Isolation Forest dengan 300 titik data baseline normal sintetis."""
        rng = np.random.default_rng(seed=42)
        # [suhuAmmo, sshAuthRate, modbusWriteCount]
        normal_data = np.column_stack([
            rng.uniform(18.0, 23.8, 300),   # suhu aman
            rng.integers(4, 15, 300),        # SSH rate normal
            rng.integers(0, 2, 300),         # modbus writes normal
        ])
        self._model = IsolationForest(
            n_estimators=100,
            contamination=0.05,   # ~5% outlier expected in training set
            random_state=42,
            n_jobs=-1,
        )
        self._model.fit(normal_data)
        self._is_fitted = True

    def _isolation_score(self, point: TelemetryPoint) -> float:
        """
        Konversi raw Isolation Forest score ke rentang [0, 1].
        sklearn mengembalikan score_samples dalam range (-∞, 0].
        Nilai lebih negatif = lebih anomali.
        Kita map: score 0 → 0.0 (normal), makin negatif → mendekati 1.0.
        """
        if not self._is_fitted or self._model is None:
            return 0.0

        features = np.array([[point.suhuAmmo, point.sshAuthRate, point.modbusWriteCount]])
        raw = float(self._model.score_samples(features)[0])
        # raw ∈ roughly [-0.8, 0.0]; clamp & normalize
        normalized = min(1.0, max(0.0, -raw / 0.8))
        return normalized

    @staticmethod
    def _rule_check(point: TelemetryPoint) -> bool:
        """PRD Rule-Based Triage — deteksi instan tanpa ML."""
        if point.sshAuthRate > THRESHOLDS["ssh_brute_force"]:
            return True
        if point.suhuAmmo > THRESHOLDS["suhu_ammo_max"]:
            return True
        if point.modbusWriteCount > THRESHOLDS["modbus_write_high"]:
            return True
        return False

    @staticmethod
    def _classify_severity(
        point: TelemetryPoint,
        iso_score: float,
        rule_hit: bool,
    ) -> SeverityLevel:
        """
        Skor Risiko → SeverityLevel sesuai PRD:
          RENDAH  0–40
          SEDANG  41–70
          TINGGI  71–85
          KRITIS  86–100
        """
        # Hitung skor komposit sederhana
        score = 0

        # Komponen suhu
        if point.suhuAmmo > 60:
            score += 40
        elif point.suhuAmmo > 30:
            score += 25
        elif point.suhuAmmo > THRESHOLDS["suhu_ammo_max"]:
            score += 15

        # Komponen SSH
        if point.sshAuthRate > 200:
            score += 35
        elif point.sshAuthRate > 50:
            score += 20
        elif point.sshAuthRate > THRESHOLDS["ssh_brute_force"]:
            score += 10

        # Komponen Modbus writes
        if point.modbusWriteCount > 30:
            score += 20
        elif point.modbusWriteCount > THRESHOLDS["modbus_write_high"]:
            score += 10

        # Isolation Forest boost
        score += int(iso_score * 10)

        # Clamp
        score = min(100, max(0, score))

        if score >= 86:
            return "KRITIS"
        if score >= 71:
            return "TINGGI"
        if score >= 41:
            return "SEDANG"
        if score >= 1 and rule_hit:
            return "RENDAH"
        return "AMAN"


# Singleton instance — import dan gunakan langsung
detector = AnomalyDetector()
