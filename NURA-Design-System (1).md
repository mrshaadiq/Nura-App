# NURA Design System

> Dokumentasi resmi design system aplikasi NURA (Nutrisi dan Urgensi Remaja-Anak).  
> Versi 1.1 · Juli 2026 · Mencakup Mobile App & Web Desktop

---

## 1. Prinsip Desain

**Keterbacaan di luar ruangan** — Background putih murni, teks gelap pekat, kontras tinggi agar tetap terbaca di bawah sinar matahari langsung.

**Kepercayaan offline** — Setiap layar menampilkan status "Offline" dan kalimat "tersimpan lokal" untuk membangun rasa aman pengguna pedesaan yang tidak punya koneksi stabil.

**Touch-first** — Semua elemen interaktif minimum 44×44px. Tidak ada target sentuh yang lebih kecil dari itu, bahkan di versi desktop.

**Hierarki aksi yang jelas** — Satu tombol utama per layar (Primary Blue), maksimal dua aksi sekunder. Tidak ada layar dengan lebih dari tiga CTA yang terlihat bersamaan.

---

## 2. Warna

### 2.1 Brand Palette

| Token | Nama | Hex | Kegunaan |
|---|---|---|---|
| `--nura-blue` | Primary Blue | `#1b5be8` | Tombol utama, link aktif, focus ring |
| `--nura-teal` | Secondary Teal | `#00a49a` | Tombol sekunder, badge offline, ikon AI |
| `--nura-coral` | Coral | `#e8635a` | Elemen brand, ilustrasi logo |
| `--nura-yellow` | Amber | `#f59e0b` | Status peringatan (anemia ringan) |
| `--nura-red` | Red | `#e53e3e` | Status berbahaya (anemia berat), destruktif |
| `--nura-green` | Green | `#22c55e` | Status normal, completed step, sukses |

### 2.2 Semantic Tokens

| Token | Hex | Deskripsi |
|---|---|---|
| `--background` | `#ffffff` | Latar halaman — putih murni untuk outdoor |
| `--foreground` | `#1a2332` | Teks utama — biru gelap navy |
| `--muted` | `#f0f4f8` | Surface sekunder, latar input |
| `--muted-foreground` | `#5a6b7e` | Teks placeholder, label sekunder |
| `--border` | `rgba(26, 35, 50, 0.1)` | Hairline border kartu |
| `--accent` | `#e8f0fd` | Surface highlight ringan biru |

### 2.3 Status Colors (Hasil Screening)

| Kondisi | Background | Teks | Penggunaan |
|---|---|---|---|
| Normal | `#dcfce7` | `#16a34a` | Badge riwayat, ikon sukses |
| Anemia Ringan | `#fef9c3` | `#ca8a04` | Banner peringatan, badge |
| Anemia Berat | `#fee2e2` | `#e53e3e` | Banner kritis |

### 2.4 Warna Kontekstual

| Konteks | Background | Border | Teks |
|---|---|---|---|
| Offline Notice | `#e8f5f4` | — | `#2d6b66` |
| Daylight Warning | `#fffbeb` | `#fde68a` | `#92400e` |
| Input field | `#f0f4f8` | `transparent` → `#1b5be8` (focus) | `#1a2332` |
| AI Processing | `#e8f0fd` | — | `#1b5be8` |

### 2.5 Gradien

```css
/* Kartu greeting & tombol primary */
linear-gradient(135deg, #1b5be8 0%, #0f3fa3 100%)

/* Tombol screening utama */
linear-gradient(135deg, #1b5be8 0%, #00a49a 100%)

/* Progress bar AI & camera */
linear-gradient(90deg, #1b5be8, #00a49a)

/* Hero onboarding */
linear-gradient(165deg, #e8f0fd 0%, #e8f5f4 100%)
```

---

## 3. Tipografi

### 3.1 Font Family

```
Display / Heading : Plus Jakarta Sans (humanist sans, dibuat desainer Indonesia)
Body              : Inter (fallback jika Plus Jakarta Sans belum dimuat)
Fallback stack    : system-ui, sans-serif
```

```css
font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
```

### 3.2 Skala Ukuran

