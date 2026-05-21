/**
 * Seed: roles, permissions, default users, klinik catalog & sample data.
 * Run: npm run db:seed
 */
import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Decimal } from "@prisma/client/runtime/library";
import { ALL_PERMISSIONS, ROLE_PRESETS } from "../src/lib/rbac";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding...");

  // 1) Permissions
  for (const code of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: {
        code,
        module: code.split(".")[0].toUpperCase(),
        description: code,
      },
    });
  }

  // 2) Roles + connect permissions
  for (const [code, preset] of Object.entries(ROLE_PRESETS)) {
    const role = await prisma.role.upsert({
      where: { code },
      update: { name: preset.name },
      create: { code, name: preset.name, isSystem: true },
    });
    // wipe & reattach (idempotent)
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    for (const p of preset.permissions) {
      const perm = await prisma.permission.findUnique({ where: { code: p } });
      if (perm) {
        await prisma.rolePermission.create({
          data: { roleId: role.id, permissionId: perm.id },
        });
      }
    }
  }

  // 3) Users — default admin + samples per role
  const passwordHash = await bcrypt.hash("admin123", 10);
  const samplePassword = await bcrypt.hash("klinik123", 10);

  const userDefs = [
    { email: "admin@klinik.id", name: "Administrator", roleCode: "ADMIN", password: passwordHash, staffType: null },
    { email: "owner@klinik.id", name: "Owner Klinik", roleCode: "OWNER", password: samplePassword, staffType: null },
    { email: "resepsionis@klinik.id", name: "Sari Resepsionis", roleCode: "RECEPTIONIST", password: samplePassword, staffType: null },
    { email: "dr.amelia@klinik.id", name: "dr. Amelia Putri, Sp.KK", roleCode: "DOCTOR", password: samplePassword, staffType: "DOCTOR" as const, specialty: "Dermatologi", licenseNumber: "STR-1234" },
    { email: "dr.budi@klinik.id", name: "dr. Budi Santoso", roleCode: "DOCTOR", password: samplePassword, staffType: "DOCTOR" as const, specialty: "Aesthetic", licenseNumber: "STR-5678" },
    { email: "therapist1@klinik.id", name: "Lina Therapist", roleCode: "THERAPIST", password: samplePassword, staffType: "THERAPIST" as const },
    { email: "therapist2@klinik.id", name: "Diana Therapist", roleCode: "THERAPIST", password: samplePassword, staffType: "THERAPIST" as const },
    { email: "kasir@klinik.id", name: "Mira Kasir", roleCode: "CASHIER", password: samplePassword, staffType: null },
    { email: "farmasi@klinik.id", name: "Rini Apoteker", roleCode: "PHARMACIST", password: samplePassword, staffType: null },
  ];

  for (const u of userDefs) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name },
      create: { email: u.email, name: u.name, passwordHash: u.password, isActive: true },
    });
    const role = await prisma.role.findUnique({ where: { code: u.roleCode } });
    if (role) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: { userId: user.id, roleId: role.id },
      });
    }
    if (u.staffType) {
      await prisma.staffProfile.upsert({
        where: { userId: user.id },
        update: { staffType: u.staffType, specialty: (u as any).specialty, licenseNumber: (u as any).licenseNumber },
        create: {
          userId: user.id,
          staffType: u.staffType,
          specialty: (u as any).specialty,
          licenseNumber: (u as any).licenseNumber,
          color: u.staffType === "DOCTOR" ? "#ec4899" : "#a855f7",
        },
      });
    }
  }

  // 4) Membership tiers
  const tiers = [
    { code: "SILVER", name: "Silver", minSpend: 0, discountPct: 5, pointMultiplier: 1, birthdayBonus: 100, anniversaryBonus: 50, color: "#94a3b8" },
    { code: "GOLD", name: "Gold", minSpend: 5_000_000, discountPct: 10, pointMultiplier: 1.5, birthdayBonus: 250, anniversaryBonus: 100, color: "#eab308" },
    { code: "PLATINUM", name: "Platinum", minSpend: 15_000_000, discountPct: 15, pointMultiplier: 2, birthdayBonus: 500, anniversaryBonus: 250, color: "#a855f7" },
  ];
  for (const t of tiers) {
    await prisma.membershipTier.upsert({
      where: { code: t.code },
      update: {},
      create: {
        code: t.code,
        name: t.name,
        minSpend: new Decimal(t.minSpend),
        discountPct: new Decimal(t.discountPct),
        pointMultiplier: new Decimal(t.pointMultiplier),
        birthdayBonus: t.birthdayBonus,
        anniversaryBonus: t.anniversaryBonus,
        color: t.color,
      },
    });
  }

  // 5) Treatment categories
  const cats = [
    { code: "FACIAL", nameId: "Facial", nameEn: "Facial" },
    { code: "LASER", nameId: "Laser", nameEn: "Laser" },
    { code: "INJECTION", nameId: "Injeksi", nameEn: "Injection" },
    { code: "BODY", nameId: "Perawatan Tubuh", nameEn: "Body Care" },
    { code: "PEELING", nameId: "Chemical Peeling", nameEn: "Chemical Peeling" },
  ];
  const catMap = new Map<string, string>();
  for (const c of cats) {
    const cat = await prisma.treatmentCategory.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
    catMap.set(c.code, cat.id);
  }

  // 6) Treatments
  const treatments = [
    { code: "T-FAC-01", nameId: "Basic Facial", category: "FACIAL", durationMinutes: 60, price: 250_000, requiresDoctor: false },
    { code: "T-FAC-02", nameId: "Premium Facial", category: "FACIAL", durationMinutes: 90, price: 550_000, requiresDoctor: false },
    { code: "T-LSR-01", nameId: "Laser Toning", category: "LASER", durationMinutes: 45, price: 1_200_000, requiresDoctor: true },
    { code: "T-LSR-02", nameId: "Laser CO2 Fractional", category: "LASER", durationMinutes: 60, price: 2_500_000, requiresDoctor: true },
    { code: "T-INJ-01", nameId: "Botox Forehead", category: "INJECTION", durationMinutes: 30, price: 3_500_000, requiresDoctor: true },
    { code: "T-INJ-02", nameId: "Filler Pipi", category: "INJECTION", durationMinutes: 45, price: 5_500_000, requiresDoctor: true },
    { code: "T-PEEL-01", nameId: "Glycolic Peeling", category: "PEELING", durationMinutes: 30, price: 450_000, requiresDoctor: false },
    { code: "T-BODY-01", nameId: "Body Massage", category: "BODY", durationMinutes: 60, price: 350_000, requiresDoctor: false },
  ];
  for (const t of treatments) {
    await prisma.treatment.upsert({
      where: { code: t.code },
      update: {},
      create: {
        code: t.code,
        nameId: t.nameId,
        categoryId: catMap.get(t.category)!,
        durationMinutes: t.durationMinutes,
        price: new Decimal(t.price),
        cost: new Decimal(t.price * 0.3),
        requiresDoctor: t.requiresDoctor,
      },
    });
  }

  // 7) Inventory items (skincare retail + drug + consumables)
  const items = [
    { sku: "SC-001", nameId: "Sunscreen SPF 50", itemType: "SKINCARE", unit: "btl", sellingPrice: 250_000, costPrice: 90_000, isBatchTracked: true, reorderPoint: 10 },
    { sku: "SC-002", nameId: "Vitamin C Serum 15ml", itemType: "SKINCARE", unit: "btl", sellingPrice: 480_000, costPrice: 180_000, isBatchTracked: true, reorderPoint: 8 },
    { sku: "SC-003", nameId: "Moisturizer Hydrating", itemType: "SKINCARE", unit: "tube", sellingPrice: 320_000, costPrice: 110_000, isBatchTracked: true, reorderPoint: 12 },
    { sku: "DR-001", nameId: "Tretinoin 0.025% Cream", itemType: "DRUG", unit: "tube", sellingPrice: 180_000, costPrice: 60_000, isBatchTracked: true, reorderPoint: 5 },
    { sku: "DR-002", nameId: "Hydroquinone 4%", itemType: "DRUG", unit: "tube", sellingPrice: 220_000, costPrice: 80_000, isBatchTracked: true, reorderPoint: 5 },
    { sku: "DR-003", nameId: "Antibiotik Topikal", itemType: "DRUG", unit: "tube", sellingPrice: 95_000, costPrice: 35_000, isBatchTracked: true, reorderPoint: 10 },
    { sku: "CO-001", nameId: "Alkohol 70% (per liter)", itemType: "CONSUMABLE", unit: "ml", sellingPrice: 0, costPrice: 35, isBatchTracked: false, reorderPoint: 2000 },
    { sku: "CO-002", nameId: "Kapas Steril", itemType: "CONSUMABLE", unit: "pcs", sellingPrice: 0, costPrice: 200, isBatchTracked: false, reorderPoint: 100 },
    { sku: "CO-003", nameId: "Sarung Tangan Latex", itemType: "CONSUMABLE", unit: "pcs", sellingPrice: 0, costPrice: 600, isBatchTracked: false, reorderPoint: 100 },
  ];
  for (const it of items) {
    await prisma.inventoryItem.upsert({
      where: { sku: it.sku },
      update: {},
      create: {
        sku: it.sku,
        nameId: it.nameId,
        itemType: it.itemType as any,
        unit: it.unit,
        sellingPrice: new Decimal(it.sellingPrice),
        costPrice: new Decimal(it.costPrice),
        reorderPoint: new Decimal(it.reorderPoint),
        reorderQty: new Decimal(it.reorderPoint * 2),
        isBatchTracked: it.isBatchTracked,
      },
    });
  }

  // Seed batches for batch-tracked items
  const batchedItems = await prisma.inventoryItem.findMany({ where: { isBatchTracked: true } });
  for (const bi of batchedItems) {
    const exists = await prisma.inventoryBatch.findFirst({ where: { itemId: bi.id } });
    if (!exists) {
      const exp = new Date();
      exp.setMonth(exp.getMonth() + 12);
      await prisma.inventoryBatch.create({
        data: {
          itemId: bi.id,
          batchNo: `B-${Date.now().toString().slice(-6)}-${bi.sku}`,
          expiredAt: exp,
          quantity: new Decimal(50),
          initialQty: new Decimal(50),
          costPrice: bi.costPrice,
        },
      });
    }
  }

  // 8) Cash accounts (default)
  const cashAccounts = [
    { code: "KAS-TUNAI", name: "Kas Tunai", accountType: "CASH" },
    { code: "BANK-BCA", name: "Bank BCA", accountType: "BANK", bankName: "BCA", accountNo: "1234567890" },
    { code: "EDC-BNI", name: "EDC BNI", accountType: "EDC", bankName: "BNI" },
    { code: "QRIS-MAIN", name: "QRIS Klinik", accountType: "EWALLET" },
  ];
  for (const a of cashAccounts) {
    await prisma.cashAccount.upsert({
      where: { code: a.code },
      update: {},
      create: { ...a } as any,
    });
  }

  // 9) Message templates
  const templates = [
    { code: "APPT_REMINDER_H1", name: "Reminder Appointment H-1", body: "Halo {{patient.name}}, mengingatkan jadwal kunjungan kamu di {{clinic.name}} besok jam {{appointment.time}}. Sampai jumpa! 💕" },
    { code: "QUEUE_ALMOST", name: "Antrian Hampir Giliran", body: "Halo {{patient.name}}, antrian {{queue.number}} kamu sebentar lagi dipanggil. Mohon menuju klinik 🙏" },
    { code: "FOLLOWUP_H3", name: "Follow Up H+3 Treatment", body: "Halo {{patient.name}}, gimana hasil treatment kamu kemarin? Ada keluhan/pertanyaan? Balas pesan ini ya 💗" },
    { code: "FOLLOWUP_H30", name: "Follow Up H+30", body: "Halo {{patient.name}}, sudah sebulan sejak treatment terakhir. Yuk konsultasi lagi untuk hasil maksimal! 🌸" },
    { code: "BIRTHDAY", name: "Birthday Greeting", body: "Selamat ulang tahun {{patient.name}}! 🎂 Kamu dapat bonus {{bonus}} poin. Yuk pakai untuk treatment favorit di {{clinic.name}}." },
    { code: "INACTIVE_REMINDER", name: "Pasien Inactive 3 Bulan", body: "Halo {{patient.name}}, kami kangen kamu! Sudah 3 bulan tidak ke klinik. Yuk reservasi lagi 💖" },
  ];
  for (const t of templates) {
    await prisma.messageTemplate.upsert({
      where: { code: t.code },
      update: {},
      create: { code: t.code, name: t.name, body: t.body, locale: "id", channel: "WHATSAPP" },
    });
  }

  // 10) Sample patients
  const samples = [
    { firstName: "Ayu", lastName: "Lestari", phone: "081234567001", gender: "FEMALE" as const, skinType: "COMBINATION", tier: "GOLD" },
    { firstName: "Maya", lastName: "Sari", phone: "081234567002", gender: "FEMALE" as const, skinType: "OILY", tier: "SILVER" },
    { firstName: "Rina", lastName: "Wati", phone: "081234567003", gender: "FEMALE" as const, skinType: "DRY", tier: null },
  ];
  const goldTier = await prisma.membershipTier.findUnique({ where: { code: "GOLD" } });
  const silverTier = await prisma.membershipTier.findUnique({ where: { code: "SILVER" } });
  for (const s of samples) {
    const exists = await prisma.patient.findFirst({ where: { phone: s.phone } });
    if (exists) continue;
    const seq = await prisma.patient.count();
    const tierId = s.tier === "GOLD" ? goldTier?.id : s.tier === "SILVER" ? silverTier?.id : null;
    await prisma.patient.create({
      data: {
        mrn: `PT-2026-${String(seq + 1).padStart(5, "0")}`,
        firstName: s.firstName,
        lastName: s.lastName,
        fullName: `${s.firstName} ${s.lastName}`,
        phone: s.phone,
        gender: s.gender,
        skinType: s.skinType,
        membershipTierId: tierId ?? undefined,
        membershipSince: tierId ? new Date() : null,
        consentSigned: true,
        consentSignedAt: new Date(),
        referralCode: `REF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      },
    });
  }

  console.log("✅ Seed selesai.");
  console.log("Akun default:");
  console.log("  admin@klinik.id / admin123");
  console.log("  owner@klinik.id / klinik123");
  console.log("  resepsionis@klinik.id / klinik123");
  console.log("  dr.amelia@klinik.id / klinik123");
  console.log("  therapist1@klinik.id / klinik123");
  console.log("  kasir@klinik.id / klinik123");
  console.log("  farmasi@klinik.id / klinik123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
