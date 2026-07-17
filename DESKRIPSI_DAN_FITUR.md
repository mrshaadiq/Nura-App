# Deskripsi & Fitur Platform GiziKu (NURA Kesehatan Anak)

GiziKu adalah platform aplikasi web modern berbasis **Single Page Application (SPA)** yang didedikasikan untuk pencegahan stunting nasional, pemantauan status gizi/anemia anak, serta skrining kesehatan mental dan perilaku menggunakan kecerdasan buatan (AI).

---

## 🛠️ Arsitektur & Teknologi (Tech Stack)

Aplikasi ini menggabungkan kekuatan backend PHP yang kokoh dengan kecepatan frontend React JS yang dinamis.

### 1. Backend (Sisi Server)
* **Bahasa Pemrograman**: **PHP 8.2+**
* **Framework**: **Laravel 11**
* **Tugas Backend**:
  * Menyediakan endpoint API RESTful untuk data provinsi, riwayat pemeriksaan, manajemen artikel, dan autentikasi.
  * Menghubungkan aplikasi dengan API pihak ketiga secara aman (seperti Google Gemini API & DeepSeek AI) menggunakan key rahasia yang disimpan di berkas `.env` (menghindari kebocoran API Key di sisi client).
  * Sistem Database: **MySQL / MariaDB** (migrasi tabel pengguna, role, riwayat pemeriksaan stunting, artikel edukasi, dan riwayat skrining mental).

### 2. Frontend (Sisi Klien)
* **Bahasa Pemrograman**: **JavaScript (ES6+) / JSX**
* **Library Utama**: **React.js 18** (untuk SPA, manajemen state, rendering komponen modular, dan interaktivitas real-time).
* **Styling**: **Tailwind CSS v4** (desain responsif, modern, premium, adaptif di desktop maupun perangkat mobile).
* **Library Ikon**: **Lucide-React** (simbol visual navigasi dan indikator status).

---

## 🌟 Fitur Ungkapan & Teknologi Pendukungnya

Berikut adalah rincian lengkap fitur utama GiziKu beserta penjelasan bahasa pemrograman dan mekanisme yang digunakannya:

### 1. Fitur Kompresi Gambar AI (WebP Compression)
* **Bahasa Pemrograman**: **JavaScript (Sisi Klien / Frontend)**
* **Teknologi**: **HTML5 Canvas API** dan browser-native **createImageBitmap**
* **Penjelasan Teknis**:
  * Ketika pengguna mengambil foto wajah, mata, atau kuku anak melalui kamera webcam atau mengunggah file gambar, ukuran aslinya bisa sangat besar (hingga 5MB–10MB).
  * JavaScript di sisi frontend secara asinkron memproses gambar mentah tersebut menggunakan **Canvas API**: menggambar ulang gambar pada koordinat kanvas virtual dengan resolusi maksimal yang diatur, lalu mengekspornya ke format **WebP (`image/webp`)** dengan kualitas kompresi optimal (~85%).
  * Proses ini mereduksi ukuran file hingga **90% lebih kecil** (biasanya menjadi kurang dari 150KB) secara instan di dalam browser pengguna sebelum dikirim ke server. Ini menghemat kuota internet pengguna dan mempercepat proses unggah secara dramatis.

### 2. Kamera Skrining Visual
* **Bahasa Pemrograman**: **JavaScript (Frontend)**
* **Teknologi**: **HTML5 MediaDevices API (`navigator.mediaDevices.getUserMedia`)**
* **Penjelasan Teknis**:
  * Meminta izin perangkat untuk membuka webcam depan/kamera HP.
  * Menghubungkan aliran video (*video stream*) secara real-time ke elemen `<video>` React yang dikunci dengan atribut `muted`, `autoPlay`, dan `playsInline` (agar kompatibel dan dapat langsung berjalan di browser iOS Safari dan Android Chrome tanpa diblokir).

