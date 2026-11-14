// ============================================================================
// KARTIKA LogGuard-OT — Mock Data & Synthetic Log Generator
// Lapis 1: Data Ingestion — Mode Demo dengan Generator Log Sintetis
// ============================================================================

import type { TelemetryPoint, IncidentLog, SeverityLevel, DomainSource } from '../types';

// --- INITIAL TELEMETRY (Baseline + Attack Spike) ---

export const INITIAL_TELEMETRY: TelemetryPoint[] = [
  { time: '14:20:05', suhuAmmo: 19.4, batasAman: 24.0, sshAuthRate: 6,   modbusWriteCount: 1,  isolationScore: 0.05 },
  { time: '14:20:10', suhuAmmo: 20.1, batasAman: 24.0, sshAuthRate: 8,   modbusWriteCount: 1,  isolationScore: 0.07 },
  { time: '14:20:15', suhuAmmo: 21.2, batasAman: 24.0, sshAuthRate: 5,   modbusWriteCount: 0,  isolationScore: 0.04 },
  { time: '14:20:20', suhuAmmo: 19.8, batasAman: 24.0, sshAuthRate: 9,   modbusWriteCount: 1,  isolationScore: 0.06 },
  { time: '14:20:25', suhuAmmo: 22.0, batasAman: 24.0, sshAuthRate: 11,  modbusWriteCount: 1,  isolationScore: 0.08 },
  { time: '14:20:30', suhuAmmo: 20.6, batasAman: 24.0, sshAuthRate: 7,   modbusWriteCount: 0,  isolationScore: 0.05 },
  { time: '14:20:35', suhuAmmo: 23.1, batasAman: 24.0, sshAuthRate: 14,  modbusWriteCount: 2,  isolationScore: 0.11 },
  { time: '14:20:40', suhuAmmo: 21.5, batasAman: 24.0, sshAuthRate: 185, modbusWriteCount: 4,  isolationScore: 0.58 },
  { time: '14:20:45', suhuAmmo: 22.8, batasAman: 24.0, sshAuthRate: 462, modbusWriteCount: 19, isolationScore: 0.87, isAnomaly: true },
  { time: '14:20:50', suhuAmmo: 54.0, batasAman: 24.0, sshAuthRate: 488, modbusWriteCount: 47, isolationScore: 0.97, isAnomaly: true },
  { time: '14:20:55', suhuAmmo: 85.0, batasAman: 24.0, sshAuthRate: 412, modbusWriteCount: 64, isolationScore: 0.99, isAnomaly: true },
  { time: '14:21:00', suhuAmmo: 85.0, batasAman: 24.0, sshAuthRate: 18,  modbusWriteCount: 0,  isolationScore: 0.96, isAnomaly: true },
];

// --- INITIAL INCIDENT LOGS ---

