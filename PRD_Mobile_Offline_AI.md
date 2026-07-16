# Product Requirements Document (PRD)
## Platform Skrining Kesehatan & Tumbuh Kembang Anak (Mobile Version)

* **Status Dokumen**: Draf Final (Fokus MVP Hackathon)
* **Teknologi Utama**: React Native Expo (Framework Fullstack)
* **Arsitektur**: Offline-First & Local AI (Tanpa Koneksi Internet & Bebas Biaya Cloud API)

---

## 1. Pendahuluan & Ikhtisar Proyek (Project Overview)

### 1.1 Latar Belakang & Perubahan Paradigma
Dokumen ini merumuskan ulang platform skrining kesehatan anak dari yang sebelumnya berbasis web monolitik (Laravel/React/Inertia.js) menjadi aplikasi seluler native menggunakan **React Native Expo**. Perubahan ini didasari oleh realitas di lapangan (daerah terpencil/blank spot) di mana akses internet tidak stabil atau tidak ada sama sekali, padahal kebutuhan deteksi dini stunting (melalui analisis fisik gizi) dan kesehatan mental anak sangat krusial.

Aplikasi ini bertransformasi menjadi **Zero-API, Zero-Auth, dan Offline-First**. Seluruh data klinis sensitif dan proses kecerdasan buatan (Computer Vision) dieksekusi langsung di atas hardware lokal (GPU/NPU smartphone) demi privasi mutlak dan kecepatan respon instan tanpa tergantung pada jaringan luar.

### 1.2 Tujuan Utama (MVP Objectives)
* **Akurasi & Aksesibilitas**: Menyediakan alat skrining klinis berbasis AI yang bekerja 100% tanpa internet secara real-time.
* **Kelancaran Demonstrasi**: Memastikan performa aplikasi lancar saat presentasi di panggung melalui optimasi memori dan fitur bypass demonstrasi cepat.
* **Keamanan Data**: Menyimpan seluruh data eksklusif di memori lokal gawai untuk menghilangkan risiko kebocoran data medis sensitif anak.

---

## 2. Pengguna Sasaran (Target Audience)

1. **Orang Tua**: Pengguna utama yang ingin memantau indikasi fisik malnutrisi (stunting) dan kondisi psikologis anak secara berkala tanpa hambatan biaya.
2. **Kader Posyandu / Bidan Desa**: Tenaga kesehatan garis depan yang bergerak dari rumah ke rumah di daerah minim sinyal untuk mendokumentasikan tumbuh kembang anak.
3. **Anak / Remaja (Usia 5 - 18 Tahun)**: Subjek evaluasi kuesioner psikometrik mandiri dan pemindaian citra fisik.
4. **Juri Hackathon**: Pemangku kepentingan yang menilai kebaruan teknis (On-Device AI), kelancaran UX, dan kelayakan implementasi langsung di lapangan.

---

## 3. Spesifikasi Fitur Utama (Core Features)

### 3.1 Registrasi Pasien Lokal (Zero-Auth Profile)
* **Deskripsi**: Menghapus total integrasi login eksternal (Google OAuth/Laravel Auth). Saat aplikasi dibuka pertama kali, pengguna langsung dihadapkan pada halaman pembuatan profil anak di dalam local database.
* **Metrik Masukan**: Nama Lengkap, Tanggal Lahir, dan Jenis Kelamin.
* **Penanganan Umur Presisi**: Sistem menghitung umur secara real-time dalam format Tahun dan Bulan untuk menentukan jenis kuesioner yang sesuai secara otomatis.

### 3.2 Mesin Kuesioner Adaptif (Adaptive Questionnaires)
* **Deskripsi**: Formulir dinamis yang merender pertanyaan secara otomatis berdasarkan rentang usia anak hasil perhitungan profil.
* **Pembagian Kategori Usia**:
  * **0 - 2 Tahun (Balita)**: Kuesioner observasi perilaku dan pola makan oleh orang tua.
  * **3 - 5 Tahun (Prasekolah)**: Kuesioner emosi dasar dan aktivitas motorik.
  * **6 - 12 Tahun (Anak Sekolah)**: Evaluasi adaptasi lingkungan sekolah dan gejala kecemasan ringan.
  * **12 - 18 Tahun (Remaja)**: Penilaian mandiri menggunakan adaptasi digital instrumen klinis PHQ-9 dan GAD-7.
