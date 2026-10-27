# 🔍 Laporan Audit Repository — axxcalender

> **Verifikasi e2e pasca-perbaikan (sandbox):** 17/18 browser test lolos memakai Chromium pinjaman (CDN Playwright terblokir di sandbox), 1 test notifikasi di-_skip_ secara eksplisit karena build Chromium tersebut tidak punya backend notifikasi (probe `showNotification` asli ditolak platform — di CI dengan Chromium resmi Playwright test ini berjalan penuh). Proses ini juga menemukan & memperbaiki bug nyata tambahan: pencocokan cache `Vary: Origin` yang membuat JS/CSS gagal dimuat saat offline di belakang server CORS (diatasi dengan `ignoreVary: true`).
>
> **Status perbaikan (27 Oktober 2026):** seluruh temuan yang dapat diperbaiki lewat kode sudah diimplementasikan di branch perbaikan menyertai laporan ini — path PWA sadar-base (P0-2, termasuk test subpath & offline sungguhan), data libur 2027 dari SKB 3 Menteri No. 1205/3/2 Tahun 2026 (P1-3), kontras/ukuran teks/target sentuh/roving tabindex (P1-1), test diperketat (P1-2), fallback `randomUUID` (P1-4), seluruh P2, serta P3 (formatting Prettier+ESLint, LICENSE MIT, Dependabot, upgrade lucide 1.61 & Vite 8, workflow dipin ke SHA). **P0-1 selesai (27 Oktober 2026):** GitHub Pages telah diaktifkan secara manual oleh pemilik repo (_Settings → Pages → Source: GitHub Actions_); situs live di https://superrrkyy.github.io/axxcalender/ dengan HTTPS terpasang, dan workflow _Quality checks_ serta _Deploy to GitHub Pages_ hijau di CI sungguhan. Run pertama setelah merge sempat gagal di langkah `configure-pages` karena Pages belum aktif saat itu; dokumentasi action tersebut menegaskan opsi `enablement` memerlukan PAT/GitHub App (`administration:write`) — `GITHUB_TOKEN` tidak cukup — sehingga aktivasi manual memang satu-satunya jalan. Setelan repo lain yang hanya bisa lewat UI: _delete branch on merge_ dan penghapusan branch lama `arena/3db89a8f-…`.

|                    |                                                                                                                                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Repository**     | `superrrkyy/axxcalender` (publik)                                                                                                                                                                     |
| **Commit diaudit** | `22952cd` — _Update vite.config.js_ (13 Okt 2026)                                                                                                                                                     |
| **Tanggal audit**  | 27 Oktober 2026                                                                                                                                                                                       |
| **Stack**          | Vanilla JS (ES Modules) + Vite 6.4.4 + Lucide + Fontsource, PWA, Playwright                                                                                                                           |
| **Ukuran**         | 21 file · ±2.118 baris · 201 KB (di luar `.git`)                                                                                                                                                      |
| **Metode**         | Review statis seluruh file, `npm ci`, unit test, `npm audit`, build root & `GITHUB_PAGES`, inspeksi `dist/`, API GitHub (repo, Actions, Pages), cek situs live, verifikasi data libur ke sumber resmi |

> **Keterbatasan audit:** Browser test Playwright (13 test) **tidak dapat dijalankan di sandbox audit** karena CDN Playwright (`cdn.playwright.dev`) tidak dapat diakses dari lingkungan ini dan tidak ada Chromium lokal. Sebagai gantinya dilakukan pemeriksaan statis (seluruh ID yang dirujuk JS ada di HTML, inspeksi hasil build, dll). Unit test, build, dan cek live site dijalankan nyata.
> Branch protection GitHub tidak dapat diverifikasi (API mengembalikan 403 untuk token integrasi).

---

## Ringkasan Eksekutif

**Kode aplikasinya bagus; jalur rilisnya mati.** Secara produk, axxcalender adalah aplikasi kalender statis yang rapi, aman dari XSS, teruji di level unit, dan data liburnya akurat. Namun ada satu masalah fatal: **situs yang diiklankan di README (superrrkyy.github.io/axxcalender) mengembalikan 404** — GitHub Pages belum pernah diaktifkan untuk repo ini (`has_pages: false`), dan tidak ada satu pun workflow run tercatat via API. Sekalipun Pages diaktifkan hari ini, PWA-nya **tetap rusak di subpath** karena semua path di service worker, manifest, dan registrasi SW bersifat absolut ke root domain.

