# Struktur Proyek

Proyek ini sudah memakai React + Vite. Struktur dipertahankan agar aplikasi yang sudah berjalan tidak berubah perilakunya.

```text
website_intercomp/
├── public/              # Asset statis yang diakses langsung oleh browser
├── src/
│   ├── components/      # Komponen UI reusable
│   ├── data/            # Data statis aplikasi
│   ├── pages/           # Halaman utama aplikasi
│   ├── styles/          # Global stylesheet
│   ├── App.jsx          # Root flow aplikasi
│   └── main.jsx         # Entry point React
├── .env.example         # Contoh environment variable
├── Dockerfile           # Build production image
├── compose.yaml         # Jalankan container dengan Docker Compose
├── nginx.conf           # Konfigurasi SPA fallback untuk production
├── index.html           # HTML entry Vite
├── package.json         # Script dan dependency
└── vite.config.js       # Konfigurasi Vite
```

## Catatan Struktur

- `src/pages` dipakai untuk layar penuh seperti login, setup role, dan dashboard.
- `src/components` dipakai untuk bagian UI yang bisa dipakai ulang.
- `src/data` dipakai untuk data statis agar tidak bercampur dengan komponen.
- `public/assets` dipakai untuk gambar yang tidak perlu diproses bundler Vite.
- `dist` dan `node_modules` tidak perlu masuk repository.

## Environment

Gunakan `.env.example` sebagai template:

```powershell
Copy-Item .env.example .env
```

Vite hanya mengekspos variable dengan prefix `VITE_` ke frontend.

## Docker

Build dan jalankan:

```powershell
docker compose up --build
```

Default port host adalah `8080`. Untuk mengganti:

```powershell
$env:APP_PORT=3000
docker compose up --build
```