| Level | Size | Weight | Line Height | Penggunaan |
|---|---|---|---|---|
| Display | 34px | 800 ExtraBold | 1.1 | Judul NURA di onboarding |
| H1 | 28–30px | 800 ExtraBold | 1.2 | Page title desktop |
| H2 | 20–22px | 800 ExtraBold | 1.3 | Greeting card, section heading |
| H3 | 18px | 700 Bold | 1.4 | Screen header, kartu judul |
| H4 / Label | 15–16px | 700 Bold | 1.5 | Nama artikel, nama faskes |
| Body | 14–15px | 400–500 | 1.5 | Deskripsi, instruksi |
| Caption | 12–13px | 500–600 | 1.4 | Tag, badge, timestamp |
| Micro | 10–11px | 600 | 1.3 | Label uppercase, tracking |

### 3.3 Aturan Uppercase Label

Label kategori dan section header menggunakan `uppercase` + `tracking-widest` + ukuran 10–11px untuk menciptakan hierarki tanpa kebisingan visual:

```css
text-transform: uppercase;
letter-spacing: 0.1em;
font-size: 11px;
font-weight: 700;
color: #8a9ab0;
```

### 3.4 Letter Spacing

| Konteks | Nilai |
|---|---|
| Display heading | `-0.025em` |
| H1 / H2 | `-0.02em` |
| Angka besar (stat, BMI) | `-0.03em` |
| Uppercase label | `+0.1em` (tracking-widest) |
| Body & caption | `0` (default) |

---

## 4. Radius & Bentuk

| Nama | Nilai | Penggunaan |
|---|---|---|
| `sm` | `8px` | Icon container kecil, pill internal |
| `md` | `10px` | — |
| `lg` | `12px` | Input field, tombol sekunder kecil |
| `xl` | `16px` | Tombol, kartu riwayat standar |
| `2xl` | `20px` | Kartu fitur, kartu artikel, step panel |
| `3xl` | `24px` | Kartu greeting, tombol primary hero |
| `full` | `9999px` | Badge status, nav dots, chip filter |

> **Aturan hierarki:** Semakin penting sebuah elemen, semakin besar radius-nya. Chip (full) → kartu standar (xl/2xl) → hero card (3xl).

---

## 5. Bayangan (Shadow)

Prinsip: shadow dipakai untuk elevasi, bukan dekorasi. Kartu mengutamakan border tipis daripada shadow untuk menjaga kebersihan visual di background terang.

| Level | Nilai | Penggunaan |
|---|---|---|
| Kartu default | `border: 1.5px solid rgba(26,35,50,0.07–0.10)` | Semua kartu konten |
| Hover (desktop) | `hover:shadow-md` | Kartu feature saat di-hover |
| Tombol shutter | `0 4px 20px rgba(27,91,232,0.25)` | Shutter button kamera |
| AI glow strip | `0 0 12px rgba(0,164,154,0.7)` | Progress bar kamera saat processing |
| Phone frame | `shadow-2xl` | Wrapper mobile di layar desktop |

---

## 6. Komponen

### 6.1 Button — Primary

Aksi utama tunggal per layar.

```
Background : #1b5be8
Text       : #ffffff
Height     : 56px (mobile) / 48px (desktop)
Width      : full (w-full)
Radius     : 2xl → 3xl tergantung konteks
Font       : 700 Bold, 15–16px
Gap ikon   : 8px
State      : active:scale-[0.98]
Disabled   : background #a0aec0
```

### 6.2 Button — Secondary Teal

Aksi komplementer (navigasi klinik, aksi teal).

```
Background : #00a49a
Text       : #ffffff
Height     : 52px
```

### 6.3 Button — Ghost

Aksi tersier (kembali, batalkan, ulangi).

```
Background : #f0f4f8
Text       : #5a6b7e
Height     : 44–52px
```

### 6.4 Button — Feature Card

Tombol navigasi besar berbentuk kartu, berisi ikon + teks hierarki.

```
Radius     : 2xl
Min-height : 96–100px (mobile) / fleksibel (desktop)
Text align : left
Isi        : Icon container (52×52px) + judul bold + desc kecil
```

### 6.5 Input Field

