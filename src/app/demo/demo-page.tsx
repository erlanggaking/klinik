"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  CalendarDays,
  Users,
  Stethoscope,
  ClipboardList,
  Camera,
  Pill,
  Wallet,
  MessageCircle,
  BarChart3,
  Shield,
  Zap,
  Heart,
  Crown,
  Boxes,
  Package,
  Star,
  PhoneOutgoing,
  Tag,
  PiggyBank,
  Receipt,
  FileText,
  TrendingUp,
  Lock,
  Smartphone,
  Globe,
  Eye,
  Clock,
  ChevronRight,
  Play,
  type LucideIcon,
} from "lucide-react";

// ============================================================
// DATA
// ============================================================

const STATS = [
  { value: "67", label: "Halaman Aplikasi", icon: Globe },
  { value: "6", label: "Modul Utama", icon: Boxes },
  { value: "47", label: "Database Model", icon: Boxes },
  { value: "10", label: "Step Patient Flow", icon: ChevronRight },
];

const HIGHLIGHTS = [
  { icon: Zap, title: "Otomatisasi Penuh", desc: "Dari booking publik sampai follow-up otomatis—satu sistem terintegrasi." },
  { icon: Shield, title: "Compliance-Ready", desc: "Consent foto, audit log, batch tracking, drug warning, ICD-10." },
  { icon: TrendingUp, title: "Insight Bisnis", desc: "KPI dashboard real-time: revenue, top treatment, doctor performance." },
  { icon: Heart, title: "Customer Experience", desc: "Patient portal, booking online, WhatsApp reminder, loyalty program." },
];

const ROLES = [
  { name: "Admin", email: "admin@klinik.id", password: "admin123", color: "from-rose-500 to-pink-500", icon: Shield, desc: "Akses penuh sistem" },
  { name: "Dokter", email: "dr.amelia@klinik.id", password: "klinik123", color: "from-blue-500 to-indigo-500", icon: Stethoscope, desc: "Konsultasi & rekam medis" },
  { name: "Resepsionis", email: "resepsionis@klinik.id", password: "klinik123", color: "from-amber-500 to-orange-500", icon: Users, desc: "Booking & check-in pasien" },
  { name: "Therapist", email: "therapist1@klinik.id", password: "klinik123", color: "from-purple-500 to-fuchsia-500", icon: Sparkles, desc: "Treatment & foto before-after" },
  { name: "Kasir", email: "kasir@klinik.id", password: "klinik123", color: "from-emerald-500 to-green-500", icon: Wallet, desc: "Pembayaran & invoice" },
  { name: "Apoteker", email: "farmasi@klinik.id", password: "klinik123", color: "from-cyan-500 to-teal-500", icon: Pill, desc: "Dispensing & farmasi" },
];

