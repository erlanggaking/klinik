# Deploy ke Vercel — Step by Step

Panduan deploy aplikasi Klinik Cantik ke Vercel dengan database Postgres gratis dari Neon.

## Bagian 1 — Setup Database di Neon (gratis)

1. Buka **https://neon.tech** dan sign up (bisa pakai akun GitHub)
2. Klik **"Create Project"**:
   - Project name: `klinik`
   - Region: **AWS Singapore (ap-southeast-1)** — paling dekat dari Indonesia
   - Postgres version: 16
3. Setelah project dibuat, klik **"Connection Details"** atau **"Dashboard"**
4. Pilih connection string mode **"Pooled connection"** (penting untuk Vercel serverless)
5. Copy **DATABASE_URL** — formatnya kira-kira:
   ```
   postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/klinik?sslmode=require
   ```
6. Simpan dulu di notepad/text editor — akan dipakai di Vercel

## Bagian 2 — Push Prisma Schema ke Neon

Dari laptop lokal, push schema dan seed data ke Neon (sekali aja):

```bash
# 1. Set DATABASE_URL ke Neon (jangan ubah .env lokal — pakai env temporary)
export DATABASE_URL="postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/klinik?sslmode=require"

# 2. Push schema
npx prisma db push

# 3. Seed data awal (role, permission, treatment, dll)
npm run db:seed
```

Output seed harus muncul:
```
✅ Seed selesai.
Akun default:
  admin@klinik.id / admin123
  ...
```

## Bagian 3 — Generate Secrets

Buka terminal, generate 2 secret:

```bash
# NEXTAUTH_SECRET (untuk JWT cookie encryption)
openssl rand -base64 32

# CRON_SECRET (untuk authenticate /api/cron)
openssl rand -hex 16
```

Simpan keduanya — akan dipakai di Vercel.

## Bagian 4 — Deploy ke Vercel

### Via Dashboard (paling gampang)

1. Buka **https://vercel.com/new**
2. Import GitHub repo `erlanggaking/klinik`
3. Framework Preset: **Next.js** (auto-detect)
4. Root Directory: **(biarkan default)**
5. **Build Command** dan **Install Command** biarkan default
6. Klik **"Environment Variables"** dan isi:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | (dari Neon di Bagian 1) |
   | `NEXTAUTH_URL` | `https://your-project.vercel.app` (kosongkan dulu, isi setelah deploy pertama) |
   | `NEXTAUTH_SECRET` | (dari Bagian 3) |
   | `CRON_SECRET` | (dari Bagian 3) |
   | `STORAGE_DRIVER` | `local` |
   | `WA_DRIVER` | `noop` |
   | `CLINIC_NAME` | `Klinik Cantik` |
   | `CLINIC_TIMEZONE` | `Asia/Jakarta` |
   | `CLINIC_CURRENCY` | `IDR` |
   | `CLINIC_LOCALE_DEFAULT` | `id` |

7. Klik **"Deploy"**
8. Tunggu 2-3 menit sampai build selesai
9. Buka URL deployment (mis. `https://klinik-xxx.vercel.app`)
10. **Update `NEXTAUTH_URL`** di Vercel Settings → Environment Variables dengan URL deployment yang asli, lalu klik **"Redeploy"**

### Via CLI (alternatif)

```bash
npm i -g vercel
vercel login
vercel
# Ikuti wizard, lalu set env via dashboard atau:
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
# dst...
vercel --prod
```

## Bagian 5 — Test

Setelah deploy berhasil:

1. Buka `https://your-app.vercel.app/demo` — halaman presentasi public
2. Klik **"Login Sekarang"** atau buka `/login`
3. Login pakai `admin@klinik.id` / `admin123`
4. Cek `/dashboard` — KPI dan data dari seed harus tampil

## Troubleshooting

### Error "Application error: a server-side exception"

Hampir selalu karena env vars belum lengkap atau database belum connect.

**Cek di Vercel:**
1. Buka project → **Logs** → **Runtime Logs**
2. Cari error message
3. Common errors:
   - `Can't reach database server` → DATABASE_URL salah atau Neon project di-pause (Neon free tier auto-pause kalau idle 5 menit, akan resume otomatis saat ada request)
   - `[next-auth] NEXTAUTH_SECRET` → set NEXTAUTH_SECRET di env vars
   - `JWT_SESSION_ERROR decryption failed` → cookie lama dari deployment sebelumnya. Buka incognito atau clear cookie.

### Database belum ada data

Kalau `/dashboard` kosong, berarti seed belum jalan. Seed manual via terminal:

```bash
export DATABASE_URL="<DATABASE_URL_NEON>"
npm run db:seed
```

### Foto upload gagal

Vercel filesystem read-only kecuali `/tmp`. Kode sudah auto-fallback ke `/tmp/uploads`, **tapi data di /tmp HILANG setiap deployment**.

Untuk produksi serius, swap storage ke S3/Vercel Blob/Cloudflare R2. Lihat `src/lib/storage.ts` — adapter sudah siap untuk diisi.

### Cron tidak jalan

Vercel Cron sudah dikonfigurasi di `vercel.json`:

```json
{ "crons": [{ "path": "/api/cron", "schedule": "0 2 * * *" }] }
```

Akan jalan setiap hari jam 02:00 UTC (= 09:00 WIB). Pastikan `CRON_SECRET` di env Vercel sudah di-set.

---

## Setup Lengkap dalam 5 Menit

```bash
# 1. Provision Neon Postgres → copy DATABASE_URL
# 2. Push schema + seed
export DATABASE_URL="..."
npx prisma db push
npm run db:seed

# 3. Generate secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
CRON_SECRET=$(openssl rand -hex 16)

# 4. Deploy via Vercel Dashboard, isi env vars di atas
# 5. Update NEXTAUTH_URL setelah dapat URL deployment
# 6. Redeploy → Done!
```
