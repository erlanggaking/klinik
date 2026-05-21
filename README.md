# Klinik Cantik — Aplikasi Manajemen Klinik Kecantikan

Aplikasi end-to-end untuk klinik kecantikan dengan modul **Front Office, Medical, Operasional, Financial, CRM & Marketing**, plus **KPI Dashboard** dan **Patient Portal**. Dibangun dengan **Next.js 14 (App Router)**, **TypeScript**, **Prisma + PostgreSQL**, **NextAuth (Credentials + Argon2)**, **Tailwind**, dan komponen UI custom.

> **Status build:** ✅ 67 routes, build passed. ✅ TypeScript strict passed. ✅ All modules wired end-to-end.

---

## Daftar Isi

1. [Flow Pasien End-to-End](#flow-pasien-end-to-end)
2. [Daftar Modul & Fitur](#daftar-modul--fitur)
3. [Daftar Halaman / Route](#daftar-halaman--route)
4. [Role & Permission Matrix](#role--permission-matrix)
5. [Tech Stack & Library](#tech-stack--library)
6. [Struktur Database](#struktur-database)
7. [Setup & Instalasi](#setup--instalasi)
8. [Login Default](#login-default-dari-seed)
9. [Konfigurasi Env](#konfigurasi-env)
10. [CRM Cron & Background Job](#crm-cron--background-job)
11. [Build & Deploy](#build--deploy)
12. [Troubleshooting](#troubleshooting)

---

## Flow Pasien End-to-End

Flow ini terimplementasi penuh, setiap arrow di bawah ada di kode dengan trigger nyata (server action / state machine antrian / billing engine / cron).

```
┌──────────────────────────────────────────────────────────────┐
│  1. Pasien Booking (publik, tanpa login)                     │
│     /booking → isi nama, telp, treatment, slot                │
│     ↓ buat Lead + Patient (jika baru) + Appointment SCHEDULED │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  2. Check-in Receptionist                                    │
│     /appointment → tombol Check-in                            │
│     ↓ Appointment.status = CHECKED_IN                         │
│     ↓ Generate QueueTicket nomor antrian (A-001 ...)          │
│     ↓ Stage: WAITING_DOCTOR                                   │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  3. Konsultasi Dokter (state machine antrian)                │
│     /antrian → Dokter klik "Panggil" pasien berikutnya        │
│     ↓ Stage: IN_CONSULT, status: CALLED → IN_PROGRESS         │
│     ↓ /rekam-medis/baru auto-prefilled patient & MR baru      │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  4. Input Rekam Medis (SOAP + ICD-10)                        │
│     /rekam-medis/[id]                                         │
│     • Subjective, Objective, Assessment, Plan                 │
│     • Vital signs (TD, nadi, suhu, BB)                        │
│     • Diagnosa (autocomplete ICD-10 dari API)                 │
│     • Attachment (lampiran lab, foto referensi)               │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  5. Treatment Recommendation                                 │
│     • Pilih treatment dari katalog                            │
│     • Auto-cek paket aktif pasien (PatientPackage)            │
│     • Auto-cek membership tier (Silver/Gold/Platinum diskon)  │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  6. Treatment Therapist                                      │
│     /antrian: Stage berpindah WAITING_THERAPIST → IN_TREATMENT│
│     • Therapist perform tindakan, isi outcome                 │
│       (SUCCESS / PARTIAL / FAILED / FOLLOWUP_NEEDED)          │
│     • Auto-deduct consumables (FEFO: First-Expiry-First-Out)  │
│     • Catat batch yang dipakai (StockLedger)                  │
│     • Upload Before-After Photo                               │
│       - Watermark otomatis (sharp)                            │
│       - Consent + Signature Pad                               │
│       - Signed URL akses + audit log                          │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  7. Resep / Skincare                                         │
│     • Prescription Builder (cari obat dari InventoryItem)     │
│     • Drug interaction warning (lib/drug-db.ts):              │
│       - Cek kombinasi obat                                    │
│       - Cek alergi pasien (Patient.knownAllergies)            │
│       - Cek kontraindikasi (kehamilan dll)                    │
│     • Generate PDF resep dengan kop klinik                    │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  8. Close Visit → Auto-build Invoice                         │
│     /rekam-medis/[id] → tombol "Tutup Kunjungan"              │
│     ↓ lib/billing.ts buildInvoiceForVisit():                  │
│       a. Treatment items (qty × harga)                        │
│       b. Resep (drug + skincare)                              │
│       c. Apply Promo (manual code / auto happy hour)          │
│       d. Apply Paket (PatientPackageUsage decrement)          │
│       e. Apply Membership tier discount                       │
│       f. Apply Deposit (jika ada saldo)                       │
│       g. PPN (jika di-set)                                    │
│     ↓ Antrian → Stage: WAITING_CASHIER                        │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  9. Pembayaran Kasir                                         │
│     /kasir/[id]                                               │
│     • Multi-payment: Cash / Debit / Credit / QRIS / Transfer  │
│       / Voucher / Deposit                                     │
│     • Partial payment didukung (status PARTIALLY_PAID)        │
│     • Cash entry otomatis ke akun kas                         │
│     • Generate PDF invoice                                    │
│     • Saat fully paid:                                        │
│       - Loyalty points earn (1 poin / 1.000 IDR)              │
│       - QueueTicket → DONE, Appointment → COMPLETED           │
│       - Trigger CRM follow-up tasks                           │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  10. CRM Follow-Up Otomatis                                  │
│     POST /api/cron (dijalankan eksternal H-1 setiap hari):    │
│     • Reminder appointment H-1 via WhatsApp                   │
│     • Follow-up post-treatment +24 jam ("apa kabar setelah    │
│       treatment?")                                            │
│     • Follow-up paket expiring (kurang dari 14 hari)          │
│     • Birthday wish + voucher otomatis                        │
│     • Re-engagement pasien tidak datang >90 hari              │
│     • Kirim outbox WA pending (queue-based)                   │
└──────────────────────────────────────────────────────────────┘
```

---

## Daftar Modul & Fitur

### 🏥 Front Office

| Fitur | Detail |
|-------|--------|
| **Appointment** | List harian, kalender bulanan (`/appointment/calendar`), form booking dengan slot picker, validasi double-booking dokter, status pipeline (SCHEDULED → CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED → CANCELLED) |
| **Check-in** | Tombol di list appointment → otomatis generate nomor antrian harian, set stage WAITING_DOCTOR |
| **Registrasi Pasien** | MRN auto-generate (format MR-YYYY-NNNNN), data demografi lengkap, alergi (knownAllergies), riwayat penyakit, foto KTP, kontak darurat, sumber referral |
| **Search & Detail Pasien** | List dengan search by nama/MRN/telp, detail page dengan riwayat lengkap (appointment, MR, treatment, invoice, foto) |
| **Antrian** | State machine multi-stage: WAITING_DOCTOR → IN_CONSULT → WAITING_THERAPIST → IN_TREATMENT → WAITING_CASHIER → DONE. Action: panggil/skip/no-show |
| **Antrian Display TV** | Halaman publik `/antrian/display` (no auth), full-screen, auto-refresh 5 detik. Cocok ditaruh di layar tunggu |
| **Membership** | 3 tier (Silver/Gold/Platinum), auto-apply diskon di kasir, ledger transaksi member |

### 🩺 Medical

| Fitur | Detail |
|-------|--------|
| **Rekam Medis** | SOAP (Subjective/Objective/Assessment/Plan), vital signs, attachment, riwayat kunjungan kronologis |
| **ICD-10 Autocomplete** | Komponen `<Icd10Search>` dengan API `/api/icd10`, dataset disediakan di `lib/icd10.ts` (bisa ditambah) |
| **Diagnosa** | List & search diagnosa lintas pasien |
| **Treatment** | Perform tindakan dengan outcome, link ke MR & paket pasien (PatientPackageUsage), auto-deduct consumables FEFO |
| **Before-After Photo** | Upload multi-foto, watermark otomatis (sharp + nama klinik + tanggal), kategori (BEFORE/AFTER/PROGRESS), area (FACE_FRONT, FACE_LEFT, BACK, dll), signed URL berbatas waktu, audit log akses (`PhotoAccessLog`), flag publishable untuk marketing |
| **Consent + Signature Pad** | Sebelum upload foto, pasien ttd di tablet/HP, signature image disimpan + linked ke `BeforeAfterPhoto.consentId` |
| **Resep** | Builder dengan auto-suggest dari `InventoryItem` tipe DRUG/SKINCARE, dosis & sig (signa) per item |
| **Drug Warning** | Komponen `<DrugWarnings>` cek otomatis: interaksi antar obat, alergi pasien, peringatan ibu hamil/menyusui |
| **PDF Resep** | `/api/pdf/prescription/[id]` generate dengan kop klinik (data dari Settings) |

### 📦 Operasional

| Fitur | Detail |
|-------|--------|
| **Farmasi** | Dispense per resep, scan/pilih batch, auto-update stok |
| **Inventory** | Multi-tipe (DRUG/SKINCARE/CONSUMABLE/EQUIPMENT), kategori, batch tracking dengan expiry, reorder point alert |
| **Stock Opname** | Workflow multi-step: DRAFT → IN_PROGRESS → SUBMITTED → APPROVED, worksheet dengan input fisik vs sistem, otomatis adjust StockLedger saat approved |
| **Purchase Order** | DRAFT → APPROVED → SENT → PARTIALLY_RECEIVED → RECEIVED, multi-supplier, tracking lead time |
| **Consumables** | Subset Inventory tipe CONSUMABLE, auto-deduct saat treatment via `PerformTreatmentForm` |
| **Supplier** | Master supplier + contact + lead time (untuk reorder otomatis) |

### 💰 Financial

| Fitur | Detail |
|-------|--------|
| **Kasir** | Multi-payment method (CASH/DEBIT/CREDIT/QRIS/TRANSFER/VOUCHER/DEPOSIT), partial payment, retail walk-in (`/kasir/baru` untuk jual produk tanpa MR) |
| **Invoice** | Auto-build via `lib/billing.ts buildInvoiceForVisit()`, kode invoice INV-YYYYMM-NNNN, PDF download |
| **Paket Treatment** | Builder multi-treatment dengan jumlah sesi & masa berlaku, redeem otomatis di kasir saat treatment cocok |
| **Deposit (Kas)** | Multi cash account, kas masuk (REVENUE) & kas keluar (EXPENSE), kategori (RENT, UTILITIES, SUPPLIES, dll) |
| **Expense Entry** | Form transaksi keluar dengan reference + nota |
| **Laporan** | Summary card (revenue MTD/YTD, expense, treatment count, repeat visits), export Excel multi-sheet (Pendapatan, Treatment, Inventory, Pasien) via `/api/reports/excel` |

### 📢 CRM & Marketing

| Fitur | Detail |
|-------|--------|
| **WhatsApp** | `MessageOutbox` (queue), `MessageTemplate` (template terparam), blast manual via dialog, reminder otomatis via cron. Adapter di `lib/whatsapp.ts` siap di-swap ke Fonnte/Wablas/WA Cloud API |
| **Promo** | Voucher kode + auto-apply rules: happy hour (jam tertentu), day-of-week (Senin diskon), birthday voucher, kategori treatment, max uses (total & per pasien), periode aktif |
| **Loyalty** | Earn 1 poin per 1.000 IDR (configurable), redeem ke voucher, tier bonus, ledger lengkap (`LoyaltyLedger`) |
| **Follow Up** | Task otomatis: post-treatment 24 jam, paket hampir expired, pasien dormant 90 hari, birthday wish |

### 📊 KPI Dashboard (`/dashboard`)

| Metrik | Detail |
|--------|--------|
| **Revenue** | Today, MTD, YTD, dengan chart 30 hari (recharts) |
| **Daily Patients** | Jumlah pasien check-in hari ini |
| **Top Treatments** | Top 5 treatment by revenue & count (bulan berjalan) |
| **Best-Selling Skincare** | Top 5 produk skincare retail |
| **Doctor Performance** | Per dokter: jumlah pasien, treatment, revenue, rating outcome |
| **Stock Alerts** | Item di bawah reorder point + item expiring < 30 hari |

### ⚙️ Pengaturan (`/settings`)

| Sub-page | Detail |
|----------|--------|
| **Pengguna** | CRUD user, assign role, reset password (Argon2), aktif/non-aktif toggle |
| **Role & Permission** | Editor checkbox grid untuk 60+ permission per role, system role tidak bisa dihapus |
| **Audit Log** | Trail semua aksi sensitif (login, akses foto, edit MR, dispense obat, hapus data) |
| **Info Klinik** | Nama, alamat, telp, email, NPWP, no izin — dipakai di header PDF |
| **Template Pesan** | Daftar template WA/email dengan variabel `{{patientName}}`, `{{appointmentTime}}`, `{{doctorName}}`, dll |

### 👤 Patient Portal (`/portal`)

Login pasien tanpa user account: hanya **no telp + tgl lahir**. Pasien bisa lihat:
- Appointment mendatang & history
- Treatment history dengan outcome
- Foto Before-After miliknya (dengan signed URL)
- Promo aktif yang bisa di-redeem
- Saldo loyalty points & tier membership

### 🌐 Public Booking (`/booking`)

Form publik tanpa login: nama, no telp, treatment yang diminati, tanggal, slot waktu. Backend otomatis:
1. Cek apakah no telp sudah ada Patient → reuse, atau buat Lead baru
2. Buat Appointment status SCHEDULED
3. Kirim WA konfirmasi (via outbox)
4. Notifikasi receptionist dashboard

### 🔍 Global Search (Cmd+K)

Tombol topbar atau shortcut **Cmd+K / Ctrl+K**. Search lintas: pasien, appointment, invoice, treatment, supplier. Hasil keyboard-navigable, klik untuk jump.

### 🌗 Dark Mode & i18n

- **Dark mode** via `next-themes`, toggle di topbar, persist di localStorage
- **Locale** ID/EN, toggle di topbar, persist di cookie. Translation di `lib/i18n.ts`

---

## Daftar Halaman / Route

Total **67 routes** (build verified).

### App pages (auth required)
```
/                        → redirect ke /dashboard atau /login
/dashboard               → KPI dashboard
/forbidden               → 403 page

Front Office:
/appointment             /appointment/baru           /appointment/calendar
/pasien                  /pasien/baru                /pasien/[id]
/antrian                 /membership

Medical:
/rekam-medis             /rekam-medis/baru           /rekam-medis/[id]
/diagnosa                /treatment                  /resep
/foto

Operasional:
/farmasi                 /inventory                  /inventory/baru
/inventory/opname        /inventory/opname/baru      /inventory/opname/[id]
/inventory/po            /inventory/po/baru          /inventory/po/[id]
/consumables             /supplier                   /supplier/baru

Financial:
/kasir                   /kasir/baru                 /kasir/[id]
/invoice                 /paket                      /paket/baru
/deposit                 /deposit/akun-baru          /deposit/transaksi-baru
/laporan

CRM & Marketing:
/wa                      /promo                      /promo/baru
/loyalty                 /followup

Settings:
/settings                /settings/users             /settings/users/baru
/settings/roles          /settings/audit             /settings/clinic
/settings/templates
```

### Public routes (no auth)
```
/login                   /booking
/portal                  /portal/login
/antrian/display
```

### API routes
```
/api/auth/[...nextauth]           NextAuth
/api/cron                         CRM background job (header x-cron-secret)
/api/files/[...key]               Signed file URL serving
/api/icd10?q=...                  ICD-10 autocomplete
/api/pdf/invoice/[id]             PDF invoice
/api/pdf/prescription/[id]        PDF resep
/api/photos/upload                Upload foto + watermark
/api/photos/[id]/url              Signed URL foto
/api/reports/excel?type=...       Export Excel multi-sheet
```

---

## Role & Permission Matrix

5 role default (bisa ditambah & permission di-edit lewat `/settings/roles`):

| Role | Hak Akses |
|------|-----------|
| **ADMIN** | Semua permission (60+) |
| **DOKTER** | MR write, treatment perform, prescription write, pasien read |
| **THERAPIST** | Treatment perform, foto upload, queue advance |
| **RESEPSIONIS** | Patient write, appointment write, queue manage, kasir operate |
| **KASIR** | Invoice read, payment record, deposit write, retail invoice create |

Permission code (sample): `dashboard.read`, `patient.read/write`, `appointment.read/write`, `medical_record.read/write`, `treatment.perform`, `photo.read/upload`, `prescription.read/write`, `pharmacy.dispense`, `inventory.read/write`, `kasir.operate`, `invoice.read`, `report.read`, `promo.read/write`, `message.send`, `settings.read/write`, dll.

Lihat `src/lib/rbac.ts` untuk daftar lengkap.

---

## Tech Stack & Library

### Runtime
- **Next.js 14.2** App Router, Server Components, Server Actions
- **TypeScript 5** strict mode
- **Node 18+**

### Database & Auth
- **Prisma 5** + **PostgreSQL** (47 model)
- **NextAuth (Credentials)** + **Argon2** password hashing
- RBAC custom dengan permission matrix di `lib/rbac.ts`

### UI
- **Tailwind CSS** + komponen UI custom (Card, Table, Dialog, Badge, Cmdk, dll)
- **lucide-react** untuk ikon
- **next-themes** untuk dark mode
- **recharts** untuk chart dashboard

### Domain features
- **@react-pdf/renderer** — PDF resep & invoice
- **sharp** — watermark foto server-side
- **xlsx** — export laporan multi-sheet
- **zod** — validasi server actions
- **date-fns** — format tanggal
- **react-signature-canvas** — signature pad consent

### Adapter siap-swap
- WhatsApp: `lib/whatsapp.ts` (dummy → Fonnte/Wablas/WA Cloud API)
- Email: `lib/email.ts` (dummy → SendGrid/Mailgun/SMTP)
- Payment gateway: `lib/payment-gateway.ts` (dummy → Midtrans/Xendit untuk QRIS dinamis)
- Storage: `lib/storage.ts` (local FS → S3-compatible siap)

---

## Struktur Database

47 model Prisma, di-grouping ke domain berikut. Lihat `prisma/schema.prisma` untuk detail.

```
Auth & RBAC:
  User, StaffProfile, Role, Permission, RolePermission, AuditLog, Session

Patient:
  Patient, Lead, MembershipTier, PatientMembership, ConsentSignature

Appointment & Queue:
  Appointment, QueueTicket

Medical:
  MedicalRecord, Diagnosis, TreatmentItem, Prescription, PrescriptionItem,
  BeforeAfterPhoto, PhotoAccessLog, FaceMapping

Treatment Catalog:
  Treatment, TreatmentCategory, TreatmentPackage, TreatmentPackageItem,
  PatientPackage, PatientPackageUsage

Inventory:
  InventoryItem, InventoryCategory, InventoryBatch, StockLedger,
  StockOpname, StockOpnameItem, PurchaseOrder, PurchaseOrderItem, Supplier

Financial:
  Invoice, InvoiceItem, Payment, CashAccount, CashEntry, DepositAccount,
  DepositTransaction

CRM & Marketing:
  Promo, PromoUsage, LoyaltyLedger, FollowUpTask, MessageTemplate, MessageOutbox

System:
  Setting
```

---

## Setup & Instalasi

### Prasyarat
- Node 18+
- PostgreSQL 14+
- Yarn / npm / pnpm (dokumentasi pakai `npm`)

### Langkah

```bash
# 1. Clone & install
git clone <repo> klinik && cd klinik
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env, isi DATABASE_URL, NEXTAUTH_SECRET, dll (lihat section Konfigurasi Env)

# 3. Generate Prisma client
npx prisma generate

# 4. Push schema ke DB (untuk dev). Untuk prod pakai migrate.
npx prisma db push

# 5. Seed data awal (role, permission, treatment catalog, dummy pasien, admin)
npm run db:seed

# 6. Jalankan dev server
npm run dev
```

Buka http://localhost:3000 → login dengan akun di section berikutnya.

---

## Login Default (dari seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@klinik.id` | `admin123` |
| Owner | `owner@klinik.id` | `klinik123` |
| Resepsionis | `resepsionis@klinik.id` | `klinik123` |
| Dokter (Amelia) | `dr.amelia@klinik.id` | `klinik123` |
| Dokter (Budi) | `dr.budi@klinik.id` | `klinik123` |
| Therapist 1 | `therapist1@klinik.id` | `klinik123` |
| Therapist 2 | `therapist2@klinik.id` | `klinik123` |
| Kasir | `kasir@klinik.id` | `klinik123` |
| Apoteker | `farmasi@klinik.id` | `klinik123` |

> ⚠️ **Wajib ganti** semua password ini sebelum produksi. Bisa via `/settings/users` atau langsung edit DB.

---

## Konfigurasi Env

Lihat `.env.example` untuk daftar lengkap. Yang wajib:

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/klinik"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate dengan: openssl rand -base64 32"

# File storage (local untuk dev, ganti S3 di prod)
STORAGE_DIR="./storage"
STORAGE_BASE_URL="/api/files"

# CRM Cron (header x-cron-secret untuk POST /api/cron)
CRON_SECRET="generate-string-acak-panjang"

# Klinik defaults (juga bisa diatur di /settings/clinic)
CLINIC_NAME="Klinik Cantik"

# Optional integrations (kalau diaktifkan)
WA_PROVIDER="dummy"          # atau "fonnte", "wablas", "wa-cloud"
WA_API_KEY=""
EMAIL_PROVIDER="dummy"       # atau "smtp", "sendgrid"
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
PAYMENT_GATEWAY="dummy"      # atau "midtrans", "xendit"
PAYMENT_API_KEY=""
```

---

## CRM Cron & Background Job

Endpoint: `POST /api/cron` dengan header `x-cron-secret: <CRON_SECRET>`.

Yang dilakukan saat di-trigger:
1. **Reminder Appointment H-1** — kirim WA semua appointment besok yang status SCHEDULED/CONFIRMED
2. **Follow-up post-treatment +24 jam** — buat task & kirim WA untuk treatment yang selesai 24 jam lalu
3. **Paket expiring** — notif pasien dengan paket aktif sisa < 14 hari masa berlaku
4. **Birthday wish** — kirim WA pasien yang ulang tahun hari ini + voucher otomatis
5. **Re-engagement dormant** — pasien tidak datang > 90 hari, kirim "kangen" + diskon
6. **Process MessageOutbox** — kirim semua pesan status PENDING ke provider WA

### Setup cron eksternal

**Vercel Cron** (`vercel.json`):
```json
{
  "crons": [{ "path": "/api/cron", "schedule": "0 2 * * *" }]
}
```

**System cron** (Linux/macOS):
```bash
# Setiap hari jam 09:00
0 9 * * * curl -X POST -H "x-cron-secret: $CRON_SECRET" https://yourapp.com/api/cron
```

**GitHub Actions** atau service eksternal seperti **EasyCron** / **cron-job.org** juga bisa.

---

## Build & Deploy

### Build production

```bash
npm run build      # 67 routes, build passed (~30 detik)
npm start          # production server
```

### Migrasi database production

```bash
# Jangan pakai `db push` di prod. Pakai migrate.
npx prisma migrate deploy
```

### Deploy options

| Platform | Note |
|----------|------|
| **Vercel** | Native Next.js, set env, connect Postgres (Neon/Supabase/RDS), pasang Vercel Cron |
| **Self-hosted (VPS)** | `pm2 start npm --name klinik -- start`, reverse proxy via Nginx, system cron untuk `/api/cron` |
| **Docker** | Build image, gunakan `Dockerfile` standar Next.js, mount volume untuk `STORAGE_DIR` |

---

## Troubleshooting

### Database
- **`prisma generate` error**: pastikan `DATABASE_URL` valid; coba `npx prisma db push --force-reset` untuk dev (HATI-HATI: hapus data).
- **Migration drift**: jangan campur `db push` & `migrate deploy`. Pilih satu strategi konsisten.

### Foto upload
- Watermark gagal: pastikan `sharp` ter-install (`npm rebuild sharp` jika lintas OS).
- Foto tidak muncul: cek `STORAGE_DIR` writeable dan path di `BeforeAfterPhoto.storageKey` valid.

### PDF generation
- **`@react-pdf/renderer` error di runtime**: pastikan tidak di-import dari client component. Generate hanya di route handler (`/api/pdf/...`).

### NextAuth
- **`NEXTAUTH_SECRET` missing**: WAJIB di-set, tanpa ini login tidak jalan.
- **Login redirect loop**: cek `NEXTAUTH_URL` sama dengan host yang di-akses.
- **`JWT_SESSION_ERROR decryption operation failed`**: Cookie session di-encrypt pakai `NEXTAUTH_SECRET`. Kalau secret diganti (mis. setelah copy `.env.example` baru), cookie lama tidak bisa di-decrypt. Solusi: hapus cookie `next-auth.session-token` di browser (DevTools → Application → Cookies), atau buka incognito/private window.
- **`Can't reach database server at localhost:5432`**: Postgres belum jalan. Start dengan `brew services start postgresql@16` (macOS) atau `sudo systemctl start postgresql` (Linux), atau pakai Docker `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=klinik -e POSTGRES_DB=klinik postgres:16`.

### Cron tidak jalan
- Cek header `x-cron-secret` cocok dengan env `CRON_SECRET`.
- Cek log `MessageOutbox` apakah ada record status PENDING.

---

## Lisensi & Kontak

Proyek internal untuk operasional klinik. Untuk kustomisasi lanjutan (integrasi PJSP, BPJS, SIRS, dll) silakan extend modul terkait — semua adapter sudah siap di-swap.