* **Kolom Catatan Tambahan**: Kolom catatan bebas di akhir kuesioner untuk masukan tambahan dari orang tua/kader.

### 3.3 Kamera Cerdas & Pengolah Gambar GPU (Native Camera with Compression)
* **Deskripsi**: Antarmuka pengambilan foto fisik (Mata untuk deteksi anemia/pucat, Kuku untuk deteksi koilonychia, dan Kulit/Muka).
* **Kompresi Latar Belakang (Mitigasi OOM)**: Menggunakan `expo-image-manipulator` untuk memotong (crop) dan meresolusi ulang gambar menjadi lebar maksimal 500px dengan kompresi kualitas 80% guna menghemat RAM.
* **Normalisasi Rotasi**: Memanfaatkan metadata EXIF gambar agar orientasi foto selalu tegak lurus sebelum diproses AI.

### 3.4 Inferensi AI On-Device (ONNX Runtime Mobile)
* **Deskripsi**: Deteksi anomali klinis fisik yang dieksekusi 100% offline di ponsel pintar menggunakan model on-device.
* **Infrastruktur Model**: Memuat model terkuantisasi **PaliGemma-3B-pt-4bit** berukuran **~1.8GB**.
* **Alur Eksekusi**:
  * Citra dikonversi menjadi Tensor Float32.
  * Dijalankan menggunakan `@onnxruntime/react-native` dengan prioritas akselerasi hardware NPU (NNAPI di Android / CoreML di iOS) dan fallback otomatis ke CPU apabila perangkat tidak mendukung NPU.
  * Menghasilkan teks deskripsi/label kondisi fisik (misal: "Kondisi Konjungtiva: Pucat (Indikasi Anemia)", "Kuku: Normal").

### 3.5 Dasbor Riwayat Kronologis & Status Dinamis (SQLite Persistence)
* **Deskripsi**: Menyimpan rekam medis pemeriksaan secara lokal di memori internal menggunakan `expo-sqlite`.
* **Spanduk Status Dinamis**: Menampilkan ringkasan status kesehatan dengan indikasi warna (Hijau: Normal, Kuning: Resiko Ringan, Merah: Resiko Tinggi/Darurat) berdasarkan akumulasi skor kuesioner dan hasil pembacaan AI.
* **Rekomendasi Nutrisi Lokal**: Algoritma lokal mencocokkan hasil deteksi dengan saran makanan padat gizi yang murah dan mudah didapat (seperti daun kelor, telur, atau ikan kembung).
* **URI Deep Linking**: Menghapus peta panas Google Maps internal. Jika anak membutuhkan rujukan darurat, aplikasi menyediakan tombol rute yang memicu URI Protokol untuk langsung membuka aplikasi peta bawaan gawai (Google Maps / Apple Maps).

### 3.6 Generator Laporan PDF Lokal & Pembagian Instan
* **Deskripsi**: Menyusun hasil skrining menjadi dokumen medis formal berstandar PDF langsung dari gawai tanpa perlu internet.
* **Teknis**: Mengubah struktur kode HTML laporan klinis menjadi file PDF fisik menggunakan `expo-print` dan membagikannya ke WhatsApp, Email, atau penyimpanan lokal menggunakan `expo-sharing`.

---

## 4. Alur Perjalanan Pengguna (User Journey Flow)

### Fase 1: Inisialisasi & Pengenalan (Onboarding)
1. **Langkah 1**: Pengguna membuka aplikasi. Sistem memeriksa apakah model AI (PaliGemma ONNX) sudah terpasang di direktori aplikasi (`FileSystem.documentDirectory`).
   * *Kondisi Baru (Pertama kali buka)*: Aplikasi meminta koneksi internet sekali saja untuk mengunduh file model seukuran 1.8GB (On-Demand Loading).
   * *Kondisi Selanjutnya*: Aplikasi langsung masuk ke halaman utama secara instan.
2. **Langkah 2**: Pengguna membuat profil anak dengan memasukkan nama, tanggal lahir, dan jenis kelamin. Data disimpan langsung ke tabel `patients` di basis data SQLite lokal.

