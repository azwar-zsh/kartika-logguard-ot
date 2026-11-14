# Product Requirements Document (PRD) 
**KARTIKA LogGuard-OT**

* **Nama Produk:** KARTIKA LogGuard-OT
* **Kategori:** Sistem Deteksi Anomali dan Mitigasi Aktif IT/OT Militer Berbasis Machine Learning & Explainable AI
* **Arsitektur:** 100% On-Premise / Air-Gapped

---

## A. Ringkasan Eksekutif & Tujuan
KARTIKA LogGuard-OT adalah sistem pertahanan siber terpadu yang memantau dan melindungi *Information Technology* (IT) dan *Operational Technology* (OT) militer secara real-time. 

Tujuan utama sistem ini adalah mendeteksi anomali, mengklasifikasikan tingkat risiko, dan memblokir ancaman siber secara otonom dalam waktu kurang dari 50 milidetik—tepat sebelum infrastruktur keras maupun data TNI AD berhasil dieksploitasi. Sistem ini dilengkapi dengan *Explainable AI* (LLM Lokal) untuk menerjemahkan log teknis rumit menjadi laporan ancaman taktis berbahasa Indonesia yang mudah dipahami oleh operator di lapangan.

## B. Target Pengguna
1. **Operator Siber Tingkat Satuan dan Perwira Jaga:** Membutuhkan visibilitas instan terhadap anomali di jaringan IT dan sensor fisik OT tanpa perlu menerjemahkan log heksadesimal secara manual.
2. **Komandan Satuan:** Membutuhkan laporan taktis dan rekomendasi SOP instan untuk pengambilan keputusan saat terjadi insiden.

## C. Fitur Utama (Fungsionalitas 4 Lapis)

### Lapis 1: Data Ingestion & Log Collector
*   Agen sensor taktis membaca log aktivitas server IT (Syslog/Auth Log) dan telemetri perangkat OT/SCADA (Modbus TCP / MQTT dalam format JSON) secara *real-time*.
*   **Mode Demo:** Dilengkapi Generator Log Sintetis untuk menyimulasikan trafik normal dan skenario serangan siber tanpa menyentuh jaringan asli.

### Lapis 2: Mesin Deteksi Anomali & Risk Scoring (ML)
*   **Rule-Based & Heuristic Triage:** Mendeteksi pola serangan pasti secara instan (misal: >10 gagal login dalam <5 detik ditandai sebagai *Brute-Force*).
*   **Unsupervised Machine Learning (Isolation Forest):** Mendeteksi *outlier* atau anomali dari *baseline* normal sensor fisik OT (misal: perubahan suhu gudang amunisi yang tidak wajar).
*   **Risk Scoring (0-100):** Mengklasifikasikan insiden ke dalam 4 level: RENDAH (0-40), SEDANG (41-70), TINGGI (71-85), dan KRITIS (86-100).

### Lapis 3: Autonomous Active Mitigation Engine
*   Khusus untuk insiden berstatus TINGGI dan KRITIS, sistem mengeksekusi respons otonom dalam **< 50 milidetik** tanpa intervensi manual.
*   **Mitigasi IT:** Menembakkan API ke Agen Satuan untuk memblokir IP penyerang di firewall (iptables DROP) dan mengunci akun.
*   **Mitigasi OT:** Memutus sesi komunikasi protokol SCADA, membuang paket manipulasi, dan melakukan *fail-safe state rollback* nilai register PLC ke kondisi aman.

### Lapis 4: Explainable AI (XAI) Dashboard
*   Menggunakan Local LLM untuk menganalisis bukti log mentah dan skor anomali.
*   Menyajikan laporan bahasa Indonesia yang memuat:
    1. Ringkasan Insiden
    2. Alasan Deteksi & Bukti Log
    3. Status Tindakan Otonom (Mitigasi)
    4. Rekomendasi Taktis sesuai SOP untuk panduan prajurit.

## D. Spesifikasi Teknologi (Tech Stack)
Sistem dibangun murni dengan ekosistem *Open-Source* yang berlisensi legal dan berjalan *offline* untuk menjaga kedaulatan data militer.

*   **Bahasa Pemrograman:** Python 3.11+
*   **Mesin Deteksi Anomali (ML):** Scikit-Learn (IsolationForest & RandomForest)
*   **Mesin Explainable AI (LLM):** Ollama + Qwen2.5-3B / Llama-3.2-3B (Berjalan 100% lokal)
*   **Backend & API Mitigasi:** FastAPI + WebSockets (Low latency)
*   **Dashboard Komando Pusat (Frontend):** React.js + Tailwind CSS / Streamlit
*   **Simulator Serangan & Log:** Custom Python Synthetic Generator