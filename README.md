# axxcalender 🌿

**Ruang kecil untuk hari-hari besar.** Website kalender personal berbahasa Indonesia dengan desain editorial premium, tema pilihan, dan jam real-time. Dibangun menggunakan JavaScript native, CSS responsif, dan Vite—tanpa framework UI.

## Fitur

- Kalender Senin–Minggu, navigasi bulan/tahun (1900–2100), kembali ke hari ini, keyboard panah, dan swipe di HP.
- **17 hari libur nasional Indonesia 2026**, termasuk dua hari Idulfitri. Tidak termasuk cuti bersama. Tahun lain hanya menampilkan lima hari libur bertanggal tetap; batasan ini ditampilkan di UI. Data ada di `src/calendar.js` dan perlu diperbarui mengikuti keputusan pemerintah.
- Empat tema: **Sage Studio**, **Golden Hour**, **Lavender Haze**, dan **Ocean Breeze**.
- Mode terang, gelap, atau mengikuti sistem. Tema dan preferensi tersimpan lokal.
- Jam real-time per detik, format 12/24 jam, zona waktu perangkat, WIB, WITA, dan WIT. Tanggal kalender mengikuti zona waktu perangkat; pilihan zona waktu hanya mengubah kartu jam.
- Agenda pribadi dengan tanggal, waktu opsional, catatan, hapus, dan ekspor `.ics`. Seluruh data hanya disimpan di `localStorage` browser ini; tidak ada akun, server, sinkronisasi, atau pengingat terjadwal.
- Loading SVG ular yang melihat sekeliling dan memakan apel; transisi dan motion graphics ringan yang menghormati `prefers-reduced-motion`.
- Pengaturan dengan **tester notifikasi sistem asli** melalui `ServiceWorkerRegistration.showNotification`, bukan toast yang menyamar sebagai notifikasi.
- PWA dengan ikon PNG, manifest, dan cache offline otomatis pada build produksi.
- Footer CTA, font yang di-host sendiri, dialog native, focus trap pengaturan, label aksesibel, dan pemeriksaan responsif.

## Jalankan lokal

Node.js 22 disarankan.

```bash
npm ci
npm run dev
```

Buka URL yang ditampilkan Vite. Server bind `0.0.0.0`; preview Arena didukung.

```bash
npm test         # pengujian unit kalender dan ekspor ICS
npm run build   # output dist/ + precache PWA produksi
npm run preview # preview hasil build
```

Pengujian browser:

```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

Jika memakai Chromium yang sudah tersedia, set `CHROMIUM_EXECUTABLE_PATH` ke executable-nya. GitHub Actions otomatis menjalankan pengujian unit, build, dan browser.

## Notifikasi HP: cara menguji

1. Buka web melalui **HTTPS** (atau localhost saat pengembangan). Akses melalui alamat IP LAN dengan HTTP tidak memenuhi secure-context browser.
2. Buka tombol pengaturan di kanan atas → **Izinkan & tes notifikasi**.
3. Berikan izin browser. Notifikasi dikirim ke sistem perangkat; periksa pusat notifikasi.
4. Android: gunakan browser yang mendukung Notifications API, misalnya Chrome.
5. **iPhone/iPad iOS 16.4+:** buka lewat Safari → Bagikan → Tambahkan ke Layar Utama. Buka aplikasi dari ikon tersebut sebelum meminta izin.
6. Jika izin ditolak, ubah di pengaturan situs/browser. Mode Fokus/Do Not Disturb, pengaturan OS, browser, atau pembatasan iframe dapat memblokir atau menyenyapkan tampilannya. Buka preview dalam tab penuh bila izin tidak muncul di embedded preview.

Tester tidak mengirim push dari server dan tidak menjadwalkan pengingat saat aplikasi ditutup. Dukungan notifikasi berbeda antar perangkat; keberhasilan pengujian otomatis tidak menjamin banner pada setiap HP.

## Deploy

Website statis, tidak memerlukan backend atau environment secret. Gunakan hosting HTTPS seperti Vercel, Netlify, atau Cloudflare Pages dengan:

- Build command: `npm run build`
- Output directory: `dist`
- App disajikan di **root domain (`/`)**.

Untuk GitHub Pages, gunakan custom domain/root hosting atau sesuaikan seluruh base path (termasuk manifest dan service worker) sebelum memakai URL project `/axxcalender/`. Konfigurasi default ini tidak ditujukan untuk subfolder.

Build mem-precache HTML, ikon, font, CSS, dan JS. Setelah kunjungan online berhasil dan service worker selesai terpasang, kalender tetap dapat dibuka offline. Versi cache mengikuti hash hasil build.

## Struktur

```text
src/main.js             interaksi UI, preferensi, agenda, notifikasi
src/calendar.js         tanggal, hari libur, progres tahun, ekspor ICS
src/style.css           tema, layout responsif, motion graphics
public/                 ikon, manifest, service worker
scripts/precache.mjs    precache aset hasil build
 tests/                 pengujian unit dan browser
```

Informasi libur nasional: ketetapan SKB 3 Menteri 2026, referensi pemerintah [Kemenko PMK](https://www.kemenkopmk.go.id/). Selalu periksa pembaruan ketetapan resmi.