### Fase 2: Alur Skrining Aktif (Active Screening)
3. **Langkah 3**: Pengguna menekan tombol "Mulai Skrining Baru".
4. **Langkah 4**: Sistem menghitung umur anak secara presisi. Kuesioner adaptif dimuat sesuai klasifikasi usia. Pengguna menjawab pertanyaan-pertanyaan yang muncul.
5. **Langkah 5 (Sesi Foto)**: Aplikasi membuka antarmuka kamera gawai. Pengguna diminta mengambil 3 foto fokus:
   * Kelopak mata bagian dalam (konjungtiva).
   * Kuku tangan.
   * Muka / kulit.
6. **Langkah 6 (Pemrosesan Latar Belakang)**:
   * Foto secara otomatis dikompresi di latar belakang.
   * Tensor gambar dikirim ke engine ONNX Runtime.
   * Sistem menampilkan indikator pemuatan interaktif: *"Memproses gambar secara lokal pada GPU Anda..."*

### Fase 3: Diagnosis & Intervensi (Diagnosis & Reporting)
7. **Langkah 7**: Hasil analisis gambar digabungkan dengan skor kuesioner oleh mesin kalkulasi lokal.
8. **Langkah 8**: Pengguna dialihkan ke halaman Hasil Skrining yang menampilkan:
   * Spanduk status dinamis berwarna.
   * Penjelasan hasil deteksi AI untuk masing-masing foto.
   * Rekomendasi nutrisi berbasis pangan lokal yang hemat biaya.
   * Tombol "Buka Rujukan Terdekat" (Deep linking ke Maps).
9. **Langkah 9**: Pengguna menekan tombol "Unduh & Bagikan Laporan PDF". File PDF digenerasi secara lokal dan dialog berbagi bawaan ponsel langsung terbuka.

---

## 5. Skema Arsitektur Data (Database Schema)

Penyimpanan data lokal diatur dengan relasi sederhana menggunakan `expo-sqlite`:

```sql
-- Tabel Pasien (Profil Anak)
CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_pasien TEXT NOT NULL,
    tanggal_lahir DATE NOT NULL,
    jenis_kelamin TEXT CHECK(jenis_kelamin IN ('L', 'P')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Sesi Pemeriksaan
CREATE TABLE IF NOT EXISTS screening_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    usia_tahun INTEGER,
    usia_bulan INTEGER,
    foto_muka_path TEXT,
    foto_mata_path TEXT,
    foto_kuku_path TEXT,
    analisis_muka TEXT,
    analisis_mata TEXT,
    analisis_kuku TEXT,
    jawaban_kuesioner TEXT, -- Format String JSON (skor dan jawaban pertanyaan)
    analisis_gabungan TEXT,
    rekomendasi TEXT,
    level_risiko TEXT CHECK(level_risiko IN ('rendah', 'sedang', 'tinggi')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
```

---

## 6. Mitigasi Risiko Utama & Strategi Demo Hackathon

### 6.1 Kegagalan Memori (Out of Memory - OOM) pada HP Juri
* **Risiko**: HP yang digunakan juri saat pengujian memiliki RAM terbatas (di bawah 6GB), menyebabkan aplikasi tertutup paksa (*force close*) saat memuat model 1.8GB.
* **Mitigasi**:
  1. Gunakan pembebasan memori eksplisit `session.release()` segera setelah hasil inferensi AI keluar agar RAM kembali bersih.
  2. Sediakan **"Bypass Mode" (Pintasan Rahasia)**: Tombol tersembunyi yang diletakkan di sudut layar saat presentasi. Jika ditekan, tombol ini akan mensimulasikan respons model AI secara instan menggunakan data tiruan (*mocking*) tanpa harus memuat file model asli ke dalam RAM.

### 6.2 Kendala Pengunduhan Model Saat Demo Sesi Penjurian
* **Risiko**: Sinyal internet di gedung tempat kompetisi hackathon sangat lambat, sehingga proses download model pertama kali sebesar 1.8GB gagal.
* **Mitigasi**: Developer harus menyiapkan satu gawai khusus yang sudah terpasang model secara utuh (pre-loaded) di penyimpanan internal lokal sebelum naik ke panggung presentasi.