### Skor per area

| Area                                             | Skor        | Catatan singkat                                                  |
| ------------------------------------------------ | ----------- | ---------------------------------------------------------------- |
| Fungsionalitas inti (kalender, jam, agenda, ICS) | **85/100**  | Logika tanggal benar, anti-bug UTC, ICS sesuai RFC 5545          |
| Keamanan                                         | **85/100**  | 0 kerentanan npm, escape HTML konsisten, tanpa secret/tracker    |
| Pengujian                                        | **70/100**  | 8 unit + 13 browser, tapi 2 test kunci bersifat "palsu sebagian" |
| Performa                                         | **75/100**  | JS 10 KB gzip; font di-precache berlebihan (±290 KB)             |
| Aksesibilitas                                    | **60/100**  | Kontras teks kecil gagal WCAG AA (3,05:1), font 6–10 px          |
| Maintainability                                  | **55/100**  | CSS 25 baris raksasa (s.d. 4.178 karakter/baris), tanpa linter   |
| Dokumentasi                                      | **80/100**  | README sangat lengkap, tapi tautan utamanya 404                  |
| Deploy & PWA                                     | **35/100**  | Pages tidak aktif; path absolut rusak di subpath                 |
| **Keseluruhan**                                  | **±68/100** | Produk baik, **belum siap produksi** sampai P0 diperbaiki        |

---

## 🔴 P0 — Kritis (situs tidak bisa diakses publik)

### P0-1. GitHub Pages tidak aktif — situs live 404

- **Bukti:** `GET https://superrrkyy.github.io/axxcalender/` → **404 "File not found"** (Dicek saat audit). API repo: `"has_pages": false`. Endpoint Pages repo: 404. Workflow runs via API: **0 run**, dan hanya 1 workflow terdaftar (_Deploy to GitHub Pages_) — workflow CI (`ci.yml`, "Quality checks") **tidak terdaftar sama sekali** di GitHub walau filenya ada dan identik dengan lokal (blob `47b1c07`).
- **Dampak:** Seluruh klaim README ("➜ Buka Website", badge Website, homepage repo) mengarah ke halaman mati. CI tidak pernah terbukti jalan.
- **Perbaikan:** Repo → _Settings → Pages → Build and deployment → Source: **GitHub Actions**_; pastikan _Settings → Actions → General_ mengizinkan workflow; jalankan manual via tab Actions (_Deploy to GitHub Pages → Run workflow_ — workflow sudah punya `workflow_dispatch`); verifikasi `ci.yml` muncul & hijau. Selidiki mengapa `ci.yml` tidak terdaftar (kemungkinan Actions pernah nonaktif).

### P0-2. Path absolut merusak PWA/SW/notifikasi di subpath `/axxcalender/`

Build mode Pages (`GITHUB_PAGES=true`) terbukti menghasilkan artefak yang salah:

- ✅ Vite menulis ulang referensi di `dist/index.html` dengan benar (`/axxcalender/assets/…`, `/axxcalender/icon.svg`).
- ❌ `scripts/precache.mjs:3,6` membangkitkan daftar precache root-absolut (`"/"`, `"/assets/…"`) → di situs proyek, `/assets/…` mengarah ke **repo user-site** (`superrrkyy.github.io`), 404 → `cache.addAll()` di `public/sw.js:2-4` reject → **service worker gagal install total** (tidak ada offline, tidak ada notifikasi).
- ❌ `src/main.js:303` — `navigator.serviceWorker.register('/sw.js')` mengambil SW dari root user-site (terverifikasi 404; lebih buruk: jika suatu hari user-site punya `/sw.js`, app ini akan mendaftarkan SW situs lain).
- ❌ `public/manifest.webmanifest` — `"id":"/"`, `"start_url":"/"`, `"scope":"/"`, ikon `"/icon-192.png"` → PWA terinstal akan membuka root user-site, bukan app ini.
- ❌ `public/sw.js:16,22` — fallback `caches.match('/')` dan `clients.openWindow('/')`; `src/main.js` (fungsi `testNotification`) — ikon notifikasi `'/icon-192.png'` dan `data.url: '/'`.
- **Dampak:** Tiga fitur unggulan README (PWA offline, install, notifikasi HP asli) **tidak berfungsi di alamat produksi yang diiklankan**, walaupun semua test hijau — karena seluruh test berjalan di root `/` (Playwright `baseURL: localhost:4173/`).
- **Perbaikan:** Jadikan semua path relatif terhadap base: gunakan `import.meta.env.BASE_URL` di `main.js` (`register(BASE_URL + 'sw.js')`), path relatif di manifest (`"start_url": "."`, `"scope": "."`, ikon tanpa `/` di depan), dan bangkitkan precache dengan prefix `process.env.GITHUB_PAGES ? '/axxcalender/' : '/'` (atau lebih baik: resolve URL relatif terhadap `self.registration.scope` di dalam SW). Tambahkan 1 test e2e yang melayani `dist` dari subpath.

