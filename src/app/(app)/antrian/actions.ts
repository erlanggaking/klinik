"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { enqueueWhatsApp } from "@/lib/whatsapp";
import { revalidatePath } from "next/cache";
import { todayQueueNumber } from "@/lib/codes";

const ORDER = ["WAITING_CONSULT", "WAITING_TREATMENT", "WAITING_PHARMACY", "WAITING_CASHIER", "DONE"] as const;

export async function callTicket(ticketId: string) {
  await requirePermission("queue.manage");
  const t = await prisma.queueTicket.update({
    where: { id: ticketId },
    data: { status: "CALLED", calledAt: new Date(), history: { create: { toStage: undefined as any, toStatus: "CALLED" } } as any },
    include: { patient: true },
  });
  // Notif WA: "almost your turn"
  if (t.patient.whatsappOptIn && !t.waNotifiedAt) {
    await enqueueWhatsApp({
      to: t.patient.phone,
      body: `Halo ${t.patient.fullName}, antrian ${t.number} (${t.stage}) sudah dipanggil. Silakan menuju klinik.`,
      patientId: t.patientId,
      refType: "QUEUE",
      refId: t.id,
    });
    await prisma.queueTicket.update({ where: { id: ticketId }, data: { waNotifiedAt: new Date() } });
  }
  revalidatePath("/antrian");
  return { ok: true };
}

export async function startServing(ticketId: string) {
  await requirePermission("queue.manage");
  await prisma.queueTicket.update({
    where: { id: ticketId },
    data: { status: "IN_PROGRESS", servedAt: new Date() },
  });
  // Update appointment status accordingly
  const t = await prisma.queueTicket.findUnique({ where: { id: ticketId } });
  if (t?.appointmentId) {
    const newStatus = t.stage === "WAITING_CONSULT" ? "IN_CONSULTATION" : t.stage === "WAITING_TREATMENT" ? "IN_TREATMENT" : undefined;
    if (newStatus) {
      await prisma.appointment.update({ where: { id: t.appointmentId }, data: { status: newStatus } });
    }
  }
  revalidatePath("/antrian");
  return { ok: true };
}

export async function completeStage(ticketId: string) {
  await requirePermission("queue.manage");
  const t = await prisma.queueTicket.findUnique({ where: { id: ticketId } });
  if (!t) return { error: "Ticket not found" };
  const idx = ORDER.indexOf(t.stage as any);
  const next = ORDER[idx + 1] ?? "DONE";
  if (next === "DONE") {
    await prisma.queueTicket.update({
      where: { id: ticketId },
      data: { stage: "DONE", status: "COMPLETED", finishedAt: new Date() },
    });
    if (t.appointmentId) {
      await prisma.appointment.update({ where: { id: t.appointmentId }, data: { status: "COMPLETED" } });
    }
  } else {
    // Generate next number with stage-prefix
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const prefix = next === "WAITING_CONSULT" ? "C" : next === "WAITING_TREATMENT" ? "T" : next === "WAITING_PHARMACY" ? "P" : "K";
    const count = await prisma.queueTicket.count({ where: { date: today, stage: next as any } });
    const newNumber = todayQueueNumber(prefix, count + 1);
    await prisma.queueTicket.update({
      where: { id: ticketId },
      data: {
        stage: next as any,
        status: "WAITING",
        number: newNumber,
        calledAt: null,
        servedAt: null,
        waNotifiedAt: null,
        history: { create: { fromStage: t.stage, toStage: next as any, toStatus: "WAITING" } },
      },
    });
  }
  revalidatePath("/antrian");
  return { ok: true };
}

export async function skipTicket(ticketId: string) {
  await requirePermission("queue.manage");
  await prisma.queueTicket.update({
    where: { id: ticketId },
    data: { status: "SKIPPED" },
  });
  revalidatePath("/antrian");
  return { ok: true };
}
