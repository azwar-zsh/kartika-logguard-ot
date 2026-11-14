# KARTIKA LogGuard-OT

Dashboard demo deteksi anomali & mitigasi aktif IT/OT militer. Semua data sintetis — **mode demo, tanpa backend**, tidak menyentuh jaringan asli.

## Fitur

- Telemetri real-time (suhu gudang amunisi, SSH auth rate, Modbus write, isolation score)
- Klasifikasi risiko: RENDAH / SEDANG / TINGGI / KRITIS
- Tabel insiden + detail mitigasi IT (`iptables DROP`, kunci akun) & OT (putus SCADA, rollback PLC)
- XAI: bobot kontribusi deteksi, SOP checklist, log mentah
- Simulasi serangan & normalisasi sistem
- "Local LLM" bersifat simulasi (typewriter), belum memanggil Ollama

## Stack

React 18 · TypeScript · Vite 5 · Tailwind CSS 4 · Recharts · Lucide

## Jalankan

```bash
npm install
npm run dev      # port 3000
```

Build & cek tipe:

```bash
npm run build
npm run lint
```

## Struktur

```
src/
  App.tsx                 # state utama, stream telemetri, handler simulasi
  components/             # Header, ControlStrip, MetricCards, Telemetri, Mitigasi, XAI
  data/mockData.ts        # data & template serangan
  types.ts                # tipe domain
prd_kartika_logguard_ot.md # spesifikasi produk
```

Data masih mock di `src/data/mockData.ts` dan simulasi di `src/App.tsx`. Integrasi nyata (collector, Isolation Forest, Ollama, agen mitigasi) belum ada.