---

## 🟠 P1 — Tinggi

### P1-1. Aksesibilitas: kontras & ukuran teks gagal WCAG AA

- `--muted: #8b9189` di atas `--bg #f8f9f5` = **3,05:1**; di atas surface putih = **3,23:1** (syarat AA teks kecil: 4,5:1). Warna libur `#c97864` di putih = **3,30:1**. Warna ini dipakai untuk teks 8–12 px di mana-mana (mode gelap justru lolos: 6,73:1).
- `src/style.css` memakai font-size **4px (mini-calendar dekoratif), 6px, 7px, 8px, 9px, 10px** untuk konten nyata (nama libur 7px, legenda 8px, label jam 6–8px di mobile) — tidak terbaca bagi banyak pengguna.
- Target sentuh kecil: `.month-arrows button` 26×30px (mobile 24×27px), tombol hapus agenda hanya ikon 12px tanpa area klik minimum, `.icon-button` 38px (< pedoman 44px).
- Grid kalender = 42 tombol yang **semuanya masuk urutan Tab**; pola grid yang benar memakai _roving tabindex_ (1 tab stop + panah — handler panahnya sudah ada, tinggal mengelola `tabindex`).
- Tidak ada _skip link_; tombol buka pengaturan tanpa `aria-expanded`/`aria-controls`.
- **Yang sudah bagus:** `prefers-reduced-motion`, focus-visible 3px, `aria-current="date"`, label tanggal lengkap untuk screen reader, dialog native `<dialog>`, focus-trap drawer, `lang="id"`.

### P1-2. Test kunci memberikan rasa aman palsu (`tests/browser/app.spec.js`)

- Test notifikasi me-monkeypatch `ServiceWorkerRegistration.prototype.showNotification`/`getNotifications`, menelan error asli (`catch(() => {})`), lalu menyuntikkan judul dari array `window.__axxNotifications` — test bisa hijau walau notifikasi asli gagal.
- Test PWA secara eksplisit **tidak menguji offline sungguhan** (komentar: _"avoids flaky offline simulation"_) — hanya memeriksa isi Cache Storage. Inilah sebabnya bug P0-2 lolos.
- Cakupan yang hilang: zona waktu WIB/WITA/WIT, format 12 jam, navigasi panah keyboard, swipe, mode Sistem, batas tahun 1900/2100 di UI, `localStorage` rusak/penuh, isi file `.ics` hasil unduhan, dan **mode subpath**.
- Hanya Chromium; "responsif" hanya mengganti viewport (tanpa emulasi device/touch).
- `playwright.config.js` menjalankan `npm run preview` tanpa build — di mesin bersih tanpa `dist/`, `npm run test:e2e` gagal; README tidak menegaskan urutannya. `reuseExistingServer: !CI` berisiko menguji server basi.

### P1-3. Data libur akan kedaluwarsa dalam ±2 bulan

- Data 2026 **terverifikasi akurat** terhadap SKB 3 Menteri (No. 1497/2/5 Tahun 2025): 17 hari, termasuk Nyepi 19 Mar & Idulfitri 21–22 Mar. ✅
- Namun per tanggal audit (27 Okt 2026), tahun 2027 tinggal 2 bulan lagi dan `src/calendar.js` hanya menyediakan 5 tanggal tetap untuk tahun selain 2026. Nilai jual utama app akan menurun tepat saat pengguna membutuhkannya. **Jadwalkan penambahan `HOLIDAYS_2027`** mengikuti SKB terbaru dan buat pengingat tahunan (issue terjadwal).

### P1-4. `crypto.randomUUID()` membuat agenda gagal diam-diam di HTTP non-localhost