```
Background  : #f0f4f8
Border      : 2px solid transparent (default)
Border      : 2px solid #1b5be8 (focus)
Radius      : xl (12px)
Height      : 52px
Font-size   : 16px (mobile — mencegah auto-zoom iOS) / 15px (desktop)
Padding-x   : 16px
Transition  : border-color
```

### 6.6 Badge / Chip

```
Padding    : 4px 10px (rounded-full)
Font       : 700, 11–12px
Warna      : pastel background + saturated foreground (lihat §2.3)
```

### 6.7 Kartu (Card)

```
Background : #ffffff
Border     : 1.5px solid rgba(26,35,50,0.07–0.10)
Radius     : 2xl (standar)
Padding    : 16–20px
Overflow   : hidden
```

### 6.8 Icon Container

```
Shape   : rounded-xl (12px)
Size    : 36px (kecil) / 40–44px (standar) / 52–64px (besar)
Warna   : pastel dari warna brand terkait
Ikon    : 16–28px mengikuti ukuran container
```

### 6.9 Progress Bar

```
Height     : 6–10px
Radius     : full
Track      : warna brand pastel (#e8f0fd)
Fill       : gradient linear (biru → teal)
Transition : transition-all duration-100
```

### 6.10 Step Indicator — Mobile

```
Lingkaran  : 28px diameter, rounded-full
Aktif      : background #1b5be8, teks putih
Selesai    : background #22c55e, ikon Check
Pending    : background #e2e8f0, teks #a0aec0
Konektor   : 24 × 3px, warna sama dengan state sebelumnya
```

### 6.11 Step Indicator — Desktop

```
Panel      : fixed 260px, white card
Progress   : linear bar di atas daftar langkah
Tiap item  : lingkaran 26px + label bold + desc kecil
State aktif: background #e8f0fd pada row
```

### 6.12 Offline Notice

```
Background : #e8f5f4
Ikon       : WifiOff atau Cpu, warna #00a49a
Teks       : font-medium, 12–13px, warna #2d6b66
Radius     : xl
Padding    : 12px 16px
```

### 6.13 Warning Toast

```
Background : #fffbeb
Border     : 1.5px solid #fde68a
Ikon       : Info, warna #d97706
Teks       : font-medium, 12px, warna #92400e
Radius     : xl
```

### 6.14 Nav Dots (Mobile only)

```
Dot aktif  : 18 × 6px, background #1b5be8, rounded-full
Dot lain   : 6 × 6px, background #cbd5e0
Transition : width, background
```

### 6.15 Sidebar Item (Desktop only)

```
Height          : 48px
Radius          : xl
Aktif background: #e8f0fd
Aktif teks      : #1b5be8
Default teks    : #5a6b7e
Default ikon    : #8a9ab0
Padding-x       : 16px
Gap             : 12px (ikon + teks)
```

---

## 7. Layout

### 7.1 Mobile (< 1024px)

```
Container       : max-width 390px, centered di layar
Phone frame     : shadow-2xl, overflow hidden
Pattern         : full-screen stack, satu layar per view
Padding-x       : 20px
Padding-y       : 16–24px antar section
Gap antar kartu : 10–12px
```

### 7.2 Desktop (≥ 1024px)

```
Sidebar         : fixed 260px kiri, background #ffffff
Main area       : flex-1, background #f0f4f8, margin-left 260px
Max-width konten: 1152px (max-w-6xl), centered dengan auto margin
Padding main    : 32px (p-8)
Gap kolom       : 24px (gap-6)
```

### 7.3 Grid Patterns (Desktop)

| Halaman | Grid |
|---|---|
| Stat cards | `grid-cols-4` |
| Feature + History | `grid-cols-5` → `3fr + 2fr` |
| Education articles | `grid-cols-3` |
| Faskes cards | `grid-cols-2` |
| History table | `1fr 100px 160px 140px 100px` |
| Screening wizard | `260px sidebar + flex-1 form` |
| Profile form | `grid-cols-2` |

---

## 8. Ikonografi

Library: **Lucide React**

### 8.1 Ukuran per Konteks

| Konteks | Size |
|---|---|
| Ikon inline teks / caption | 12–14px |
| Ikon navigasi sidebar | 19px |
| Ikon dalam tombol | 16–18px |
| Ikon dalam icon container kartu | 20–22px |
| Ikon hero / ilustrasi besar | 34–48px |
| Empty state | 32–40px |