### 3. Skrining Kesehatan Balita & Kalkulator Stunting
* **Bahasa Pemrograman**: **JavaScript (React) + PHP (Laravel)**
* **Penjelasan Teknis**:
  * Menyediakan formulir asinkron 4 langkah untuk pemeriksaan anak.
  * **Input Tanggal Lahir (JavaScript)**: Tanggal lahir anak dihitung secara otomatis menjadi nilai usia dalam bulan oleh logika frontend JavaScript.
  * **Kalkulasi BMI & Stunting (JavaScript)**: Rumus BMI (Berat / Tinggi kuadrat) dijalankan secara instan di frontend, lalu dicocokkan dengan rentang tinggi badan standar WHO per usia bulan untuk menetapkan kategori stunting atau wasting.
  * **Penyimpanan (PHP/Laravel)**: Seluruh data parameter dan hasil analisis dikirim via JSON asinkron ke database MySQL melalui API `/api/tracker`.

### 4. Skrining Kesehatan Mental & Perilaku Berbasis AI
* **Bahasa Pemrograman**: **PHP (Laravel - Gemini Service) + JavaScript (React - UI)**
* **Teknologi**: **Google Gemini API (Multimodal Vision)**
* **Penjelasan Teknis**:
  * Pengguna mengisi kuesioner dinamis yang menyesuaikan dengan kelompok usia anak (Balita, Prasekolah, Anak Sekolah, Dewasa) dan mengambil foto fisik.
  * Data kuesioner dan file foto (WebP hasil kompresi) dikirim dalam bentuk `multipart/form-data` ke backend Laravel.
  * Service PHP (`GeminiService.php`) mengirimkan foto dan kuesioner ke model Google Gemini AI menggunakan instruksi sistem terstruktur (*System Prompts*) untuk mendapatkan hasil diagnosis psikologis terperinci dalam format JSON murni.

### 5. Peta Interaktif Prevalensi Stunting Indonesia
* **Bahasa Pemrograman**: **JavaScript (React) + HTML/SVG**
* **Penjelasan Teknis**:
  * Peta Indonesia dirender menggunakan jalur vektor **SVG (Scalable Vector Graphics)** terintegrasi di komponen React (`IndonesiaMap.jsx`).
  * JavaScript mendeteksi interaksi hover/klik pada setiap provinsi (Jawa Barat, Bali, dsb) untuk menampilkan tooltip prevalensi stunting, akses faskes, serta status urgensi prioritas penanganan daerah.

### 6. Rekomendasi Makanan AI Khas Daerah (DeepSeek)
* **Bahasa Pemrograman**: **PHP (DeepSeek Server Client) + JavaScript (Offline Logic)**
* **Penjelasan Teknis**:
  * AI menganalisis lokasi provinsi pengguna, usia anak, dan pantangan riwayat kesehatan anak.
  * Menggunakan API **DeepSeek AI** (dengan fallback **Groq / Llama**) untuk merekomendasikan komoditas pangan lokal spesifik daerah tersebut (misal sagu untuk Papua, jagung untuk NTT, ubi/sayur dataran tinggi untuk Jawa Barat) yang aman bagi riwayat alergi anak.
  * Dilengkapi logika *offline fallback* di JavaScript untuk memberikan rekomendasi instan gratis berdasarkan database internal jika API eksternal mengalami gangguan.

### 7. Google Maps Terdekat & Faskes
* **Bahasa Pemrograman**: **JavaScript (React)**
* **Teknologi**: **Google Maps Embed API (Iframe)**
* **Penjelasan Teknis**:
  * Menampilkan daftar fasilitas kesehatan di dekat wilayah pengguna.
  * Ketika salah satu faskes diklik, React merubah state peta sehingga Iframe memuat pencarian Google Maps baru yang terfokus pada alamat faskes tersebut secara real-time.

### 8. Manajemen Artikel Edukasi (CRUD Admin)
* **Bahasa Pemrograman**: **JavaScript (React) + PHP (Laravel - Role Enforcement)**
* **Penjelasan Teknis**:
  * Pengguna dengan role administrator (`role_id === 1`) memiliki akses khusus ke panel manajemen artikel edukasi.
  * Admin dapat membuat, mengubah, dan menghapus artikel literasi stunting secara dinamis tanpa menyentuh database secara langsung.