`src/main.js` (submit agenda) memanggil `crypto.randomUUID()` yang hanya tersedia di _secure context_. Diakses via IP LAN (`http://192.168.…`, skenario yang justru dibahas README untuk tes HP), submit melempar `TypeError` tanpa `try/catch` — dialog tidak menutup, tidak ada toast, pengguna tidak tahu apa yang terjadi. Tambahkan fallback ID (mis. `Date.now()` + `Math.random()`) atau tangkap errornya.

---

## 🟡 P2 — Sedang

| #    | Temuan                                                                                                                                                                                                                                                                                                                                                     | Lokasi                                                     | Saran                                                                                                                                                                               |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P2-1 | Precache memboroskan bandwidth: 28 resource (±416 KB) termasuk **20 file font** — subset `latin-ext` dan format `.woff` (fallback) ikut diunduh saat SW install, padahal browser modern hanya butuh `latin` `.woff2` (±82 KB).                                                                                                                             | `scripts/precache.mjs`, import Fontsource di `main.js:1-5` | Import subset latin saja (`@fontsource/dm-sans/latin-400.css` dsb.) dan/atau saring `.woff` dari daftar precache.                                                                   |
| P2-2 | `event.waitUntil()` dipanggil di dalam `.then()` hasil `fetch` — di sebagian browser dapat melempar `InvalidAccessError` karena event sudah tidak aktif.                                                                                                                                                                                                   | `public/sw.js:13-16`                                       | Restrukturisasi: simpan promise cache-put lalu `waitUntil` sinkron, atau lakukan `cache.put` di dalam async IIFE yang diberikan ke `respondWith`.                                   |
| P2-3 | Jam: "hari ini" (`currentDay`, hero date, progres tahun) selalu zona **lokal perangkat**, sedangkan jam dinding mengikuti zona pilihan (WIB/WITA/WIT) — di sekitar tengah malam keduanya bisa berbeda hari. Interval 1000ms juga tidak disejajarkan ke batas detik (tampilan bisa telat s.d. ±999ms), dan `Intl.DateTimeFormat` dibuat ulang 2× per detik. | `src/main.js` (`updateClock`, `updateToday`)               | Turunkan `currentDay` dari zona terpilih; cache formatter; jadwalkan tick dengan `setTimeout` ke milidetik 0.                                                                       |
| P2-4 | Agenda berwaktu diekspor tanpa `DTEND`/`DURATION` → menurut RFC 5545 durasinya 0 (acara sekejap) di kalender tujuan. Urutan ekspor mengikuti urutan input, bukan kronologis.                                                                                                                                                                               | `src/calendar.js` (`makeICS`)                              | Tambahkan `DURATION:PT1H` atau `DTEND` +1 jam; urutkan event sebelum ekspor.                                                                                                        |
| P2-5 | Validasi agenda dari `localStorage` hanya regex bentuk (`\d{2}:\d{2}` loloskan `99:99`; `2026-02-31` lolos lalu `parseDate` menggesernya ke Maret). `note` tidak dicek tipenya; tidak ada versi skema (`axx-agenda` v1?) untuk migrasi mendatang.                                                                                                          | `src/main.js:35`, `calendar.js:parseDate`                  | Validasi tanggal riil (round-trip `dateKey(parseDate(k)) === k`), rentang jam, dan bungkus data dengan `{version, events}`. (Risiko rendah — hanya dari storage yang dimanipulasi.) |
| P2-6 | Swipe bulan tidak menekan _click_ susulan — geser >70px lalu lepas masih bisa memicu klik pada sel asal sehingga tanggal terpilih menimpa hasil navigasi (atau menarik kembali ke bulan asal untuk sel _outside_).                                                                                                                                         | `src/main.js` (touch handlers)                             | Set flag `justSwiped` dan abaikan klik berikutnya, atau `preventDefault` terukur.                                                                                                   |
| P2-7 | Loader memaksa tunggu 1.300ms + animasi `.app-shell` delay 0,9s untuk setiap kunjungan — memperlambat LCP yang dirasakan padahal app statis ini siap seketika.                                                                                                                                                                                             | `src/main.js:306`, `style.css`                             | Sembunyikan loader saat render pertama selesai (atau ≤400ms), cukup tampilkan animasi ular di kunjungan pertama.                                                                    |
| P2-8 | `precache.mjs` rapuh: dua `String.replace` pada string persis di `sw.js` tanpa asersi — perubahan format sekecil apa pun membuat build "berhasil" tapi mengirim SW basi berisi 3 file. Versi cache hanya hash `index.html`; perubahan khusus ikon/SW tidak mengganti nama cache sehingga entri usang tidak dibersihkan `activate`.                         | `scripts/precache.mjs:8`                                   | Lempar error jika pola tidak ditemukan; hash gabungan semua aset; pertimbangkan Workbox/`vite-plugin-pwa`.                                                                          |
| P2-9 | SEO/sosial: tidak ada Open Graph/Twitter Card, `canonical`, `apple-touch-icon`, meta `mobile-web-app-capable`; ikon manifest memakai `purpose:"any maskable"` gabungan (desain memenuhi tepi → berisiko terpotong sebagai maskable).                                                                                                                       | `index.html:3-10`, `manifest.webmanifest`                  | Tambahkan meta OG + ikon Apple 180px; pisahkan ikon `any` dan `maskable` (dengan _safe zone_).                                                                                      |

