# Setup Supabase

Integrasi saat ini memakai Supabase Auth untuk:

- Login email dan password
- Register email dan password
- Login Google OAuth
- Restore session setelah redirect OAuth
- Logout dari Supabase

Role user aplikasi masih disimpan di `localStorage` agar flow yang sudah berjalan tidak berubah. Jika nanti ingin full database, role bisa dipindah ke tabel `profiles`.

Migration Supabase sudah tersedia untuk membuat tabel:

- `public.characters`: master data class/role karakter.
- `public.users`: profil user aplikasi yang terhubung ke `auth.users`.

Nama tabel dibuat plural karena `user` dan `character` berpotensi bentrok dengan keyword/type SQL.

## 1. Buat Project Supabase

1. Buka Supabase dan buat project baru.
2. Ambil `Project URL` dan `anon public key`.
3. Copy `.env.example` menjadi `.env`.
4. Isi variable berikut:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Restart dev server setelah mengubah `.env`.

## 2. Email Password Auth

Di Supabase Dashboard:

```text
Authentication -> Providers -> Email
```

Aktifkan email provider. Jika ingin register langsung bisa login tanpa verifikasi email, nonaktifkan email confirmation untuk kebutuhan demo.

## 3. Google OAuth

Di Google Cloud Console:

1. Buat OAuth Client ID dengan tipe `Web application`.
2. Tambahkan Authorized redirect URI:

```text
https://your-project-id.supabase.co/auth/v1/callback
```

Di Supabase Dashboard:

```text
Authentication -> Providers -> Google
```

Masukkan Google `Client ID` dan `Client Secret`.

## 4. Redirect URL

Di Supabase Dashboard:

```text
Authentication -> URL Configuration
```

Set `Site URL`:

```text
http://localhost:5173
```

Tambahkan redirect URL production nanti:

```text
https://domain-kamu.com
```

## 5. Menjalankan Lokal

```powershell
npm run dev
```

Login Google akan mengarah ke Google lalu kembali ke origin aplikasi.

## 6. Apply Database Migration

Jika project Supabase sudah di-link:

```powershell
npx supabase db push
```

Migration ini juga mengaktifkan RLS, membuat policy dasar, seed data karakter, dan trigger untuk otomatis membuat row `public.users` saat user baru register lewat Supabase Auth.
