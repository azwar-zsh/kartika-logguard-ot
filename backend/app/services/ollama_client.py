# ============================================================================
# KARTIKA LogGuard-OT — Lapis 4: Ollama Local LLM Client (XAI)
# ============================================================================
"""
Menghubungi Ollama REST API yang berjalan lokal (http://localhost:11434).
Model default: qwen2.5:3b (sesuai PRD) atau llama3.2:3b sebagai fallback.

Jika Ollama tidak tersedia (air-gapped tanpa setup), generate ringkasan
template berbahasa Indonesia dari data insiden — tanpa pemanggilan LLM.
"""

from __future__ import annotations

import asyncio
import logging
import os
from typing import AsyncGenerator

import httpx

from app.models import IncidentLog

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL    = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
OLLAMA_TIMEOUT  = float(os.getenv("OLLAMA_TIMEOUT", "60"))


# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------

def _build_prompt(incident: IncidentLog) -> str:
    reasons = "\n".join(
        f"  - [{r.bobot}%] {r.faktor}: {r.detail}"
        for r in incident.alasanDeteksi
    )
    mitigations = "\n".join(
        f"  - {m.action} → {m.target} ({m.latencyMs} ms)"
        for m in incident.mitigations
    )
    return f"""Anda adalah analis keamanan siber militer sistem KARTIKA LogGuard-OT.
Analisis insiden berikut dan buat ringkasan taktis singkat (3-4 kalimat) dalam Bahasa Indonesia
yang mudah dipahami operator lapangan. Fokus pada: apa yang terjadi, dampak potensial, dan status penanganan.

=== DATA INSIDEN ===
ID          : {incident.id}
Waktu       : {incident.timestamp}
Judul       : {incident.judulInsiden}
Aset Target : {incident.asetTarget}
IP Penyerang: {incident.ipPenyerang}
Protokol    : {incident.protokol}
Skor Risiko : {incident.skorRisiko}/100 ({incident.kategoriRisiko})
Vektor      : {incident.vektorSerangan}
Suhu Puncak : {incident.suhuPuncak}°C
SSH Spike   : {incident.sshSpike} req/detik

Alasan Deteksi:
{reasons}

Tindakan Mitigasi:
{mitigations}

Log Mentah:
{incident.rawLogSnippet or "(tidak tersedia)"}

=== RINGKASAN TAKTIS ==="""


# ---------------------------------------------------------------------------
# Ollama client
# ---------------------------------------------------------------------------

async def generate_analysis(incident: IncidentLog) -> str:
    """
    Panggil Ollama generate API (non-streaming).
    Jika gagal (Ollama tidak berjalan / timeout), kembalikan fallback template.
    """
    prompt = _build_prompt(incident)
    try:
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
            resp = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model":  OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,
                        "num_predict": 256,
                    },
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("response", "").strip()
    except Exception as exc:
        logger.warning("Ollama tidak tersedia (%s). Menggunakan fallback template.", exc)
        return _fallback_analysis(incident)


async def stream_analysis(incident: IncidentLog) -> AsyncGenerator[str, None]:
    """
    Stream token demi token dari Ollama (untuk SSE / WebSocket streaming).
    Setiap yield adalah satu token string.
    """
    prompt = _build_prompt(incident)
    try:
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
            async with client.stream(
                "POST",
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model":  OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": True,
                    "options": {"temperature": 0.3, "num_predict": 256},
                },
            ) as resp:
                resp.raise_for_status()
                import json as _json
                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    try:
                        chunk = _json.loads(line)
                        token = chunk.get("response", "")
                        if token:
                            yield token
                        if chunk.get("done", False):
                            break
                    except _json.JSONDecodeError:
                        continue
    except Exception as exc:
        logger.warning("Ollama stream gagal (%s). Streaming fallback.", exc)
        fallback = _fallback_analysis(incident)
        # Kirim per kata agar UX streaming tetap terasa
        for word in fallback.split(" "):
            yield word + " "
            await asyncio.sleep(0.04)


# ---------------------------------------------------------------------------
# Fallback — tanpa LLM
# ---------------------------------------------------------------------------

def _fallback_analysis(incident: IncidentLog) -> str:
    """Template otomatis bila Ollama tidak tersedia."""
    severity_map = {
        "KRITIS": "sangat kritis dan membutuhkan respons segera",
        "TINGGI": "tinggi dan memerlukan penanganan prioritas",
        "SEDANG": "sedang dan perlu pemantauan ketat",
        "RENDAH": "rendah, cukup dicatat untuk audit",
        "AMAN":   "dalam batas normal operasional",
    }
    level_desc = severity_map.get(incident.kategoriRisiko, "tidak diketahui")
    top_reason = incident.alasanDeteksi[0] if incident.alasanDeteksi else None
    reason_text = (
        f"Indikator utama: {top_reason.faktor} (bobot {top_reason.bobot}%)."
        if top_reason else ""
    )
    mitigated = all(m.success for m in incident.mitigations)
    status_text = (
        "Semua tindakan mitigasi berhasil dieksekusi secara otonom."
        if mitigated
        else "Sebagian tindakan mitigasi memerlukan konfirmasi manual operator."
    )
    return (
        f"Insiden {incident.id} terdeteksi pada {incident.timestamp} dengan tingkat risiko {level_desc}. "
        f"Penyerang dari IP {incident.ipPenyerang} menargetkan {incident.asetTarget} "
        f"menggunakan vektor {incident.vektorSerangan}. "
        f"{reason_text} "
        f"{status_text}"
    ).strip()
