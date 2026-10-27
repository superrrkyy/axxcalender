# Berkontribusi ke axxcalender

Terima kasih sudah ingin membantu! 🌱

## Menyiapkan lingkungan

Node.js 22 (lihat `.nvmrc`).

```bash
npm ci
npm run dev
```

## Sebelum membuka pull request

```bash
npm run format   # Prettier
npm run lint     # ESLint
npm test         # unit test
npm run build    # build + precache PWA
npm run test:e2e # browser test (Playwright, Chromium)
```

CI menjalankan semua langkah di atas; PR diharapkan hijau sebelum digabung.

## Memperbarui hari libur

Data libur ada di `src/calendar.js` (`HOLIDAYS_2026`, `HOLIDAYS_2027`, …).
Setiap tahun, tambahkan dataset tahun berikutnya dari SKB 3 Menteri terbaru
(referensi: [Kemenko PMK](https://www.kemenkopmk.go.id/)), daftarkan di
`HOLIDAY_DATA`, lalu sesuaikan jumlah hari pada test terkait.
