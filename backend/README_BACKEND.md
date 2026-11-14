# KARTIKA LogGuard-OT — Backend

**FastAPI + WebSockets · Python 3.11+ · Scikit-Learn IsolationForest · Ollama Local LLM**

Arsitektur 100% On-Premise / Air-Gapped sesuai PRD.

---

## Struktur

```
backend/
├── run.py                         # Entry point dev server
├── requirements.txt               # Dependencies Python
├── .env.example                   # Template environment variables
├── .env                           # Konfigurasi lokal (buat dari .env.example)
└── app/
    ├── main.py                    # FastAPI app, CORS, router registration
    ├── models.py                  # Pydantic models (mirror src/types.ts)
    ├── data/
    │   └── mock_data.py           # Data awal & template serangan
    ├── services/
    │   ├── anomaly_detector.py    # Lapis 2: IsolationForest + Rule-based
    │   ├── ollama_client.py       # Lapis 4: Ollama LLM client + fallback
    │   ├── state_manager.py       # In-memory state (thread-safe)
    │   └── telemetry_generator.py # Synthetic log generator (Lapis 1)
    └── routers/
        ├── incidents.py           # REST: GET/POST/PATCH incidents
        ├── telemetry.py           # REST: telemetri + system control
        ├── xai.py                 # REST + SSE: analisis Ollama LLM
        └── websocket.py           # WS: /ws/telemetry + /ws/incidents
```

---

## Setup & Menjalankan

### 1. Buat Virtual Environment

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
```

### 2. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 3. Konfigurasi Environment

```powershell
copy .env.example .env
# Edit .env jika perlu (default sudah siap untuk dev lokal)
```

### 4. Jalankan Backend

```powershell
python run.py
```

Backend berjalan di: **http://localhost:8000**

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health: http://localhost:8000/health

---

## API Endpoints

### REST

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/api/telemetry` | Window 12 titik telemetri terbaru |
| `GET` | `/api/metrics` | Ringkasan metrik sistem |
| `GET` | `/api/incidents` | Daftar insiden (filter: kategori, sumber, limit) |
| `GET` | `/api/incidents/{id}` | Detail satu insiden |
| `POST` | `/api/incidents/simulate` | Simulasi serangan baru |
| `PATCH` | `/api/incidents/{id}/sop/{sop_id}` | Toggle SOP selesai/belum |
| `POST` | `/api/system/normalize` | Override pendingin — kembali ke normal |
| `POST` | `/api/system/reset` | Reset skenario ke data awal |
| `POST` | `/api/xai/{id}/analyze` | Analisis insiden dengan Ollama LLM |
| `GET` | `/api/xai/{id}/stream` | Streaming SSE analisis Ollama |

### WebSocket

| Path | Deskripsi |
|------|-----------|
| `ws://localhost:8000/ws/telemetry` | Push titik telemetri tiap 3 detik |
| `ws://localhost:8000/ws/incidents` | Push notifikasi insiden baru |

**Perintah klien WebSocket:**
```json
{ "command": "pause" }   // Hentikan stream sementara
{ "command": "resume" }  // Lanjutkan stream
{ "command": "ping" }    // Heartbeat check
```

---

## Lapis 2 — Deteksi Anomali

Dua strategi paralel:

1. **Rule-Based Heuristic** (instan, tanpa ML):
   - SSH auth rate > 10 req/5s → **Brute-Force**
   - Suhu OT > 24°C → **Thermal Anomaly**
   - Modbus write count > 5 → **Unauthorized Write**

2. **Isolation Forest** (Scikit-Learn, unsupervised):
   - Di-fit saat startup dengan 300 titik data normal sintetis
   - Fitur: `[suhuAmmo, sshAuthRate, modbusWriteCount]`
   - Output: anomaly score 0–1 (>0.70 = outlier)

Risk Score 0–100 → Klasifikasi: `RENDAH(0-40) | SEDANG(41-70) | TINGGI(71-85) | KRITIS(86-100)`

---

## Lapis 4 — XAI dengan Ollama (Local LLM)

Backend memanggil Ollama yang berjalan lokal:

```
POST http://localhost:11434/api/generate
{ "model": "qwen2.5:3b", "prompt": "...", "stream": true }
```

**Setup Ollama:**
```bash
# Install Ollama: https://ollama.com
ollama pull qwen2.5:3b
# Alternatif: ollama pull llama3.2:3b
```

Jika Ollama tidak tersedia (air-gapped tanpa setup), sistem otomatis menggunakan **fallback template** berbahasa Indonesia berdasarkan data insiden — tanpa memerlukan koneksi LLM.

---

## Menjalankan Bersamaan dengan Frontend

```powershell
# Terminal 1 — Backend
cd backend
.\venv\Scripts\activate
python run.py

# Terminal 2 — Frontend
cd ..
npm run dev
```

Frontend: http://localhost:3000  
Backend API: http://localhost:8000