---

## 🟢 P3 — Rendah / kebersihan

- **Maintainability format:** `src/style.css` hanya 25 baris fisik dengan baris terpanjang **4.178 karakter**; `index.html` serupa (paragraf HTML satu baris raksasa); `manifest.webmanifest` 1 baris. Diff & review hampir mustahil. Tidak ada Prettier/ESLint/editorconfig. → Format ulang + tambahkan `prettier` & script `lint`.
- **Dead code & inefisiensi mikro:** `const holidays = holidaysForYear(year)` di `renderCalendar` tidak pernah dipakai, sementara `holidaysForYear()` dipanggil ulang untuk **setiap** dari 42 sel (membuat objek baru per sel untuk tahun non-2026) dan `fullDate()` menjalankan `toLocaleDateString` 42× per render. Cache per tahun (maks. 2 tahun per tampilan).
- **Dependensi tertinggal:** `lucide@0.468.0` (Des 2024) — rentang `^0.468.0` pada versi 0.x **tidak akan pernah naik** melewati 0.468.x; versi terbaru di registry saat audit 1.61.0. Nama ikon lama yang dipakai (`Globe2`, `CheckCircle2`, `Clock3`, `SunMoon`) adalah alias usang yang berisiko hilang saat upgrade besar. `vite` terpasang 6.4.4 (lockfile), tersedia 6.4.5 dan mayor 8.3.5. `@playwright/test` 1.64.0 → 1.64.1. **Kabar baik:** `npm audit` = **0 kerentanan**. Tambahkan Dependabot/Renovate.
- **Tidak ada `LICENSE`** — repo publik tanpa lisensi berarti _all rights reserved_ secara default; orang lain secara hukum tidak boleh memakai kodenya. Tambahkan MIT (dan `CONTRIBUTING.md`, template issue, `.nvmrc`/field `engines` Node 22 yang sudah dijanjikan README).
- **Kebersihan Git:** total 7 commit (semua 13 Okt 2026) — 1 PR fitur raksasa (#1) lalu 4 commit langsung ke `main` via web ("Update vite.config.js" dsb.) tanpa PR. Branch lama `arena/3db89a8f-…` masih ada di remote (`delete_branch_on_merge: false`). Tidak ada tag/release walau `package.json` sudah `1.0.0`. → Aktifkan _delete branch on merge_, buat tag `v1.0.0`, pertimbangkan branch protection mewajibkan CI (tidak dapat diverifikasi saat audit — API 403).
- **CI:** `ci.yml` terpicu `push` + `pull_request` tanpa `branches`/concurrency → run ganda di PR. `pages.yml` men-deploy tanpa menunggu CI/e2e (hanya unit test internalnya). Action dipin hanya dengan tag mayor (`@v4`), bukan SHA. Artefak kegagalan hanya mengunggah `test-results/` (Playwright tanpa reporter HTML tidak mengisinya). Browser Playwright diinstal ulang tiap run tanpa cache.
- **README:** caption gambar menyebut "Preview desktop" padahal yang ditampilkan adalah `header.svg`, bukan tangkapan layar; frasa "Lihat `pages.yml` jika aktif" sudah basi; klaim header "menghormati `prefers-reduced-motion`" hanya berlaku untuk animasi CSS — 2 animasi **SMIL** (`<animate>`, `<animateTransform>`) di `header.svg` tetap berjalan. Nama proyek "cal**e**nder" adalah ejaan tidak baku dari "calendar" — jika bukan kesengajaan merek, ini merugikan pencarian/SEO.
- **Konfigurasi sandbox ikut tercommit:** `vite.config.js` memuat `allowedHosts: ['.e2b.app']` khusus lingkungan Arena (tidak berbahaya, hanya dev-server, tapi sebaiknya didokumentasikan/dirapikan).
- **Komentar salah tempat:** `vite.config.js:1` — `// vite.config.js yang benar` (sisa iterasi). `.gitignore` belum mencakup `.DS_Store`/folder editor. Ikon PNG terverifikasi benar 192×192 & 512×512 ✅.

---

## ✅ Yang sudah sangat baik (pertahankan)

1. **Keamanan XSS:** semua data pengguna (judul, catatan, ID agenda) melewati `escapeHTML` sebelum `innerHTML` — terverifikasi di 6 titik render; test browser bahkan membuktikan `<script>` di catatan tidak tereksekusi.
2. **Logika tanggal anti-bug:** `parseDate` memakai jam 12:00 lokal (imun geser hari UTC/DST), grid Senin-pertama 42 sel, batas 1900–2100 konsisten di semua kontrol. 56 ID yang dirujuk JS — semuanya ada di HTML.
3. **ICS berkualitas:** escaping `\\`, `,`, `;`, newline sesuai urutan yang benar dan _folding_ 75-oktet yang aman UTF-8 (diuji dengan emoji 🌿×40).
4. **Data libur jujur & akurat:** cocok dengan SKB 3 Menteri 2026 (17 hari); tahun lain diberi disclaimer eksplisit "Bukan daftar lengkap" alih-alih mengarang tanggal lunar.
5. **Privasi:** tanpa backend, tanpa akun, tanpa analitik/tracker, tanpa secret; data hanya di `localStorage` dengan `try/catch` kuota (kegagalan simpan tidak merusak state — pola tulis-lalu-commit yang benar di handler agenda).
6. **Notifikasi dirancang benar secara konsep:** `requestPermission` di dalam _user gesture_, `showNotification` via service worker, timeout 8 detik, status izin transparan, panduan iOS yang benar.
7. **Hasil verifikasi saat audit:** `npm test` **8/8 lolos**, `npm audit` **0 kerentanan**, build root & mode Pages sama-sama sukses (JS 31,3 KB/10,2 KB gzip; CSS 34,4 KB/7,5 KB gzip; total `dist` 416 KB; precache 28 resource — sesuai klaim README).

---

## 🗺️ Rencana perbaikan terprioritas

| Urutan | Aksi                                                                                                                                 | Estimasi              |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| 1      | Aktifkan GitHub Pages (Source: GitHub Actions) + pastikan Actions aktif; jalankan deploy manual; pastikan `ci.yml` terdaftar & hijau | 10 menit (pengaturan) |
| 2      | Perbaiki semua path menjadi sadar-base (`BASE_URL`, manifest relatif, precache berprefix, SW scope-relatif) + 1 test e2e subpath     | ½–1 jam               |
| 3      | Tambahkan `HOLIDAYS_2027` dari SKB terbaru                                                                                           | 15 menit              |
| 4      | Fallback `crypto.randomUUID()` untuk konteks non-aman                                                                                | 5 menit               |
| 5      | Kontras `--muted`/libur ≥4,5:1; naikkan font minimum konten ke ≥11px; area sentuh ≥40px; roving tabindex grid                        | 1–2 jam               |
| 6      | Perketat test: offline sungguhan (`context.setOffline`), notifikasi tanpa menyuntik judul, build sebelum preview                     | 1 jam                 |
| 7      | Format kode (Prettier), LICENSE MIT, Dependabot, upgrade lucide/vite bertahap, tag `v1.0.0`                                          | 1 jam                 |

**Kesimpulan:** fondasi kode axxcalender termasuk yang lebih rapi untuk proyek vanilla JS seukurannya — yang membedakannya dari "siap produksi" hanyalah tahap akhir: menyalakan Pages dan membuat PWA sadar subpath. Dua perbaikan P0 itu selesai, skor keseluruhan naik ke kisaran 80+.
