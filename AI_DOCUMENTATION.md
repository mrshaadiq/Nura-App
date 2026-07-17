# Dokumentasi Sistem Kecerdasan Buatan (AI) & Deep Learning - Nura App

Nura App mengadopsi arsitektur **Hybrid AI** yang canggih, menggabungkan kekuatan pemrosesan awan (*Cloud AI*) yang presisi dan akselerasi kecerdasan buatan lokal (*On-Device Deep Learning*) yang mandiri dan aman. 

Dokumentasi ini menjelaskan seluruh fitur AI, cara kerja, alur data, serta optimasi performa yang diimplementasikan pada aplikasi.

---

## 1. Arsitektur AI & Tiga Mode Operasional

Aplikasi menyediakan saklar mode AI di Header halaman utama (**HomeScreen**) dan footer halaman pemindaian (**ScannerScreen**) untuk mempermudah pengguna beralih di antara tiga mode operasional:

### 🌐 Mode Online AI (Cloud Integration)
Menggunakan model bahasa besar (*Large Language Models*) dan model visi (*Vision Models*) mutakhir secara komputasi awan.
*   **Pipeline Analisis Gambar:** Foto kelopak mata, kuku, dan wajah diunggah sebagai base64 string yang telah dikompresi.
    *   **Primer:** **Gemini 2.0 Flash** (dan fallback otomatis ke **Gemini 1.5 Flash**) untuk mendeteksi tanda konjungtiva pucat atau anomali gizi pada wajah/kuku.
    *   **Sekunder (Fallback):** **Groq Llama 3.2 90B Vision Preview** jika jalur API Gemini mengalami gangguan.
*   **Diagnosis Terintegrasi:** Menggunakan **Groq Llama 3.3 70B Versatile** untuk mensintesis hasil kuesioner, catatan orang tua, dan tanda fisik menjadi kesimpulan klinis terstruktur (Rendah, Sedang, Tinggi) beserta saran gizi.
*   **Pembuatan Kuesioner Dinamis:** Groq memformulasikan 4 pertanyaan kuesioner yang disesuaikan secara khusus dengan nama dan usia pasien.

### 💾 Mode Offline AI (Local Deep Learning)
Menjalankan model **Deep Learning secara lokal di memori HP** tanpa membutuhkan koneksi internet atau kuota data.
*   **Engine & Runtime:** Menggunakan **ONNX Runtime** (`onnxruntime-react-native`) yang terintegrasi secara native di platform Android.
*   **Model Visi:** Menggunakan arsitektur jaringan saraf tiruan **MobileNetV2** (`mobilenetv2-12.onnx`) berukuran **~45 MB** yang sangat efisien dan dioptimalkan khusus untuk klasifikasi visual dengan konsumsi daya rendah.
*   **Sideloading & Download:** Mendukung unduhan model secara langsung dari repositori publik dengan indikator progres ukuran berkas *real-time* (Megabytes), atau impor mandiri file `.onnx` dari penyimpanan internal HP.

### 🖥️ Mode Simulasi
Mode pengujian bebas kamera dan pemuatan model. Mode ini menghasilkan hasil sintetis acak untuk keperluan demonstrasi atau uji coba fitur antarmuka tanpa beban komputasi.

---

## 2. Fitur Unggulan & Inovasi Cerdas

### 🔄 Pembelajaran Adaptif Lokal (Local Learning Loop)
Nura App tidak hanya melakukan diagnosis statis, melainkan **selalu belajar menjadi lebih pintar** seiring waktu melalui data histori pasien:
*   Setiap hasil pemeriksaan disimpan ke database lokal **SQLite** (`screening_sessions`).
*   Saat melakukan skrining baru, AI lokal akan mendeteksi riwayat pemeriksaan sebelumnya dan menghitung perkembangan klinis pasien berdasarkan indikator akumulasi skor klinis.
*   **Ulasan Dinamis:** AI akan menyusun tren perkembangan gizi pasien:
    *   **`membaik` (Tren Positif):** Menampilkan apresiasi keberhasilan asupan gizi.
    *   **`memburuk` (Peringatan):** Mengeluarkan alarm klinis agar segera dirujuk ke Puskesmas/Dokter.
    *   **`belum_membaik` (Tren Stabil/Stagnan):** Menginstruksikan evaluasi pola makan harian.
