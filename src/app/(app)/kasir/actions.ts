"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { buildInvoiceForVisit } from "@/lib/billing";
import { lookupPromo } from "../promo/actions";

export async function recordPayment(invoiceId: string, formData: FormData) {
  await requirePermission("kasir.operate");
  const method = String(formData.get("method") ?? "CASH");
  const amount = Number(formData.get("amount") ?? 0);
  const reference = String(formData.get("reference") ?? "") || null;
  const cashAccountId = String(formData.get("cashAccountId") ?? "") || null;

  if (!amount || amount <= 0) return { error: "Jumlah tidak valid" };

  return prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.findUnique({ where: { id: invoiceId }, include: { patient: true } });
    if (!inv) return { error: "Invoice tidak ditemukan" };

    const newPaid = Number(inv.paidTotal) + amount;
    const grandTotal = Number(inv.grandTotal);

    let cashEntry: any = null;
    if (cashAccountId) {
      cashEntry = await tx.cashEntry.create({
        data: {
          accountId: cashAccountId,
          entryType: "IN",
          amount: new Decimal(amount),
          category: "REVENUE",
          refType: "PAYMENT",
          refId: invoiceId,
          description: `Pembayaran invoice ${inv.code}`,
          occurredAt: new Date(),
        },
      });
    }

    await tx.payment.create({
      data: {
        invoiceId,
        method: method as any,
        amount: new Decimal(amount),
        reference,
        cashEntryId: cashEntry?.id,
      },
    });

    const status =
      newPaid >= grandTotal - 0.0001
        ? "PAID"
        : newPaid > 0
        ? "PARTIALLY_PAID"
        : inv.status;

    await tx.invoice.update({
      where: { id: invoiceId },
      data: { paidTotal: new Decimal(newPaid), status: status as any },
    });

    // If fully paid: award loyalty points + advance queue + create follow-up tasks
    if (status === "PAID") {
      const points = Math.floor(grandTotal / 1000); // 1 point per 1000 IDR (sederhana)
      if (points > 0) {
        await tx.loyaltyLedger.create({
          data: {
            patientId: inv.patientId,
            delta: points,
            reason: "EARN_TRANSACTION",
            invoiceId,
            notes: `Earn dari invoice ${inv.code}`,
          },
        });
        await tx.patient.update({
          where: { id: inv.patientId },
          data: { loyaltyPoints: { increment: points } },
        });
        await tx.invoice.update({
          where: { id: invoiceId },
          data: { pointsEarned: points },
        });
      }
      // Queue: kalau ada antrian aktif di WAITING_CASHIER, complete it
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const ticket = await tx.queueTicket.findFirst({
        where: {
          patientId: inv.patientId,
          date: today,
          stage: "WAITING_CASHIER",
          status: { in: ["WAITING", "IN_PROGRESS", "CALLED"] },
        },
      });
      if (ticket) {
        await tx.queueTicket.update({
          where: { id: ticket.id },
          data: { stage: "DONE", status: "COMPLETED", finishedAt: new Date() },
        });
        if (ticket.appointmentId) {
          await tx.appointment.update({
            where: { id: ticket.appointmentId },
            data: { status: "COMPLETED" },
          });
        }
      }
    }

    revalidatePath(`/kasir/${invoiceId}`);
    revalidatePath("/kasir");
    revalidatePath("/antrian");
    return { ok: true };
  });
}

export async function createRetailInvoice(formData: FormData) {
  await requirePermission("kasir.operate");
  const patientId = String(formData.get("patientId") ?? "");
  const promoCode = String(formData.get("promoCode") ?? "").trim();
  const linesRaw = String(formData.get("lines") ?? "[]");
  let lines: { inventoryItemId: string; qty: number }[] = [];
  try { lines = JSON.parse(linesRaw); } catch {}
  if (!patientId || lines.length === 0) return { error: "Pasien & produk wajib" };

  let promoId: string | null = null;
  if (promoCode) {
    const r = await lookupPromo(promoCode);
    if ((r as any).promo) promoId = (r as any).promo.id;
  }

  const inv = await buildInvoiceForVisit({
    patientId,
    treatmentItemIds: [],
    productLines: lines,
    promoId,
  });
  return { id: inv.id };
}
