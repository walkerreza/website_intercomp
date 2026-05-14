# Questify

Website lomba Intercomp berbasis React + Vite.

## Menjalankan Lokal

```powershell
npm install
npm run dev
```

## Build Production

```powershell
npm run build
npm run preview
```

## Environment

Contoh variable ada di `.env.example`.

```powershell
Copy-Item .env.example .env
```

Untuk Supabase Auth dan Google OAuth, lihat `docs/SUPABASE_SETUP.md`.

## Docker

```powershell
docker compose up --build
```

Default aplikasi berjalan di `http://localhost:8080`.

## Struktur

Lihat `docs/PROJECT_STRUCTURE.md` untuk susunan folder dan fungsi tiap bagian.