*   Pemeriksaan yang memiliki riwayat otomatis ditandai sebagai `tindak_lanjut` untuk menghubungkan rekam medis pasien.

### ⚡ Kompresi Gambar Cerdas (WebP Integration)
Untuk mengatasi masalah pemrosesan gambar berukuran besar dari kamera HP beresolusi tinggi, aplikasi dilengkapi sistem kompresi otomatis:
*   **Format WebP/JPEG:** Foto kamera HP langsung dikompresi ke format **WebP** (atau JPEG berkualitas tinggi secara otomatis jika perangkat tidak mendukung WebP).
*   **Dimensi & Kualitas:** Gambar di-resize ke lebar maksimal **600px** dengan rasio kompresi kualitas **60%**.
*   **Dampak Performa:** Mengurangi ukuran berkas foto dari yang sebelumnya ~3-5 MB menjadi hanya **~20 KB** tanpa merusak detail klinis visual (warna konjungtiva mata dan bentuk kuku tetap presisi). Analisis lokal (ONNX) dan upload data ke server awan menjadi secepat kilat dan hemat memori RAM.

### 🛡️ Friendly Error Handling (Penanganan Error Ramah Pengguna)
Aplikasi mematikan pesan error teknis berkode rumit (*stack traces*) yang membingungkan bagi pengguna non-teknis.
*   Parser `cleanErrorMessage` mendeteksi kode kegagalan API (seperti masalah jaringan, batas kecepatan *rate-limit* 429, kunci API kadaluwarsa, atau gangguan server internal 500).
*   Aplikasi menampilkan popup **Alert** dialog berbahasa Indonesia yang jelas, lalu secara otomatis mengalihkan sistem ke analisis cadangan lokal (Offline/Simulasi) agar layanan tidak terputus.

---

## 3. Komponen & Struktur File Kode

Sistem AI diimplementasikan secara modular pada file-file berikut:

| Nama File | Peran Utama |
| :--- | :--- |
| **[aiSettings.ts](file:///c:/laragon/www/Nura-App/ai/aiSettings.ts)** | Mengelola *global state* untuk mode AI aktif (`online`, `offline`, `simulasi`). |
| **[onlineRunner.ts](file:///c:/laragon/www/Nura-App/ai/onlineRunner.ts)** | Menangani seluruh transaksi API eksternal menuju Gemini dan Groq Cloud. |
| **[onnxRunner.ts](file:///c:/laragon/www/Nura-App/ai/onnxRunner.ts)** | Runtime ONNX lokal untuk memuat model, memproses input piksel gambar, dan eksekusi inferensi. |
| **[modelDownloader.ts](file:///c:/laragon/www/Nura-App/ai/modelDownloader.ts)** | Menangani manajemen pengunduhan, validasi keberadaan, dan penghapusan file model lokal. |
| **[env.ts](file:///c:/laragon/www/Nura-App/ai/env.ts)** | Penyimpanan rahasia kunci API (diabaikan dari Git untuk keamanan). |
| **[ScannerScreen.tsx](file:///c:/laragon/www/Nura-App/screens/ScannerScreen.tsx)** | Antarmuka kamera pemindaian, proses kompresi WebP, eksekusi visual AI, dan mesin pembelajaran lokal. |
| **[QuestionnaireScreen.tsx](file:///c:/laragon/www/Nura-App/screens/QuestionnaireScreen.tsx)** | Pengambilan kuesioner otomatis berbasis AI dan validasi kesalahan server. |

---

## 4. Panduan Optimasi Performa HP (RAM 12GB)

HP dengan RAM 12GB sangat ideal untuk menjalankan Nura App pada mode performa puncaknya:
1.  **Gunakan Mode Offline Secara Bebas:** Tidak perlu khawatir HP melambat karena MobileNetV2 lokal hanya membutuhkan alokasi memori RAM kecil (< 100MB), menjamin sisa RAM Anda tetap lega.
2.  **Sediakan Penyimpanan ~45MB:** Pastikan memori internal memiliki ruang sekitar 45MB untuk menyimpan file `mobilenetv2-12.onnx`.
3.  **Lakukan Pemindaian Ulang Rutin:** Lakukan skrining secara berkala (misal 1 bulan sekali) agar database SQLite lokal memiliki data historis yang cukup untuk menganalisis tren perkembangan fisik anak secara optimal.
