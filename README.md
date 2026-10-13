<div align="center">

![axxcalender — Header Animasi](.github/assets/header.svg)

# axxcalender<span style="color:#48694f">.</span> &nbsp;🌿

**Ruang kecil untuk hari-hari besar.**

*Website kalender personal berbahasa Indonesia — editorial premium, jam real-time, dan ular yang memakan apel di loading screen.*

<p>
  <a href="https://superrrkyy.github.io/axxcalender/"><img alt="Website" src="https://img.shields.io/badge/Website-axxcalender-48694f?style=for-the-badge&logo=safari&logoColor=white"></a>
  <a href="#-fitur"><img alt="PWA ready" src="https://img.shields.io/badge/PWA-ready-8b9189?style=flat-square"></a>
  <a href="#-pengujian"><img alt="Tests" src="https://img.shields.io/badge/tests-8%20unit%20%7C%2013%20browser-78936a?style=flat-square"></a>
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6.x-646cff?style=flat-square&logo=vite&logoColor=white">
</p>

<p>
  <a href="https://superrrkyy.github.io/axxcalender/"><b>➜ Buka Website → superrrkyy.github.io/axxcalender</b></a> &nbsp;·&nbsp;
  <a href="https://github.com/superrrkyy/axxcalender">Repository</a> &nbsp;·&nbsp;
  <a href="#-jalankan-lokal">Jalankan Lokal</a>
</p>

> Header di atas adalah **SVG beranimasi** yang sama dengan loader di website — ular menoleh kiri-kanan, ekor bergoyang, lidah menjulur, dan apel menghilang ditelan. Animasi menghormati `prefers-reduced-motion`.

</div>

---

## ✨ Fitur

- **Kalender Senin–Minggu** — grid 6 minggu (42 sel), navigasi bulan/tahun 1900–2100, tombol *Hari ini*, `type=month` picker, keyboard panah & swipe HP
- **17 hari libur nasional Indonesia 2026** (termasuk Idulfitri 21–22 Maret) sesuai SKB 3 Menteri; tahun lain hanya 5 tanggal tetap + disclaimer *“Bukan daftar lengkap”* — data di `src/calendar.js`
- **Empat tema editorial**: Sage Studio · Golden Hour · Lavender Haze · Ocean Breeze + mode Terang / Gelap / Sistem (persist `localStorage`)
- **Jam real-time per detik** — toggle 12/24 jam, zona **WIB / WITA / WIT / Otomatis** (`Intl.DateTimeFormat` + `hourCycle`), sinkron saat tab kembali visible
- **Agenda pribadi** — tanggal + waktu opsional + catatan, validasi, escape HTML (anti-XSS), hapus, dan **ekspor `.ics`** dengan folding 75-byte RFC 5545
- **Loading ular 🐍🍎** — SVG murni dengan CSS keyframes (`snake-look` · `tail-wiggle` · `apple-eat` · `tongue`)
- **Tester notifikasi HP sungguhan** — `ServiceWorkerRegistration.showNotification` (bukan toast palsu), dengan `requestPermission` di dalam gesture, panduan **HTTPS** & **iOS Add to Home Screen**
- **PWA** — `manifest.webmanifest` + ikon PNG 192/512 + service worker precache hash (`dist/sw.js` 28 resources) + offline ready
- **Premium & aksesibel** — DM Sans + DM Serif Display self-hosted, dialog native, focus-trap drawer pengaturan, `aria-current`, CTA footer

<div align="center">

| <img src=".github/assets/header.svg" width="100%" alt="preview"/> |
|:--:|
| *Preview desktop — Hero, kalender Oktober 2026, jam real-time, dan koleksi tema* |

</div>

## 🚀 Website

**Live:** **https://superrrkyy.github.io/axxcalender/**

> Jika baru mengaktifkan GitHub Pages, tunggu 1–2 menit setelah *Actions → Deploy* hijau. Untuk domain root/custom, website disajikan di `/` tanpa perubahan `base`. Untuk project pages `/axxcalender/` default, `vite.config.js` sudah siap dengan `base` otomatis.