### 8.2 Ikon Utama per Fitur

| Fitur | Ikon |
|---|---|
| AI Screening | `Camera` |
| Edukasi | `BookOpen` |
| Faskes | `MapPin` |
| Riwayat | `Clock` |
| Beranda | `LayoutDashboard` |
| Offline | `WifiOff` |
| AI / GPU | `Cpu` |
| Kelopak mata | `Eye` |
| Kuku | `Hand` |
| Wajah | `Scan` |
| Berat badan | `Scale` |
| Profil anak | `Baby` |
| Navigasi | `Navigation` |
| Telepon | `Phone` |

---

## 9. Aksesibilitas

| Aturan | Nilai |
|---|---|
| Minimum touch target | **44 × 44px** (termasuk elemen tersembunyi) |
| Kontras teks utama | ≥ 4.5:1 (WCAG AA) |
| Kontras large text | ≥ 3:1 |
| Input font-size minimum | **16px** (mencegah auto-zoom iOS) |
| Status non-warna | Setiap status wajib disertai **ikon atau teks**, bukan warna saja |
| Tombol disabled | `background #a0aec0` + `cursor: default`, bukan opacity |
| Focus ring | `border: 2px solid #1b5be8` pada semua input |
| Elemen tersembunyi | `aria-hidden="true"` + `tabIndex={-1}` (bypass button) |

---

## 10. Prinsip Pesan Offline

Setiap kali koneksi relevan, tampilkan salah satu dari tiga frasa standar berikut:

| Konteks | Frasa |
|---|---|
| Setup AI / onboarding | `"AI berjalan lokal di perangkat · Tidak perlu internet"` |
| Form / input data | `"Tersimpan di memori perangkat"` |
| Saat analisis berjalan | `"Memproses di GPU perangkat... Tidak perlu internet."` |

**Kata yang dilarang muncul di UI:**
`server` · `sinkronisasi` · `cloud` · `upload` · `menghubungkan` · `connecting`

---

## 11. Motion & Transisi

| Interaksi | Efek | Durasi |
|---|---|---|
| Tombol ditekan | `scale(0.98)` | 100ms |
| Tombol hover desktop | `opacity: 0.9` atau `shadow-md` | 150ms |
| Progress bar update | `transition-all` | 100ms |
| Step indicator | Perubahan warna + lebar | `transition-all` |
| Nav dots mobile | Lebar `6px → 18px` | `transition-all` |
| AI glow bar | `box-shadow: 0 0 12px rgba(0,164,154,0.7)` | Persistent saat aktif |

**Aturan:**
- Tidak ada animasi keyframe panjang
- Semua transisi ≤ 300ms
- Responsivitas gerak lebih diprioritaskan daripada estetika animasi
- Tidak ada animasi yang menghalangi interaksi pengguna

---

## 12. Tokens CSS Lengkap

```css
:root {
  /* Tipografi */
  --font-size: 16px;
  --font-weight-medium: 600;
  --font-weight-normal: 400;

  /* Warna semantik */
  --background: #ffffff;
  --foreground: #1a2332;
  --card: #ffffff;
  --card-foreground: #1a2332;
  --primary: #1b5be8;
  --primary-foreground: #ffffff;
  --secondary: #00a49a;
  --secondary-foreground: #ffffff;
  --muted: #f0f4f8;
  --muted-foreground: #5a6b7e;
  --accent: #e8f0fd;
  --accent-foreground: #1b5be8;
  --destructive: #e53e3e;
  --destructive-foreground: #ffffff;
  --border: rgba(26, 35, 50, 0.1);
  --input-background: #f0f4f8;
  --ring: #1b5be8;

  /* Radius */
  --radius: 0.75rem; /* 12px = lg */

  /* Brand */
  --nura-blue: #1b5be8;
  --nura-teal: #00a49a;
  --nura-coral: #e8635a;
  --nura-yellow: #f59e0b;
  --nura-red: #e53e3e;
  --nura-green: #22c55e;

  /* Sidebar (desktop) */
  --sidebar: #f8fafc;
  --sidebar-foreground: #1a2332;
  --sidebar-primary: #1b5be8;
  --sidebar-border: rgba(26, 35, 50, 0.08);
}
```

