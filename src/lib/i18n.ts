import { cookies } from "next/headers";

export type Locale = "id" | "en";

export const DEFAULT_LOCALE: Locale = "id";

type Dictionary = {
  common: Record<string, string>;
  nav: Record<string, string>;
  auth: Record<string, string>;
  appointment: Record<string, string>;
  patient: Record<string, string>;
  queue: Record<string, string>;
};

export const dict: Record<Locale, Dictionary> = {
  id: {
    common: {
      app_name: "Klinik Cantik",
      dashboard: "Dashboard",
      logout: "Keluar",
      save: "Simpan",
      cancel: "Batal",
      edit: "Ubah",
      delete: "Hapus",
      add: "Tambah",
      search: "Cari",
      back: "Kembali",
      submit: "Kirim",
      status: "Status",
      action: "Aksi",
      total: "Total",
      yes: "Ya",
      no: "Tidak",
      no_data: "Belum ada data",
      loading: "Memuat...",
    },
    nav: {
      dashboard: "Dashboard",
      front_office: "Front Office",
      appointment: "Appointment",
      registrasi: "Registrasi Pasien",
      antrian: "Antrian",
      membership: "Membership",
      medical: "Medical",
      rekam_medis: "Rekam Medis",
      diagnosa: "Diagnosa",
      treatment: "Treatment",
      before_after: "Foto Before-After",
      resep: "Resep",
      ops: "Operasional",
      farmasi: "Farmasi",
      inventory: "Inventory",
      consumables: "Consumables",
      supplier: "Supplier",
      financial: "Financial",
      kasir: "Kasir",
      invoice: "Invoice",
      paket: "Paket Treatment",
      deposit: "Deposit (Kas Klinik)",
      laporan: "Laporan",
      crm: "CRM & Marketing",
      wa_reminder: "WhatsApp Reminder",
      promo: "Promo",
      loyalty: "Loyalty",
      followup: "Follow Up",
      settings: "Pengaturan",
    },
    auth: {
      sign_in: "Masuk",
      email: "Email",
      password: "Kata Sandi",
      login_failed: "Email atau kata sandi salah",
      welcome_back: "Selamat datang kembali",
    },
    appointment: {
      title: "Appointment",
      new: "Buat Appointment",
      patient: "Pasien",
      treatment: "Treatment",
      date_time: "Tanggal & Jam",
      doctor: "Dokter",
      duration: "Durasi (menit)",
      status: "Status",
      check_in: "Check-in",
      cancel: "Batalkan",
    },
    patient: {
      title: "Pasien",
      new: "Daftar Pasien Baru",
      mrn: "No. Rekam Medis",
      name: "Nama Lengkap",
      phone: "No. HP / WA",
      gender: "Jenis Kelamin",
      birth_date: "Tanggal Lahir",
      address: "Alamat",
      tier: "Tier Membership",
    },
    queue: {
      title: "Antrian",
      number: "No. Antrian",
      stage: "Tahap",
      called: "Panggil",
      next: "Berikutnya",
    },
  },
  en: {
    common: {
      app_name: "Beauty Clinic",
      dashboard: "Dashboard",
      logout: "Logout",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      add: "Add",
      search: "Search",
      back: "Back",
      submit: "Submit",
      status: "Status",
      action: "Action",
      total: "Total",
      yes: "Yes",
      no: "No",
      no_data: "No data yet",
      loading: "Loading...",
    },
    nav: {
      dashboard: "Dashboard",
      front_office: "Front Office",
      appointment: "Appointments",
      registrasi: "Patient Registration",
      antrian: "Queue",
      membership: "Membership",
      medical: "Medical",
      rekam_medis: "Medical Records",
      diagnosa: "Diagnoses",
      treatment: "Treatments",
      before_after: "Before-After Photos",
      resep: "Prescriptions",
      ops: "Operations",
      farmasi: "Pharmacy",
      inventory: "Inventory",
      consumables: "Consumables",
      supplier: "Suppliers",
      financial: "Financial",
      kasir: "Cashier",
      invoice: "Invoices",
      paket: "Treatment Packages",
      deposit: "Deposits (Cash)",
      laporan: "Reports",
      crm: "CRM & Marketing",
      wa_reminder: "WhatsApp Reminders",
      promo: "Promotions",
      loyalty: "Loyalty",
      followup: "Follow Up",
      settings: "Settings",
    },
    auth: {
      sign_in: "Sign in",
      email: "Email",
      password: "Password",
      login_failed: "Invalid email or password",
      welcome_back: "Welcome back",
    },
    appointment: {
      title: "Appointments",
      new: "New Appointment",
      patient: "Patient",
      treatment: "Treatment",
      date_time: "Date & Time",
      doctor: "Doctor",
      duration: "Duration (min)",
      status: "Status",
      check_in: "Check-in",
      cancel: "Cancel",
    },
    patient: {
      title: "Patients",
      new: "Register New Patient",
      mrn: "MRN",
      name: "Full Name",
      phone: "Phone / WA",
      gender: "Gender",
      birth_date: "Date of Birth",
      address: "Address",
      tier: "Membership Tier",
    },
    queue: {
      title: "Queue",
      number: "Queue No.",
      stage: "Stage",
      called: "Call",
      next: "Next",
    },
  },
};

export type Dict = Dictionary;

export function getLocale(): Locale {
  try {
    const c = cookies().get("locale")?.value;
    if (c === "en" || c === "id") return c;
  } catch {}
  return DEFAULT_LOCALE;
}

export function getDict(locale?: Locale): Dict {
  const l = locale ?? getLocale();
  return dict[l];
}