**Alternatif hosting statis:** Vercel / Netlify / Cloudflare Pages — Build: `npm run build` → Output: `dist` (host di root `/`)

## 🧭 Jalankan lokal

Node.js 22 disarankan. Server bind `0.0.0.0` dan `allowedHosts: ['.e2b.app']` untuk preview Arena.

```bash
npm ci
npm run dev      # http://localhost:5173
```

```bash
npm test         # 8 unit test — kalender & ICS
npm run build    # Vite build + precache PWA → dist/
npm run preview  # preview build http://localhost:4173
```

Browser test (13 test, 6 breakpoint responsif):

```bash
npx playwright install --with-deps chromium
npm run test:e2e
# Jika sudah punya Chromium: CHROMIUM_EXECUTABLE_PATH=/path/to/chromium npm run test:e2e
```

## 📱 Notifikasi HP: cara menguji (asli, bukan palsu)

1. Buka via **HTTPS** (atau `localhost` saat dev) — IP LAN http tidak memenuhi `isSecureContext`
2. Header → ikon slider → **Izinkan & tes notifikasi** → Allow
3. Notifikasi muncul di pusat notifikasi sistem (cek banner)
4. Android: Chrome/Edge yang mendukung Notifications API
5. **iPhone/iPad iOS 16.4+:** buka di **Safari** → Bagikan → *Tambahkan ke Layar Utama* → buka dari ikon aplikasi baru → ulangi langkah 2
6. Jika *Diblokir*: ubah di Site Settings browser. Mode Fokus/DND atau iframe preview bisa menyenyapkan — buka preview di tab penuh.

> Tester tidak mengirim push dari server dan tidak menjadwalkan pengingat saat app tertutup.

## 🗓 Hari libur

Sumber: **SKB 3 Menteri 2026** — referensi [Kemenko PMK](https://www.kemenkopmk.go.id/). Selalu cek ketetapan terbaru; jadwal dapat berubah. Tahun 2026 = 17 hari libur nasional lengkap (tanpa cuti bersama). Tahun lain = hanya 5 tanggal tetap (01-01, 05-01, 06-01, 08-17, 12-25).

## 🛠 Struktur

```text
src/main.js             interaksi UI, preferensi, agenda, notifikasi
src/calendar.js         tanggal, hari libur, progres tahun, ekspor ICS
src/style.css           tema, layout responsif, motion graphics & snake loader
public/                 ikon, manifest, service worker
scripts/precache.mjs    precache aset hash untuk dist/sw.js
tests/                  8 unit + 13 browser (Playwright)
.github/assets/header.svg  header animasi README (sinkron dengan loader website)
.github/workflows/ci.yml   CI: unit + build + browser
```

## 🎨 Tema

| Tema | Nuansa | Background | Aksen |
|------|--------|------------|-------|
| Sage Studio | Tenang, natural | `#f8f9f5` | `#48694f` |
| Golden Hour | Hangat sore | `#faf8f2` | `#9b7752` |
| Lavender Haze | Dreamy lembut | `#f9f8fc` | `#827398` |
| Ocean Breeze | Segar luas | `#f5f9fa` | `#527e91` |

## ✅ Pengujian

- **Unit:** tanggal lokal (non-UTC), layout Oktober 2026, Februari kabisat, 17 vs 5 libur, progress tahun, ICS escaping & folding
- **Browser:** navigasi & clock tanpa error, tema persist + ESC, agenda XSS-safe + persist + export + hapus, holiday modal, notifikasi granted/denied, responsif 320/375/390/768/1024/1440, PWA cache

## 📦 Deploy

Static — tanpa backend/secret. Contoh Vercel:

- Framework: Vite
- Build: `npm run build`
- Output: `dist`

GitHub Pages (Actions) sudah dikonfigurasi — push ke `main` otomatis deploy. Lihat `.github/workflows/pages.yml` jika aktif.

---

<div align="center">

**Dibuat untuk waktumu, bukan sebaliknya. — Made with care, in Indonesia 🇮🇩**

*Waktumu. Ritmemu. **axxcalender.***

</div>