---

## 13. Breakpoint & Platform Detection

NURA menggunakan satu codebase React yang merender dua tampilan berbeda berdasarkan lebar viewport.

```
< 1024px   →  Mobile App  (phone frame, full-screen stack)
≥ 1024px   →  Web Desktop (sidebar + main content area)
```

```tsx
/* Hook deteksi platform */
function useIsDesktop() {
  const [is, setIs] = useState(() => window.innerWidth >= 1024);
  useEffect(() => {
    const h = () => setIs(window.innerWidth >= 1024);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return is;
}

/* Root render */
return isDesktop
  ? <DesktopApp history={history} addHistory={addHistory} />
  : <MobileApp  history={history} addHistory={addHistory} />;
```

**State yang dibagi antara kedua platform:**
- `history: HistoryEntry[]` — riwayat pemeriksaan
- `addHistory()` — fungsi menambah entri baru

Kedua platform menulis ke state yang sama sehingga riwayat tetap konsisten jika viewport berubah.

---

## 14. Mobile App — Pola Layar

### 14.1 Struktur Layar

Setiap layar mobile adalah komponen React yang mengisi penuh area scroll (`flex flex-col min-h-full`). Navigasi antar layar dikelola oleh state `screen` di `MobileApp`.

```
onboarding → home → profile → measurements → ai_setup → camera → results
                 ↘ education
                 ↘ faskes
```

### 14.2 Anatomi Layar Mobile

```
┌─────────────────────────┐
│  Status Bar (9:41)      │  ← Simulasi, selalu terlihat
├─────────────────────────┤
│  Screen Header          │  ← Judul + tombol back (44px)
│  (opsional per layar)   │
├─────────────────────────┤
│                         │
│   Konten Utama          │  ← overflow-y: auto, flex-1
│   (scrollable)          │
│                         │
├─────────────────────────┤
│  CTA / Footer           │  ← Tombol primary, selalu di bawah
│  padding-bottom: 32px   │
├─────────────────────────┤
│  Nav Dots               │  ← 9 dot untuk demo navigasi
└─────────────────────────┘
```

### 14.3 Status Bar Mobile

```
Posisi   : fixed top, full-width
Tinggi   : auto (padding-top 12px, padding-bottom 8px)
Isi kiri : jam simulasi "9:41", font-bold, #1a2332
Isi kanan: ikon WifiOff + teks "Offline", warna #00a49a
Bg       : #ffffff
Border   : tidak ada (konten layar langsung di bawah)
```

### 14.4 Screen Header Mobile

```
Tinggi    : 44px minimum
Padding-x : 20px
Isi       : [Tombol Back 44×44px] + [Judul] + [Slot kanan opsional]
Back btn  : rounded-xl, bg #f0f4f8, ikon ChevronLeft 22px
```

### 14.5 Daftar Layar & Karakteristiknya

| Layar | Header | CTA Footer | Scrollable |
|---|---|---|---|
| Onboarding | Tidak | Primary | Ya |
| Home | Tidak | Tidak | Ya |
| Profile | Ya (+ back) | Primary | Ya |
| Measurements | Ya (+ back) | Primary | Ya |
| AI Setup | Ya (+ back) | Primary (disabled saat loading) | Ya |
| Camera | Ya (+ back) | Shutter button | Tidak |
| Results | Banner risk (ganti header) | 3 CTA | Ya |
| Education | Ya (+ back) | Tidak | Ya |
| Faskes | Ya (+ back) | Tidak | Ya |

### 14.6 Layar Onboarding

```
Hero area    : gradient background, logo 128×128px, tagline
Feature list : 3 baris highlight fitur dengan emoji + teks
Lang selector: grid 2 kolom, toggle pill
CTA          : PrimaryButton full-width "Mulai Sekarang"
Footer note  : "Gratis · Tanpa pendaftaran · Data tersimpan lokal"
```

### 14.7 Layar Home (Dashboard Mobile)