const MODULES: { name: string; icon: LucideIcon; color: string; gradient: string; features: string[] }[] = [
  {
    name: "Front Office",
    icon: Users,
    color: "text-pink-600",
    gradient: "from-pink-500/20 via-rose-500/15 to-pink-500/5",
    features: ["Appointment + kalender bulanan", "Check-in 1-klik & antrian otomatis", "Registrasi pasien dengan MRN auto", "Antrian multi-stage real-time", "Display antrian TV publik", "Membership tier (Silver/Gold/Platinum)"],
  },
  {
    name: "Medical",
    icon: Stethoscope,
    color: "text-purple-600",
    gradient: "from-purple-500/20 via-indigo-500/15 to-purple-500/5",
    features: ["Rekam medis SOAP + vital signs", "ICD-10 autocomplete", "Treatment outcome tracking", "Foto Before-After + watermark", "Consent + signature pad digital", "Drug interaction & alergi warning", "PDF resep dengan kop klinik"],
  },
  {
    name: "Operasional",
    icon: Boxes,
    color: "text-blue-600",
    gradient: "from-blue-500/20 via-cyan-500/15 to-blue-500/5",
    features: ["Inventory multi-tipe + batch tracking", "Auto-deduct consumables (FEFO)", "Stock opname multi-step", "Purchase order workflow", "Reorder point alerts", "Master supplier + lead time"],
  },
  {
    name: "Financial",
    icon: Wallet,
    color: "text-emerald-600",
    gradient: "from-emerald-500/20 via-green-500/15 to-emerald-500/5",
    features: ["Multi-payment (Cash/QRIS/Transfer/dll)", "Auto-build invoice dari treatment", "Paket treatment + redeem otomatis", "Manajemen kas & deposit", "Expense tracking", "Laporan + export Excel"],
  },
  {
    name: "CRM & Marketing",
    icon: MessageCircle,
    color: "text-orange-600",
    gradient: "from-orange-500/20 via-amber-500/15 to-orange-500/5",
    features: ["WhatsApp blast & template", "Reminder appointment H-1 otomatis", "Promo voucher + auto-apply rules", "Loyalty points (1pt/Rp1.000)", "Follow-up post-treatment", "Birthday & re-engagement otomatis"],
  },
  {
    name: "KPI Dashboard",
    icon: BarChart3,
    color: "text-violet-600",
    gradient: "from-violet-500/20 via-fuchsia-500/15 to-violet-500/5",
    features: ["Revenue today/MTD/YTD", "Daily patients counter", "Top 5 treatment & skincare", "Doctor performance ranking", "Stock alerts (low + expiring)", "Chart tren 30 hari"],
  },
];

const FLOW_STEPS = [
  { n: 1, title: "Pasien Booking", icon: CalendarDays, desc: "Pasien isi form publik tanpa login: nama, telp, treatment, slot waktu.", actor: "Pasien", color: "bg-pink-500" },
  { n: 2, title: "Check-in", icon: Users, desc: "Resepsionis klik tombol check-in. Sistem otomatis generate nomor antrian.", actor: "Resepsionis", color: "bg-amber-500" },
  { n: 3, title: "Konsultasi", icon: Stethoscope, desc: "Dokter panggil pasien dari antrian. MR baru auto pre-filled.", actor: "Dokter", color: "bg-blue-500" },
  { n: 4, title: "Rekam Medis", icon: ClipboardList, desc: "Input SOAP + vital signs + diagnosa ICD-10 + lampiran.", actor: "Dokter", color: "bg-indigo-500" },
  { n: 5, title: "Treatment", icon: Sparkles, desc: "Therapist perform tindakan, isi outcome, consumables auto-deduct.", actor: "Therapist", color: "bg-purple-500" },
  { n: 6, title: "Foto Before-After", icon: Camera, desc: "Upload foto dengan watermark + consent + signature digital.", actor: "Therapist", color: "bg-fuchsia-500" },
  { n: 7, title: "Resep", icon: Pill, desc: "Builder resep + cek interaksi obat + alergi pasien + PDF.", actor: "Dokter", color: "bg-cyan-500" },
  { n: 8, title: "Invoice Otomatis", icon: Receipt, desc: "Auto-build dari treatment + resep + apply promo + paket + diskon.", actor: "Sistem", color: "bg-teal-500" },
  { n: 9, title: "Pembayaran", icon: Wallet, desc: "Kasir terima pembayaran multi-method. Loyalty points earn otomatis.", actor: "Kasir", color: "bg-emerald-500" },
  { n: 10, title: "Follow-up", icon: MessageCircle, desc: "WhatsApp reminder H-1, follow-up +24 jam, birthday wish—semua otomatis.", actor: "Sistem", color: "bg-rose-500" },
];

