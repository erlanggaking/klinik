import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays, startOfDay, endOfDay } from "date-fns";

/**
 * Cron handler — dipanggil oleh scheduler eksternal (Vercel Cron, GitHub Actions, dll).
 * GET /api/cron?token=...
 *  - reminder appointment H-1
 *  - follow-up post-treatment H+3
 *  - inactive patient (90 hari)
 *  - birthday today
 *  - low stock alert
 *  - expiring batch (60 hari)
 *
 * Pesan masuk ke MessageOutbox + FollowUpTask (status PENDING).
 * Untuk dummy WA, gak benar-benar dikirim — tinggal swap driver di /lib/whatsapp.ts.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (process.env.CRON_TOKEN && token !== process.env.CRON_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = {
    appointmentReminders: 0,
    followUpsCreated: 0,
    inactiveOutreach: 0,
    birthdayGreetings: 0,
    lowStockAlerts: 0,
    expiringBatchAlerts: 0,
  };

  const tomorrow = addDays(new Date(), 1);
  const tomorrowStart = startOfDay(tomorrow);
  const tomorrowEnd = endOfDay(tomorrow);

  // 1) Reminder H-1
  const upcoming = await prisma.appointment.findMany({
    where: { startAt: { gte: tomorrowStart, lte: tomorrowEnd }, status: { in: ["BOOKED", "CONFIRMED"] } },
    include: { patient: true, treatments: { include: { treatment: true } } },
  });
  for (const a of upcoming) {
    if (!a.patient.whatsappOptIn) continue;
    const exists = await prisma.messageOutbox.findFirst({
      where: { refType: "APPOINTMENT_REMINDER", refId: a.id },
    });
    if (exists) continue;
    await prisma.messageOutbox.create({
      data: {
        channel: "WHATSAPP",
        toAddress: a.patient.phone,
        body: `Halo ${a.patient.fullName}, mengingatkan jadwal kamu besok ${a.startAt.toLocaleString("id-ID")} (${a.treatments.map((t: any) => t.treatment.nameId).join(", ")}). Sampai jumpa! 💕`,
        status: "QUEUED",
        scheduledAt: new Date(),
        patientId: a.patientId,
        refType: "APPOINTMENT_REMINDER",
        refId: a.id,
      },
    });
    stats.appointmentReminders++;
  }

  // 2) Follow-up H+3 dari rekam medis 3 hari lalu
  const threeDaysAgo = startOfDay(addDays(new Date(), -3));
  const threeDaysAgoEnd = endOfDay(addDays(new Date(), -3));
  const recordsH3 = await prisma.medicalRecord.findMany({
    where: { visitDate: { gte: threeDaysAgo, lte: threeDaysAgoEnd } },
    include: { patient: true },
  });
  for (const mr of recordsH3) {
    const tag = `POST_TREATMENT:${mr.id}`;
    const exists = await prisma.followUpTask.findFirst({
      where: { patientId: mr.patientId, notes: tag },
    });
    if (exists) continue;
    await prisma.followUpTask.create({
      data: {
        patientId: mr.patientId,
        status: "PENDING",
        channel: "WHATSAPP",
        scheduledAt: new Date(),
        subject: "Follow up H+3 setelah treatment",
        body: `Halo ${mr.patient.fullName}, gimana hasil treatment kamu kemarin? Ada keluhan? 💗`,
        notes: tag,
      },
    });
    stats.followUpsCreated++;
  }

  // 3) Inactive 90 hari — pasien yang gak datang 90 hari terakhir
  const cutoff = addDays(new Date(), -90);
  const inactive = await prisma.patient.findMany({
    where: {
      isActive: true,
      medicalRecords: { every: { visitDate: { lt: cutoff } } },
    },
    take: 50,
  });
  for (const p of inactive) {
    const lastTask = await prisma.followUpTask.findFirst({
      where: { patientId: p.id, notes: { startsWith: "INACTIVE:" }, scheduledAt: { gte: addDays(new Date(), -30) } },
    });
    if (lastTask) continue;
    await prisma.followUpTask.create({
      data: {
        patientId: p.id,
        status: "PENDING",
        channel: "WHATSAPP",
        scheduledAt: new Date(),
        subject: "Pasien Inactive 3 bulan",
        body: `Halo ${p.fullName}, kami kangen kamu! Sudah 3 bulan tidak ke klinik. Yuk reservasi lagi 💖`,
        notes: `INACTIVE:${p.id}`,
      },
    });
    stats.inactiveOutreach++;
  }

  // 4) Birthday today
  const today = new Date();
  const m = today.getMonth() + 1;
  const d = today.getDate();
  const birthdayKids = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, "fullName", phone, "loyaltyPoints", "membershipTierId" FROM "Patient" 
     WHERE "isActive" = true AND "birthDate" IS NOT NULL 
       AND EXTRACT(MONTH FROM "birthDate") = ${m} AND EXTRACT(DAY FROM "birthDate") = ${d} LIMIT 50`
  ).catch(() => []);
  for (const p of birthdayKids) {
    await prisma.messageOutbox.create({
      data: {
        channel: "WHATSAPP",
        toAddress: p.phone,
        body: `Selamat ulang tahun ${p.fullName}! 🎂 Bonus 250 poin sudah masuk ke akun kamu. Nikmati treatment favorit di klinik! 🌸`,
        status: "QUEUED",
        scheduledAt: new Date(),
        patientId: p.id,
        refType: "BIRTHDAY",
      },
    });
    await prisma.loyaltyLedger.create({
      data: { patientId: p.id, delta: 250, reason: "BIRTHDAY_BONUS", notes: "Birthday bonus" },
    });
    await prisma.patient.update({ where: { id: p.id }, data: { loyaltyPoints: { increment: 250 } } });
    stats.birthdayGreetings++;
  }

  // 5) Low-stock alert (manager-only — placeholder, sekedar count)
  const items = await prisma.inventoryItem.findMany({ where: { isActive: true } });
  for (const it of items) {
    const r = await prisma.stockMovement.aggregate({ where: { itemId: it.id }, _sum: { quantity: true } });
    const qty = Number(r._sum.quantity ?? 0);
    if (qty <= Number(it.reorderPoint)) stats.lowStockAlerts++;
  }

  // 6) Expiring batch ≤60 hari
  const cutoffExp = addDays(new Date(), 60);
  stats.expiringBatchAlerts = await prisma.inventoryBatch.count({
    where: { expiredAt: { lte: cutoffExp, gte: new Date() }, quantity: { gt: 0 } },
  });

  return NextResponse.json({ ok: true, stats, ranAt: new Date().toISOString() });
}