```
Greeting card : rounded-3xl, gradient biru gelap, logo NURA kanan
               Isi: tanggal, sapaan, 2 stat pill + badge Offline
Action primary: rounded-3xl, gradient biru-teal, min-height 96px
               Isi: ikon Camera + judul + sub-label 3 tag + ArrowRight
Action sekunder: grid 2 kolom, kartu biru-muda (Edukasi) + hijau (Faskes)
History list  : kartu daftar dengan avatar + nama + badge status
```

### 14.8 Layar Camera

```
Step tabs     : 3 lingkaran + 2 konektor, horizontal
Viewfinder    : aspect-ratio 4/3, bg #0f1923, corner guides
Instruction   : kartu putih dengan teks instruksi langkah saat ini
Warning toast : amber, ikon Info, teks daylight
Shutter area  : 72×72px lingkaran putih, border biru 5px
Processing    : overlay gelap + progress bar teal glow + teks GPU
```

---

## 15. Web Desktop — Pola Layar

### 15.1 Struktur Layout Desktop

```
┌──────────┬───────────────────────────────────────────┐
│          │  Page Header (greeting / page title)      │
│ Sidebar  ├───────────────────────────────────────────┤
│ 260px    │                                           │
│ fixed    │  Main Content Area                        │
│          │  max-width 1152px, padding 32px           │
│          │  background #f0f4f8                       │
│          │                                           │
└──────────┴───────────────────────────────────────────┘
```

### 15.2 Sidebar Desktop

```
Lebar     : 260px, fixed
Background: #ffffff
Border    : 1.5px solid rgba(26,35,50,0.07) di kanan
Zona atas : Logo NURA (44px) + nama + tagline
Zona tengah: 5 nav item (LayoutDashboard, Camera, BookOpen, MapPin, Clock)
Zona bawah: Offline status card + versi app
```

### 15.3 Navigasi Desktop

| ID | Label | Ikon | Tujuan |
|---|---|---|---|
| `home` | Beranda | `LayoutDashboard` | Dashboard overview |
| `screening` | Screening Kesehatan | `Camera` | Wizard pemeriksaan |
| `education` | Edukasi & Literasi | `BookOpen` | Grid artikel |
| `faskes` | Faskes Terdekat | `MapPin` | Daftar fasilitas |
| `history` | Riwayat Pemeriksaan | `Clock` | Tabel riwayat |

### 15.4 Halaman Beranda Desktop

```
Header row   : Greeting kiri + AI status card kanan
Stat cards   : grid-cols-4, masing-masing ikon + angka besar + label
Feature area : grid 5 kolom (3fr + 2fr)
  Kiri 3fr   : Tombol screening besar (gradient) + grid-cols-2 (Edukasi + Faskes)
  Kanan 2fr  : Panel riwayat terbaru (6 entri, border card)
```

### 15.5 Halaman Screening Desktop (Wizard 2-Panel)

```
Layout      : flex row — panel kiri 260px + panel kanan flex-1
Panel kiri  : sticky top-8, white card
              - Judul + "Langkah X dari 5"
              - Progress bar linear
              - 5 step item dengan lingkaran + label + desc
              - Offline notice di bawah
Panel kanan : white card per langkah (StepCard)
              - Header card: judul + subtitle
              - Body card: form / content
              - Footer card: tombol navigasi rata kanan
```

### 15.6 Langkah Screening Desktop

| Langkah | Layout Form | Komponen Kunci |
|---|---|---|
| Profil Anak | `grid-cols-2`, nama span 2 | Input + gender toggle |
| Berat & Tinggi | `grid-cols-3` | Input + Input + BMI display |
| Persiapan AI | Flex row (ikon + progress area) | Progress bar + model list |
| Pengambilan Foto | Flex row (tab steps kiri + viewfinder kanan) | Viewfinder 16:9 + shutter |
| Hasil Screening | `grid-cols-2` (analisis kiri + aksi kanan) | Cards + 3 CTA + ringkasan |

### 15.7 Halaman Education Desktop

```
Header      : Judul + deskripsi
Tab filter  : pill rounded-full (Semua / Gizi & Nutrisi / Kesehatan Mental)
Grid        : grid-cols-3, gap-5
Kartu       : icon container + tag badge + judul + desc + footer (durasi baca + CTA)
Hover       : shadow-lg transition
```

### 15.8 Halaman Faskes Desktop