const HOWTO = [
  {
    title: "Untuk Pasien",
    icon: Heart,
    color: "from-pink-500 to-rose-500",
    steps: [
      { label: "Booking online", desc: "Buka /booking, isi data, pilih treatment & slot." },
      { label: "Datang sesuai jadwal", desc: "Tunjukkan nama/no telp ke resepsionis untuk check-in." },
      { label: "Konsultasi & treatment", desc: "Sesuai antrian, tanpa lama menunggu." },
      { label: "Bayar di kasir", desc: "Banyak pilihan pembayaran tersedia." },
      { label: "Lihat history di portal", desc: "Login /portal pakai no telp + tgl lahir." },
    ],
  },
  {
    title: "Untuk Tim Klinik",
    icon: Stethoscope,
    color: "from-blue-500 to-indigo-500",
    steps: [
      { label: "Login dengan akun masing-masing", desc: "Setiap role (Dokter/Therapist/Kasir/dll) punya akses berbeda." },
      { label: "Lihat dashboard", desc: "KPI hari ini, antrian aktif, alert penting." },
      { label: "Jalankan tugas sesuai role", desc: "Resepsionis booking, Dokter MR, Therapist treatment, Kasir bayar." },
      { label: "Pantau pasien lewat antrian", desc: "Status real-time tiap pasien dari datang sampai pulang." },
      { label: "Cek laporan akhir hari", desc: "Revenue, treatment count, stock alerts—semua siap dilihat." },
    ],
  },
  {
    title: "Untuk Owner / Manager",
    icon: TrendingUp,
    color: "from-emerald-500 to-green-500",
    steps: [
      { label: "Dashboard KPI", desc: "Lihat metric bisnis real-time: revenue, top treatment, doctor performance." },
      { label: "Kelola pengguna & role", desc: "/settings/users untuk tambah/edit staff dengan permission custom." },
      { label: "Setup promo & loyalty", desc: "Atur voucher, happy hour, tier membership untuk retention." },
      { label: "Review laporan & export", desc: "/laporan—download Excel multi-sheet untuk analisa lanjut." },
      { label: "Kelola inventory", desc: "Stock opname berkala + purchase order ke supplier." },
    ],
  },
];

// ============================================================
// HELPERS
// ============================================================

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-medium transition hover:bg-white/20"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Tersalin" : label}
    </button>
  );
}

// ============================================================
// PAGE
// ============================================================

