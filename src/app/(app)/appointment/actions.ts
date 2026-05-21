"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { nextCode, todayQueueNumber } from "@/lib/codes";
import { revalidatePath } from "next/cache";

export async function createAppointment(formData: FormData) {
  await requirePermission("appointment.write");
  const patientId = String(formData.get("patientId") ?? "");
  const startAtRaw = String(formData.get("startAt") ?? "");
  const treatmentIds = formData.getAll("treatmentId").map((v) => String(v)).filter(Boolean);
  const primaryStaffId = String(formData.get("primaryStaffId") ?? "") || null;
  const notes = String(formData.get("notes") ?? "") || null;

  if (!patientId || !startAtRaw || treatmentIds.length === 0) {
    return { error: "Pasien, waktu, dan minimal 1 treatment wajib diisi" };
  }

  const start = new Date(startAtRaw);
  const treatments = await prisma.treatment.findMany({ where: { id: { in: treatmentIds } } });
  const totalDuration = treatments.reduce((s, t) => s + t.durationMinutes, 0);
  const end = new Date(start.getTime() + totalDuration * 60_000);
  const code = await nextCode("APT");

  try {
    const appt = await prisma.appointment.create({
      data: {
        code,
        patientId,
        primaryStaffId: primaryStaffId || undefined,
        startAt: start,
        endAt: end,
        status: "BOOKED",
        source: "INTERNAL",
        notes,
        treatments: {
          create: treatmentIds.map((tid) => ({ treatmentId: tid, plannedQty: 1 })),
        },
      },
    });
    revalidatePath("/appointment");
    return { id: appt.id };
  } catch (e: any) {
    return { error: e?.message ?? "Gagal membuat appointment" };
  }
}

export async function checkInAppointment(id: string) {
  await requirePermission("queue.manage");
  const appt = await prisma.appointment.findUnique({ where: { id }, include: { treatments: { include: { treatment: true } } } });
  if (!appt) return { error: "Appointment tidak ditemukan" };

  return prisma.$transaction(async (tx) => {
    // Generate today's queue number for WAITING_CONSULT (or WAITING_TREATMENT if no doctor required)
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const requiresDoctor = appt.treatments.some((t: any) => t.treatment.requiresDoctor);
    const stage = requiresDoctor ? "WAITING_CONSULT" : "WAITING_TREATMENT";
    const prefix = stage === "WAITING_CONSULT" ? "C" : "T";
    const count = await tx.queueTicket.count({ where: { date: today, stage } });
    const number = todayQueueNumber(prefix, count + 1);

    const ticket = await tx.queueTicket.create({
      data: {
        appointmentId: id,
        patientId: appt.patientId,
        number,
        stage,
        status: "WAITING",
        date: today,
        history: { create: { toStage: stage, toStatus: "WAITING" } },
      },
    });
    await tx.appointment.update({
      where: { id },
      data: { status: "CHECKED_IN" },
    });
    revalidatePath("/appointment");
    revalidatePath("/antrian");
    return { ticketId: ticket.id, number };
  });
}

export async function cancelAppointment(id: string, reason?: string) {
  await requirePermission("appointment.cancel");
  await prisma.appointment.update({
    where: { id },
    data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: reason ?? null },
  });
  revalidatePath("/appointment");
  return { ok: true };
}
