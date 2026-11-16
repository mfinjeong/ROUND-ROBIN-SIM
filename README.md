# Putar SO

Simulator interaktif untuk mempelajari penjadwalan CPU **Round Robin** pada mata kuliah Sistem Operasi. Amati proses tiba, mengantre, mendapat giliran CPU, mengalami preempsi, dan selesai—tanpa kuis atau skor.

## Menjalankan proyek

Persyaratan: Node.js 20 atau lebih baru dan npm.

```bash
npm install
npm run dev
```

Buka alamat yang ditampilkan Next.js (biasanya <http://localhost:3000>).

## Halaman

- `/` — pengantar enam adegan dengan analogi komidi putar.
- `/simulator` — editor proses, kendali pemutaran, panggung, Gantt chart, narasi, dan metrik.
- `/lab` — perbandingan quantum dan skenario bawaan.
- `/aturan` — konvensi algoritma, rumus, dan contoh acuan.
- `/tentang` — informasi proyek serta kredit dan lisensi aset.

Navigasi utama tersedia pada setiap halaman.

## Kendali simulator

- **Putar/Jeda**, **Langkah maju/mundur**, **Ulang**, serta penggeser garis waktu.
- Kecepatan **0,5×, 1×, 2×, dan 4×**.
- Pintasan saat fokus tidak berada pada kontrol formulir: `Spasi` untuk putar/jeda, `←`/`→` untuk langkah, `R` untuk ulang.
- Konfigurasi: 1–8 proses, arrival time 0–30, burst time 1–20, quantum 1–10, biaya context switch 0–2, dan dua konvensi aturan seri.

## Mesin simulasi

Mesin Round Robin murni berada di `lib/scheduler/`. Mesin menghitung daftar peristiwa, Gantt chart, metrik, dan snapshot per satuan waktu. Simulator dan Laboratorium Quantum menggunakan mesin yang sama. State pemutaran bersama berada di `lib/playback.ts`.

Konvensi bawaan untuk waktu seri: proses yang baru tiba dimasukkan ke antrean sebelum proses yang di-preempt. Pilihan konvensi sebaliknya tersedia di simulator.

## Pemeriksaan

```bash
npm test             # unit test Vitest
npm run test:e2e      # uji browser Playwright
npm run lint          # pemeriksaan TypeScript
npm run build         # build produksi Next.js
npm run audit:bundle  # perkiraan ukuran JavaScript awal ter-gzip
npm run audit:runtime # audit LCP dalam browser dengan jaringan/CPU simulasi
```

Uji browser menggunakan Microsoft Edge yang terpasang. Kriteria penerimaan dan bukti pengujiannya dipelihara dalam spesifikasi proyek.

## Aset dan lisensi

Ilustrasi proses, CPU, antrean, dan pengantar dibuat sebagai SVG inline di kode proyek; tidak menggunakan aset generatif AI. Kredit aset pihak ketiga dicatat di `ASSETS.md` pada workspace pengembangan. Informasi kredit yang dipakai aplikasi berada di `lib/assets.ts`, sehingga build aplikasi tidak bergantung pada berkas Markdown. Pemberitahuan lisensi tersedia di `THIRD_PARTY_NOTICES.md` pada workspace pengembangan dan dalam paket dependensi terkait.

## Teknologi

Next.js App Router, TypeScript, Tailwind CSS, komponen bergaya shadcn/ui, Lucide, Recharts, Vitest, Playwright, dan axe-core.