export function DemoPage() {
  const [flowStep, setFlowStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const step = FLOW_STEPS[flowStep];
  const StepIcon = step.icon;

  useEffect(() => {
    if (!autoPlay) return;
    const t = setInterval(() => {
      setFlowStep((s) => (s + 1) % FLOW_STEPS.length);
    }, 3000);
    return () => clearInterval(t);
  }, [autoPlay]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-purple-50 dark:from-rose-950/20 dark:via-background dark:to-purple-950/20">
      {/* Floating nav */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <Link href="/demo" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-bold">Klinik Cantik</span>
          </Link>
          <div className="hidden items-center gap-6 text-sm md:flex">
            <a href="#highlights" className="text-muted-foreground hover:text-foreground">Highlights</a>
            <a href="#modules" className="text-muted-foreground hover:text-foreground">Modul</a>
            <a href="#flow" className="text-muted-foreground hover:text-foreground">Alur</a>
            <a href="#howto" className="text-muted-foreground hover:text-foreground">Cara Pakai</a>
            <a href="#login" className="text-muted-foreground hover:text-foreground">Login Demo</a>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-md"
          >
            Masuk Aplikasi <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-pink-300/30 blur-3xl" />
          <div className="absolute top-32 right-0 h-96 w-96 rounded-full bg-purple-300/30 blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/60 px-4 py-1.5 text-xs font-medium backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
              Aplikasi Live & Siap Pakai
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Sistem Operasional{" "}
              <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 bg-clip-text text-transparent">
                Klinik Kecantikan
              </span>{" "}
              Modern
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Satu aplikasi untuk semua: appointment, rekam medis, kasir, inventory, CRM otomatis, dan KPI dashboard real-time.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/30 transition hover:shadow-xl hover:shadow-pink-500/40"
              >
                Mulai Demo Sekarang <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#flow"
                className="inline-flex items-center gap-2 rounded-lg border bg-background px-6 py-3 text-sm font-semibold transition hover:bg-accent"
              >
                <Play className="h-4 w-4" /> Lihat Alurnya
              </a>
            </div>
          </div>

          {/* Stat strip */}
          <div className="mt-16 grid grid-cols-2 gap-3 md:grid-cols-4">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-xl border bg-background/60 p-5 text-center backdrop-blur-sm transition hover:border-pink-500/50 hover:shadow-md">
                  <Icon className="mx-auto mb-2 h-5 w-5 text-pink-500" />
                  <div className="text-3xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section id="highlights" className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Kenapa Klinik Cantik?</h2>
          <p className="mt-3 text-muted-foreground">4 alasan utama yang membedakan kami dari sistem lain.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((h) => {
            const Icon = h.icon;
            return (
              <div key={h.title} className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition hover:border-pink-500/50 hover:shadow-lg">
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-pink-500/10 to-purple-500/10 blur-2xl transition group-hover:scale-150" />
                <div className="relative">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 font-semibold">{h.title}</h3>
                  <p className="text-sm text-muted-foreground">{h.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium">
            <Boxes className="h-3.5 w-3.5 text-pink-500" /> 6 Modul Lengkap
          </div>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">Semua yang Klinik Anda Butuhkan</h2>
          <p className="mt-3 text-muted-foreground">Dari front office sampai laporan bisnis—tidak ada yang terlewat.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.name} className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${m.gradient} p-6 transition hover:scale-[1.02] hover:shadow-xl`}>
                <div className="mb-4 flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-sm ${m.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{m.name}</h3>
                </div>
                <ul className="space-y-2">
                  {m.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className={`mt-0.5 h-4 w-4 flex-shrink-0 ${m.color}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* FLOW */}
      <section id="flow" className="border-y bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-20 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-blue-950/20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium">
              <Zap className="h-3.5 w-3.5 text-pink-500" /> Patient Journey
            </div>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">Alur Pasien End-to-End</h2>
            <p className="mt-3 text-muted-foreground">10 langkah dari booking sampai follow-up otomatis—semua terintegrasi.</p>
          </div>

          {/* Stepper dots */}
          <div className="mb-8 overflow-x-auto pb-2">
            <div className="flex min-w-max items-center justify-center gap-1 md:gap-2">
              {FLOW_STEPS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setFlowStep(i)}
                  className="group flex flex-col items-center"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                      i === flowStep
                        ? `${s.color} scale-110 text-white shadow-lg ring-4 ring-white dark:ring-background`
                        : i < flowStep
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground group-hover:bg-accent"
                    }`}
                  >
                    {i < flowStep ? <CheckCircle2 className="h-5 w-5" /> : s.n}
                  </div>
                  {i < FLOW_STEPS.length - 1 && (
                    <div className={`hidden md:block absolute h-0.5 w-8 translate-x-9 ${i < flowStep ? "bg-green-500" : "bg-border"}`} style={{ marginTop: "-1.5rem" }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Active step card */}
          <div className="relative mx-auto max-w-3xl">
            <div className="overflow-hidden rounded-2xl border bg-card shadow-xl">
              <div className={`h-2 ${step.color}`} />
              <div className="p-8 md:p-10">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Step {step.n} dari {FLOW_STEPS.length}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full ${step.color} px-3 py-1 text-xs font-medium text-white`}>
                    <Users className="h-3 w-3" /> {step.actor}
                  </span>
                </div>
                <div className="mb-6 flex items-start gap-4">
                  <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl ${step.color} text-white shadow-lg`}>
                    <StepIcon className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{step.title}</h3>
                    <p className="mt-2 text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={() => setFlowStep(Math.max(0, flowStep - 1))}
                disabled={flowStep === 0}
                className="inline-flex items-center gap-1 rounded-md border bg-background px-4 py-2 text-sm font-medium transition hover:bg-accent disabled:opacity-30"
              >
                <ArrowLeft className="h-4 w-4" /> Sebelumnya
              </button>
              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className={`inline-flex items-center gap-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                  autoPlay ? "bg-rose-500 text-white" : "border bg-background hover:bg-accent"
                }`}
              >
                <Play className="h-4 w-4" /> {autoPlay ? "Pause Auto-Play" : "Auto-Play"}
              </button>
              <button
                onClick={() => setFlowStep(Math.min(FLOW_STEPS.length - 1, flowStep + 1))}
                disabled={flowStep === FLOW_STEPS.length - 1}
                className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-medium text-white shadow transition hover:shadow-md disabled:opacity-30"
              >
                Selanjutnya <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* HOW TO USE */}
      <section id="howto" className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium">
            <FileText className="h-3.5 w-3.5 text-pink-500" /> Panduan Cepat
          </div>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">Cara Pakainya?</h2>
          <p className="mt-3 text-muted-foreground">Sederhana—3 cara berbeda tergantung peran Anda.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {HOWTO.map((h) => {
            const Icon = h.icon;
            return (
              <div key={h.title} className="overflow-hidden rounded-2xl border bg-card transition hover:shadow-xl">
                <div className={`bg-gradient-to-br ${h.color} p-6 text-white`}>
                  <Icon className="mb-3 h-8 w-8" />
                  <h3 className="text-xl font-bold">{h.title}</h3>
                </div>
                <ol className="space-y-4 p-6">
                  {h.steps.map((s, i) => (
                    <li key={s.label} className="flex gap-3">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{s.label}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{s.desc}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      </section>

      {/* LOGIN DEMO */}
      <section id="login" className="border-y bg-background py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium">
              <Lock className="h-3.5 w-3.5 text-pink-500" /> Akun Demo Siap Pakai
            </div>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">Coba Login Sebagai Siapa?</h2>
            <p className="mt-3 text-muted-foreground">
              Setiap role melihat aplikasi dengan menu & permission berbeda. Klik untuk salin email/password.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ROLES.map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.email}
                  className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${r.color} p-6 text-white shadow-lg transition hover:scale-[1.02] hover:shadow-xl`}
                >
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl transition group-hover:scale-150" />
                  <div className="relative">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold">{r.name}</h3>
                    <p className="mt-1 text-sm text-white/80">{r.desc}</p>
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 rounded-lg bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                        <span className="text-xs text-white/70">Email</span>
                        <span className="font-mono text-xs">{r.email}</span>
                        <CopyButton text={r.email} label="Salin" />
                      </div>
                      <div className="flex items-center justify-between gap-2 rounded-lg bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                        <span className="text-xs text-white/70">Password</span>
                        <span className="font-mono text-xs">{r.password}</span>
                        <CopyButton text={r.password} label="Salin" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/30 transition hover:shadow-xl"
            >
              Login Sekarang <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 rounded-lg border bg-background px-6 py-3 text-sm font-semibold transition hover:bg-accent"
            >
              Coba Booking Pasien <Smartphone className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Atau <Link href="/portal/login" className="text-pink-600 underline hover:text-pink-700">login sebagai pasien</Link> untuk lihat patient portal.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-500 via-rose-500 to-purple-500 p-10 text-center text-white md:p-16">
          <div className="absolute inset-0 -z-10">
            <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          </div>
          <Sparkles className="mx-auto mb-4 h-10 w-10" />
          <h2 className="text-3xl font-bold md:text-4xl">Siap Tingkatkan Klinik Anda?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/90">
            Coba semua fitur tanpa setup tambahan—data demo sudah siap. Dari booking publik, kasir, sampai laporan bisnis.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-pink-600 shadow-lg transition hover:shadow-xl"
            >
              Mulai Demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/20"
            >
              Lihat Dashboard <BarChart3 className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-pink-500 to-rose-500 text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-medium">Klinik Cantik</span>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <Link href="/login" className="hover:text-foreground">Login Staff</Link>
              <Link href="/portal" className="hover:text-foreground">Patient Portal</Link>
              <Link href="/booking" className="hover:text-foreground">Booking Online</Link>
              <Link href="/antrian/display" className="hover:text-foreground">Display Antrian</Link>
            </div>
            <div className="text-xs text-muted-foreground">© 2026 Klinik Cantik · Demo Application</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