export const INITIAL_INCIDENTS: IncidentLog[] = [
  {
    id: 'INC-2026-0891',
    timestamp: '14:20:55.104',
    sumber: 'IT/OT',
    asetTarget: 'OT-PLC-AMMO-04 / admin_logistik',
    ipPenyerang: '10.24.88.105',
    protokol: 'Modbus TCP / SSHv2',
    skorRisiko: 96,
    kategoriRisiko: 'KRITIS',
    statusBlokir: 'IP Diblokir + Akun Dikunci (38 ms)',
    waktuMitigasiMs: 38,
    judulInsiden: "Serangan Brute-Force 'admin_logistik' & Manipulasi Setpoint Suhu Gudang Amunisi (85.0°C)",
    vektorSerangan: 'Lateral Movement IT → OT (SSH Brute-Force → Modbus FC-06 Write Single Register)',
    ringkasanAi:
      "Serangan Brute-Force terdeteksi pada akun 'admin_logistik' dari IP 10.24.88.105 (488 percobaan/detik via SSH), dilanjutkan pergerakan lateral lintas-segmen dan manipulasi paket Modbus TCP (Function Code 06: Write Single Holding Register #40012) ke OT-PLC-AMMO-04 di Gudang Amunisi Sektor-B. Nilai setpoint suhu diubah secara paksa dari 21.0°C menjadi 85.0°C untuk memicu kondisi ketidakstabilan termal propelan.",
    alasanDeteksi: [
      {
        faktor: 'Anomali Fisik Setpoint Termal (ΔT +63.5°C)',
        bobot: 42,
        detail: 'Perintah penulisan register #40012 melompat ke 85.0°C, melampaui ambang batas aman gudang amunisi (18–24°C) sebesar +254%.',
      },
      {
        faktor: 'Korelasi Lintas-Domain IT SSH → OT Modbus (1.8 dtk)',
        bobot: 31,
        detail: 'IP 10.24.88.105 melakukan eskalasi setelah 488 percobaan SSH brute-force pada akun admin_logistik sebelum mengirim payload Modbus TCP.',
      },
      {
        faktor: 'Otorisasi Perintah PLC Tanpa Tanda Tangan HMI',
        bobot: 23,
        detail: 'Paket Modbus TCP FC-06 berasal dari subnet logistik IT (10.24.88.0/24), bukan dari konsol Engineering Workstation resmi (10.10.1.5).',
      },
    ],
    rekomendasiSop: [
      { id: 'sop-1',  kode: 'SOP-OT-01',  tindakan: 'Aktifkan Hardware Override pada OT-PLC-AMMO-04 dan paksa katup pendingin darurat ke setpoint 20.0°C.',                         target: 'OT-PLC-AMMO-04',       selesai: false },
      { id: 'sop-2',  kode: 'SOP-IT-04',  tindakan: "Cabut seluruh token sesi aktif, kunci akun 'admin_logistik', dan wajibkan rotasi kunci SSH Ed25519.",                           target: 'IAM / Active Directory', selesai: false },
      { id: 'sop-3',  kode: 'SOP-NET-09', tindakan: 'Isolasi fisik port switch distribusi VLAN-24 (10.24.88.105) dan perketat aturan Unidirectional Gateway IT/OT.',               target: 'Core Switch Sektor-B',  selesai: true  },
      { id: 'sop-4',  kode: 'SOP-FOR-02', tindakan: 'Amankan rekaman paket PCAP 60 detik terakhir dan kirim laporan insiden ke Satuan Siber Komando.',                             target: 'Unit Forensik Siber',   selesai: false },
    ],
    mitigations: [
      { action: 'BLOKIR_IP',    target: '10.24.88.105',    detail: 'iptables -I INPUT -s 10.24.88.105 -j DROP',                    executedAt: '14:20:55.142', latencyMs: 38, success: true },
      { action: 'KUNCI_AKUN',   target: 'admin_logistik',  detail: 'passwd -l admin_logistik && pkill -u admin_logistik',           executedAt: '14:20:55.151', latencyMs: 47, success: true },
      { action: 'ROLLBACK_PLC', target: 'OT-PLC-AMMO-04', detail: 'Modbus FC-06 Write #40012 → 0x00D0 (20.8°C) fail-safe rollback', executedAt: '14:20:55.168', latencyMs: 64, success: true },
    ],
    suhuPuncak: 85.0,
    sshSpike: 488,
    rawLogSnippet: `2026-10-31 14:20:42 sshd[2847]: Failed password for admin_logistik from 10.24.88.105 port 51234 ssh2
2026-10-31 14:20:42 sshd[2847]: Failed password for admin_logistik from 10.24.88.105 port 51235 ssh2
[...1460 baris identik dalam 3 detik...]
2026-10-31 14:20:45 modbus_monitor: FC-06 WRITE reg=40012 val=0x0352 src=10.24.88.105 dst=OT-PLC-AMMO-04:502
2026-10-31 14:20:45 logguard[1]: ANOMALI KRITIS - Setpoint suhu melonjak 85.0°C. Mitigasi dieksekusi.`,
  },
  {
    id: 'INC-2026-0890',
    timestamp: '14:20:42.819',
    sumber: 'IT',
    asetTarget: 'SRV-LOGISTIK-AUTH (admin_logistik)',
    ipPenyerang: '10.24.88.105',
    protokol: 'SSHv2 (Port 22)',
    skorRisiko: 88,
    kategoriRisiko: 'KRITIS',
    statusBlokir: 'IP Diblokir (29 ms)',
    waktuMitigasiMs: 29,
    judulInsiden: "Eksploitasi Kredensial Brute-Force Kecepatan Tinggi pada Akun 'admin_logistik'",
    vektorSerangan: 'Automated Dictionary & Credential Stuffing via SSHv2',
    ringkasanAi:
      "Terdeteksi gelombang autentikasi gagal berkecepatan tinggi (462 permintaan/detik) terhadap akun hak istimewa 'admin_logistik' dari host internal yang terkompromi 10.24.88.105. Pola waktu antar-paket (inter-arrival time 2.1 ms) mengindikasikan skrip otomatis sebelum satu sesi berhasil menembus autentikasi.",
    alasanDeteksi: [
      { faktor: 'Lonjakan Frekuensi SSH Auth (+3.750% di atas Baseline)', bobot: 48, detail: 'Kecepatan permintaan mencapai 462 req/detik dibandingkan rata-rata historis 8 req/detik.' },
      { faktor: 'Anomali Fingerprint Klien SSH', bobot: 25, detail: 'Header klien menggunakan pustaka non-standar libssh-custom yang tidak terdaftar pada inventaris perangkat militer.' },
      { faktor: 'Penargetan Akun Istimewa Logistik Amunisi', bobot: 15, detail: 'Akun admin_logistik memiliki tabel routing langsung menuju gateway pemantauan gudang OT.' },
    ],
    rekomendasiSop: [
      { id: 'sop-201', kode: 'SOP-IT-02', tindakan: 'Terapkan pembatasan laju (rate-limiting) keras dan penolakan paket di level eBPF/XDP.',   target: 'Gateway SSH Sektor-B',    selesai: true  },
      { id: 'sop-202', kode: 'SOP-IT-05', tindakan: 'Lakukan pemindaian memori endpoint pada workstation dengan IP 10.24.88.105.',                target: 'Workstation 10.24.88.105', selesai: false },
    ],
    mitigations: [
      { action: 'BLOKIR_IP',  target: '10.24.88.105', detail: 'iptables -I INPUT -s 10.24.88.105 -j DROP (Rule #1)',        executedAt: '14:20:42.848', latencyMs: 29, success: true },
      { action: 'KUNCI_AKUN', target: 'admin_logistik', detail: 'Account locked via PAM fail2ban + sshd MaxAuthTries=0',   executedAt: '14:20:42.861', latencyMs: 42, success: true },
    ],
    suhuPuncak: 22.8,
    sshSpike: 462,
    rawLogSnippet: `2026-10-31 14:20:42 sshd[2847]: Failed password for admin_logistik from 10.24.88.105 port 49812 ssh2
2026-10-31 14:20:42 sshd[2848]: Failed password for admin_logistik from 10.24.88.105 port 49813 ssh2
2026-10-31 14:20:42 fail2ban[1234]: Ban 10.24.88.105 (ssh brute-force threshold exceeded: 462/s)
2026-10-31 14:20:42 logguard[1]: RULE-HIT SSH_BRUTEFORCE src=10.24.88.105 rate=462/s threshold=10/5s`,
  },
  {
    id: 'INC-2026-0889',
    timestamp: '14:18:19.402',
    sumber: 'OT',
    asetTarget: 'OT-RTU-POWER-02',
    ipPenyerang: '10.24.91.44',
    protokol: 'DNP3 (Port 20000)',
    skorRisiko: 64,
    kategoriRisiko: 'SEDANG',
    statusBlokir: 'Paket Ditolak (41 ms)',
    waktuMitigasiMs: 41,
    judulInsiden: 'Pemindaian Fungsi Read/Write Register DNP3 di Luar Jadwal Pemeliharaan',
    vektorSerangan: 'OT Reconnaissance / Unauthorized Class-0 Poll',
    ringkasanAi:
      'Node 10.24.91.44 mengirimkan urutan polling DNP3 Class-0 dan upaya Direct Operate ke gardu catu daya cadangan OT-RTU-POWER-02 di luar jendela pemeliharaan terjadwal. Paket dihentikan oleh filter DPI (Deep Packet Inspection) sebelum mencapai relay fisik.',
    alasanDeteksi: [
      { faktor: 'Perintah DNP3 di Luar Jendela Operasi', bobot: 36, detail: 'Perintah dikirim pada jam siaga tanpa tiket perubahan terenkripsi.' },
      { faktor: 'Urutan Sequence Number Tidak Valid',     bobot: 28, detail: 'Paket aplikasi DNP3 memiliki offset sequence yang tidak sinkron dengan Master Station.' },
    ],
    rekomendasiSop: [
      { id: 'sop-301', kode: 'SOP-OT-07', tindakan: 'Verifikasi status fisik relay catu daya cadangan pada RTU-POWER-02.', target: 'OT-RTU-POWER-02', selesai: true },
    ],
    mitigations: [
      { action: 'TOLAK_PAKET', target: 'OT-RTU-POWER-02:20000', detail: 'DPI filter drop DNP3 Class-0 Poll from 10.24.91.44 (seq mismatch)', executedAt: '14:18:19.443', latencyMs: 41, success: true },
    ],
    suhuPuncak: 21.4,
    sshSpike: 14,
    rawLogSnippet: `2026-10-31 14:18:19 dnp3_monitor: UNAUTHORIZED Class-0 Poll src=10.24.91.44 dst=OT-RTU-POWER-02:20000
2026-10-31 14:18:19 dnp3_monitor: Sequence mismatch - expected=0x1F received=0x00
2026-10-31 14:18:19 logguard[1]: DPI_DROP DNP3 src=10.24.91.44 reason=seq_invalid,schedule_violation`,
  },
  {
    id: 'INC-2026-0888',
    timestamp: '14:15:04.012',
    sumber: 'IT',
    asetTarget: 'FW-PERIMETER-01',
    ipPenyerang: '172.16.40.219',
    protokol: 'ICMP / TCP SYN',
    skorRisiko: 52,
    kategoriRisiko: 'SEDANG',
    statusBlokir: 'IP Diblokir (22 ms)',
    waktuMitigasiMs: 22,
    judulInsiden: 'Port Scanning Horizontal pada Subnet Jaringan Komando Taktis',
    vektorSerangan: 'Stealth SYN Scan (Ports 22, 102, 502, 20000)',
    ringkasanAi:
      'Host 172.16.40.219 melakukan pemindaian port terarah yang secara spesifik menargetkan port manajemen IT (22) dan port protokol industri OT (102 S7comm, 502 Modbus, 20000 DNP3). Seluruh koneksi diputus otomatis dalam 22 ms.',
    alasanDeteksi: [
      { faktor: 'Enumerasi Port Spesifik ICS/SCADA', bobot: 52, detail: 'Kombinasi port 102, 502, dan 20000 mengindikasikan pemetaan aset OT militer.' },
    ],
    rekomendasiSop: [
      { id: 'sop-401', kode: 'SOP-NET-03', tindakan: 'Perbarui daftar hitam dinamis pada firewall perimeter antar-zona.', target: 'FW-PERIMETER-01', selesai: true },
    ],
    mitigations: [
      { action: 'BLOKIR_IP', target: '172.16.40.219', detail: 'iptables -I INPUT -s 172.16.40.219 -j DROP (SYN scan detected)', executedAt: '14:15:04.034', latencyMs: 22, success: true },
    ],
    suhuPuncak: 20.5,
    sshSpike: 11,
    rawLogSnippet: `2026-10-31 14:15:04 nmap_detect: SYN scan from 172.16.40.219 targets=[22,102,502,20000]
2026-10-31 14:15:04 logguard[1]: RULE-HIT ICS_PORT_SCAN src=172.16.40.219 ports=[102,502,20000]`,
  },
  {
    id: 'INC-2026-0887',
    timestamp: '14:11:30.650',
    sumber: 'OT',
    asetTarget: 'OT-PLC-HVAC-01',
    ipPenyerang: '10.10.1.5',
    protokol: 'Modbus TCP',
    skorRisiko: 12,
    kategoriRisiko: 'AMAN',
    statusBlokir: 'Diizinkan (9 ms)',
    waktuMitigasiMs: 9,
    judulInsiden: 'Pembacaan Telemetri Berkala Rutin oleh Engineering Workstation Resmi',
    vektorSerangan: 'Trafik Operasional Normal (Read Holding Registers FC-03)',
    ringkasanAi:
      'Polling telemetri rutin dari konsol resmi 10.10.1.5 menuju OT-PLC-HVAC-01. Tanda tangan kriptografi paket, interval waktu 5000 ms, dan rentang nilai sensor berada dalam batas normatif.',
    alasanDeteksi: [
      { faktor: 'Tanda Tangan HMI Terverifikasi', bobot: 12, detail: 'Sesuai dengan profil perilaku normal baseline 30 hari terakhir.' },
    ],
    rekomendasiSop: [
      { id: 'sop-501', kode: 'SOP-MON-01', tindakan: 'Tidak diperlukan tindakan intervensi; lanjutkan pemantauan pasif.', target: 'OT-PLC-HVAC-01', selesai: true },
    ],
    mitigations: [
      { action: 'DIIZINKAN', target: 'OT-PLC-HVAC-01', detail: 'Modbus FC-03 Read from 10.10.1.5 — verified HMI signature, normal baseline', executedAt: '14:11:30.659', latencyMs: 9, success: true },
    ],
    suhuPuncak: 19.9,
    sshSpike: 6,
    rawLogSnippet: `2026-10-31 14:11:30 modbus_monitor: FC-03 READ reg=40001-40010 src=10.10.1.5 dst=OT-PLC-HVAC-01:502
2026-10-31 14:11:30 logguard[1]: ALLOW — HMI signature verified, traffic within baseline`,
  },
];