```
Header      : Judul + info faskes ditemukan (kanan)
Grid        : grid-cols-2, gap-5
Kartu       : nama + type badge + jarak + rating bintang + jam + telepon
Footer kartu: 2 tombol (Navigasi teal | Hubungi biru), dibagi divider
Hover       : shadow-md transition
```

### 15.9 Halaman Riwayat Desktop

```
Header  : Judul + deskripsi
Tabel   : white card, header row abu (#f8fafc)
Kolom   : Nama Anak (1fr) | Usia (100px) | Tanggal (160px) | Status (140px) | Aksi (100px)
Baris   : avatar icon + nama + badge status + link detail
Empty   : centered icon + teks, padding atas-bawah 64px
```

---

## 16. Perbedaan Komponen per Platform

### 16.1 Tombol

| Properti | Mobile | Desktop |
|---|---|---|
| Height Primary | 56px | 48px |
| Height Secondary | 52px | 48px |
| Height Ghost | 44–52px | 48px |
| Width | `w-full` (full layar) | `auto` dengan padding 24px |
| Hover state | Tidak ada (touch) | `hover:opacity-90` |
| Font size | 16px | 14–15px |

### 16.2 Input Field

| Properti | Mobile | Desktop |
|---|---|---|
| Font size | **16px** (wajib, cegah zoom iOS) | 15px |
| Height | 52px | 52px |
| Layout | Full width, vertikal | Bisa dalam grid kolom |

### 16.3 Kartu / Card

| Properti | Mobile | Desktop |
|---|---|---|
| Border | `1.5px solid rgba(26,35,50,0.08)` | `1.5px solid rgba(26,35,50,0.07)` |
| Padding | 16px | 20–24px |
| Hover | Tidak ada | `hover:shadow-md` atau `hover:shadow-lg` |
| Radius | `2xl` (20px) | `2xl` (20px) — sama |

### 16.4 Navigasi

| Aspek | Mobile | Desktop |
|---|---|---|
| Pola | Full-screen stack + Nav dots | Sidebar fixed + main scroll |
| Tombol back | `ScreenHeader` dengan chevron | Link teks "← Kembali ke ..." |
| Indikator aktif | Nav dot melebar (6px → 18px) | Sidebar item bg #e8f0fd |
| Jumlah nav item | 9 (via nav dots demo) | 5 (sidebar) |

### 16.5 Greeting Card

| Aspek | Mobile | Desktop |
|---|---|---|
| Bentuk | Kartu penuh dalam layar, rounded-3xl | Baris header teks + widget AI |
| Statistik | 2 stat pill + badge Offline dalam kartu | 4 kartu stat terpisah di bawah header |
| Logo | Di dalam kartu kanan | Di sidebar (bukan di header) |

### 16.6 Screening Flow

| Aspek | Mobile | Desktop |
|---|---|---|
| Layout | Satu langkah per layar penuh | 2-panel: stepper kiri + form kanan |
| Navigasi | Tombol "Lanjut" di footer | Tombol di footer kartu (rata kanan) |
| Back | `ScreenHeader` dengan chevron | Link teks di atas panel |
| Camera viewfinder | Aspect-ratio 4/3 | Aspect-ratio 16/9, max-height 260px |
| Hasil | Full-screen vertikal | Grid 2 kolom (analisis + aksi) |

---

## 17. Shared State & Data Layer

Kedua platform (mobile dan desktop) berbagi layer data yang sama:

```
src/app/lib/data.ts
├── Types          : ChildProfile, Measurements, HistoryEntry, dll.
├── Mock data      : MOCK_HISTORY, EDUCATION_ARTICLES, FASKES_LIST
├── Constants      : FASKES_TYPE_COLORS
└── Helpers        : calcBMI(), getResultColor()
```

```
src/app/App.tsx              — Mobile screens + root App + useIsDesktop
src/app/components/
└── DesktopApp.tsx           — Semua komponen desktop
    ├── DesktopSidebar
    ├── DesktopHome
    ├── DesktopScreening     (+ DeskStep* sub-components)
    ├── DesktopEducation
    ├── DesktopFaskes
    └── DesktopHistory
```

---

*NURA Design System · Versi 1.1 · Dibuat untuk mendukung kesehatan anak Indonesia.*