// --- SIMULATED ATTACK TEMPLATES ---

export const SIMULATED_ATTACK_TEMPLATES: Partial<IncidentLog>[] = [
  {
    sumber: 'IT/OT' as DomainSource,
    asetTarget: 'OT-PLC-AMMO-04 / admin_logistik',
    ipPenyerang: '10.24.88.105',
    protokol: 'Modbus TCP / SSHv2',
    skorRisiko: 96,
    kategoriRisiko: 'KRITIS' as SeverityLevel,
    waktuMitigasiMs: 38,
    suhuPuncak: 85.0,
    sshSpike: 495,
    judulInsiden: "Serangan Ulang Brute-Force 'admin_logistik' & Injeksi Modbus TCP (Suhu Di-set ke 85.0°C)",
    vektorSerangan: 'Replay Lateral Movement IT → OT (Modbus FC-06 Register #40012 = 85.0)',
    ringkasanAi: "Gelombang serangan kedua! Host 10.24.88.105 kembali mencoba memintas isolasi menggunakan MAC spoofing untuk menyerang akun 'admin_logistik', diikuti injeksi paket Modbus TCP ke OT-PLC-AMMO-04 yang memaksa setpoint suhu kembali ke 85.0°C. eBPF/XDP LogGuard-OT berhasil memutus sesi dalam 38 ms.",
    alasanDeteksi: [
      { faktor: 'Manipulasi Ekstrem Setpoint Suhu (85.0°C)', bobot: 44, detail: 'Upaya penulisan langsung ke register kontrol termal gudang amunisi melebihi ambang 24.0°C.' },
      { faktor: 'Korelasi Serangan Beruntun SSH + Modbus TCP', bobot: 32, detail: 'Pola identik dengan insiden INC-2026-0891 dari subnet 10.24.88.0/24.' },
      { faktor: 'Deteksi MAC Spoofing pada Segmen Logistik', bobot: 20, detail: 'Perubahan alamat fisik antarmuka terdeteksi dalam 120 ms sebelum pengiriman payload.' },
    ],
    mitigations: [
      { action: 'BLOKIR_IP',    target: '10.24.88.105',    detail: 'iptables -I INPUT -s 10.24.88.105 -j DROP (MAC spoof replay)',   executedAt: '', latencyMs: 38, success: true },
      { action: 'ROLLBACK_PLC', target: 'OT-PLC-AMMO-04', detail: 'Fail-safe rollback reg #40012 → 20.8°C (hardware interlock)',     executedAt: '', latencyMs: 62, success: true },
    ],
    rawLogSnippet: `2026-10-31 MAC_SPOOF detected: 10.24.88.105 using new MAC 00:1A:2B:3C:4D:5F (prev: 00:1A:2B:3C:4D:5E)
2026-10-31 sshd[3901]: Failed password for admin_logistik from 10.24.88.105 (495 attempts/sec)
2026-10-31 modbus_monitor: FC-06 WRITE reg=40012 val=0x0352 (85.0°C) BLOCKED by logguard`,
    rekomendasiSop: [
      { id: '', kode: 'SOP-OT-01', tindakan: 'Pertahankan interlok perangkat keras pada OT-PLC-AMMO-04 dan kunci setpoint suhu 20.0°C.', target: 'OT-PLC-AMMO-04', selesai: false },
      { id: '', kode: 'SOP-NET-08', tindakan: 'Isolasi permanen alamat IP 10.24.88.105 pada tabel eBPF XDP semua router komando.',         target: 'Semua Router', selesai: true  },
    ],
  },
  {
    sumber: 'OT' as DomainSource,
    asetTarget: 'OT-PLC-COOLANT-02',
    ipPenyerang: '10.24.88.112',
    protokol: 'S7comm (Port 102)',
    skorRisiko: 94,
    kategoriRisiko: 'KRITIS' as SeverityLevel,
    waktuMitigasiMs: 31,
    suhuPuncak: 78.5,
    sshSpike: 310,
    judulInsiden: 'Injeksi Perintah S7comm STOP CPU pada Pompa Pendingin Primer Gudang Amunisi',
    vektorSerangan: 'Direct PLC CPU Stop Command & Valve Closure (S7comm 0x29)',
    ringkasanAi: 'Penyerang pada IP 10.24.88.112 mengirimkan instruksi S7comm fungsi 0x29 (PLC STOP) ke kontroler pompa pendingin OT-PLC-COOLANT-02 untuk mematikan sirkulasi udara dingin secara bersamaan dengan lonjakan suhu ruang simpan amunisi. Paket diblokir di tingkat kernel dalam 31 ms.',
    alasanDeteksi: [
      { faktor: 'Instruksi Kritis S7comm CPU-STOP Tanpa Otorisasi',  bobot: 46, detail: 'Perintah penghentian siklus PLC diterima saat status termal gudang berada di atas batas normal.' },
      { faktor: 'Korelasi Multi-Host pada Subnet 10.24.88.x',        bobot: 30, detail: 'Aktivitas terkoordinasi dengan penyerang utama 10.24.88.105.' },
      { faktor: 'Deviasi Tekanan Aliran Pendingin',                  bobot: 18, detail: 'Transien tekanan pipa pendingin turun 14% selama 200 ms sebelum intervensi.' },
    ],
    mitigations: [
      { action: 'PUTUS_SCADA', target: 'OT-PLC-COOLANT-02:102', detail: 'S7comm session terminated, CPU-STOP command blocked at DPI layer', executedAt: '', latencyMs: 31, success: true },
      { action: 'BLOKIR_IP',   target: '10.24.88.112',           detail: 'iptables -I INPUT -s 10.24.88.112 -j DROP',                       executedAt: '', latencyMs: 38, success: true },
    ],
    rawLogSnippet: `2026-10-31 s7comm_monitor: FC=0x29 (CPU-STOP) src=10.24.88.112 dst=OT-PLC-COOLANT-02:102
2026-10-31 sensor: Coolant pressure drop 14% at 14:xx:xx.xxx
2026-10-31 logguard[1]: KRITIS S7COMM_CPU_STOP blocked in 31ms`,
    rekomendasiSop: [
      { id: '', kode: 'SOP-OT-03', tindakan: 'Verifikasi status fisik pompa pendingin primer dan aktifkan pompa cadangan darurat.',     target: 'OT-PLC-COOLANT-02', selesai: false },
      { id: '', kode: 'SOP-NET-08', tindakan: 'Blokir subnet 10.24.88.x dari akses segmen OT melalui VLAN ACL pada core switch.', target: 'Core Switch',          selesai: true  },
    ],
  },
  {
    sumber: 'IT' as DomainSource,
    asetTarget: 'SRV-KOMANDO-KunciKripto',
    ipPenyerang: '10.24.76.19',
    protokol: 'SSHv2 / SMBv3',
    skorRisiko: 74,
    kategoriRisiko: 'TINGGI' as SeverityLevel,
    waktuMitigasiMs: 44,
    suhuPuncak: 23.4,
    sshSpike: 275,
    judulInsiden: 'Upaya Eskalasi Hak Akses Lateral & Enumerasi Direktori Konfigurasi PLC',
    vektorSerangan: 'Credential Harvesting & PLC Ladder Logic File Access (SMBv3)',
    ringkasanAi: 'Terdeteksi percobaan akses tidak sah menuju repositori cadangan file Ladder Logic (.L5X) milik sistem OT melalui protokol SMBv3 setelah 275 percobaan login SSH. Koneksi dihentikan otomatis dalam 44 ms.',
    alasanDeteksi: [
      { faktor: 'Akses Berkas Konfigurasi Industri (.L5X / .S7P)', bobot: 45, detail: 'Akun non-engineering mencoba mengunduh skema logika kontrol gudang senjata.' },
      { faktor: 'Lonjakan Autentikasi Silang SSH ke SMB',          bobot: 29, detail: 'Perpindahan protokol secara cepat dalam waktu kurang dari 800 ms.' },
    ],
    mitigations: [
      { action: 'BLOKIR_IP',  target: '10.24.76.19',             detail: 'iptables -I INPUT -s 10.24.76.19 -j DROP',               executedAt: '', latencyMs: 44, success: true },
      { action: 'KUNCI_AKUN', target: 'SRV-KOMANDO-KunciKripto', detail: 'SMB share access revoked for non-engineering accounts',   executedAt: '', latencyMs: 51, success: true },
    ],
    rawLogSnippet: `2026-10-31 sshd: 275 failed logins from 10.24.76.19 in 3 seconds
2026-10-31 smb: OPEN \\SRV-KOMANDO\OT-Backups\ladder_logic.L5X from 10.24.76.19 (ACCESS DENIED)
2026-10-31 logguard[1]: TINGGI CREDENTIAL_HARVEST + SMB_RECON src=10.24.76.19`,
    rekomendasiSop: [
      { id: '', kode: 'SOP-IT-07', tindakan: 'Audit semua akses SMB ke direktori OT-Backups dalam 24 jam terakhir dan cabut izin non-engineering.', target: 'SRV-KOMANDO', selesai: false },
      { id: '', kode: 'SOP-FOR-04', tindakan: 'Kirim hash payload serangan ke pusat intelijen siber pertahanan.', target: 'SOC Komando Pusat', selesai: false },
    ],
  },
];
