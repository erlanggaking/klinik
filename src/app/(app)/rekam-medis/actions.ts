"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { nextCode, todayQueueNumber } from "@/lib/codes";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { deductStock } from "@/lib/inventory";
import { buildInvoiceForVisit } from "@/lib/billing";

export async function createMedicalRecord(formData: FormData) {
  await requirePermission("medical_record.write");
  const patientId = String(formData.get("patientId") ?? "");
  const appointmentId = String(formData.get("appointmentId") ?? "") || null;
  if (!patientId) return { error: "Pasien wajib diisi" };
  const code = await nextCode("MR");
  const mr = await prisma.medicalRecord.create({
    data: {
      code,
      patientId,
      appointmentId: appointmentId || undefined,
      chiefComplaint: String(formData.get("chiefComplaint") ?? "") || null,
      historyOfIllness: String(formData.get("historyOfIllness") ?? "") || null,
      allergies: String(formData.get("allergies") ?? "") || null,
      currentMeds: String(formData.get("currentMeds") ?? "") || null,
      doctorNotes: String(formData.get("doctorNotes") ?? "") || null,
      plan: String(formData.get("plan") ?? "") || null,
      fitzpatrick: String(formData.get("fitzpatrick") ?? "") || null,
    },
  });
  // Diagnoses
  const diagLabel = String(formData.get("diagnosisPrimary") ?? "").trim();
  if (diagLabel) {
    await prisma.diagnosis.create({
      data: {
        medicalRecordId: mr.id,
        label: diagLabel,
        isPrimary: true,
      },
    });
  }
  if (appointmentId) {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "IN_TREATMENT" },
    });
  }
  revalidatePath("/rekam-medis");
  return { id: mr.id };
}

export async function performTreatment(formData: FormData) {
  await requirePermission("treatment.perform");
  const medicalRecordId = String(formData.get("medicalRecordId") ?? "");
  const treatmentId = String(formData.get("treatmentId") ?? "");
  const performedById = String(formData.get("performedById") ?? "") || null;
  const qty = Number(formData.get("qty") ?? 1);
  const usePackage = formData.get("usePackage") === "on";
  const patientPackageId = String(formData.get("patientPackageId") ?? "") || null;
  if (!medicalRecordId || !treatmentId) return { error: "MR & treatment wajib" };

  return prisma.$transaction(async (tx) => {
    const mr = await tx.medicalRecord.findUnique({ where: { id: medicalRecordId } });
    if (!mr) return { error: "Rekam medis tidak ditemukan" };
    const treatment = await tx.treatment.findUnique({
      where: { id: treatmentId },
      include: { consumables: true },
    });
    if (!treatment) return { error: "Treatment tidak ditemukan" };

    let unitPrice = new Decimal(treatment.price);
    let total = unitPrice.mul(qty);
    let usageId: string | null = null;

    if (usePackage && patientPackageId) {
      const pp = await tx.patientPackage.findUnique({
        where: { id: patientPackageId },
        include: { package: { include: { items: true } } },
      });
      if (pp && pp.status === "ACTIVE") {
        const usagesUsed = await tx.patientPackageUsage.count({ where: { patientPackageId } });
        const totalSessions = pp.package.items.reduce((s, it) => s + it.sessions, 0);
        if (usagesUsed < totalSessions) {
          // Pakai paket: gak ditagih
          unitPrice = new Decimal(0);
          total = new Decimal(0);
          const usage = await tx.patientPackageUsage.create({
            data: { patientPackageId, treatmentId, usedAt: new Date() },
          });
          usageId = usage.id;
          if (usagesUsed + 1 >= totalSessions) {
            await tx.patientPackage.update({
              where: { id: patientPackageId },
              data: { status: "EXHAUSTED" },
            });
          }
        }
      }
    }

    const ti = await tx.treatmentItem.create({
      data: {
        medicalRecordId,
        patientId: mr.patientId,
        treatmentId,
        performedById: performedById || undefined,
        qty,
        unitPrice,
        discountPct: new Decimal(0),
        discountAmount: new Decimal(0),
        total,
        outcome: "SUCCESS",
        patientPackageUsageId: usageId,
      },
    });

    if (usageId) {
      await tx.patientPackageUsage.update({
        where: { id: usageId },
        data: { treatmentItemId: ti.id },
      });
    }

    // Auto-deduct consumables (per treatment.consumables × qty)
    for (const c of treatment.consumables) {
      await deductStock({
        itemId: c.itemId,
        qty: Number(c.qty) * qty,
        reason: "TREATMENT_OUT",
        refType: "TREATMENT_ITEM",
        refId: ti.id,
      });
    }

    revalidatePath(`/rekam-medis/${medicalRecordId}`);
    return { id: ti.id };
  });
}

export async function issuePrescription(formData: FormData) {
  await requirePermission("prescription.write");
  const medicalRecordId = String(formData.get("medicalRecordId") ?? "");
  const doctorId = String(formData.get("doctorId") ?? "");
  const linesRaw = String(formData.get("lines") ?? "[]");
  if (!medicalRecordId || !doctorId) return { error: "MR & dokter wajib" };
  let lines: any[] = [];
  try { lines = JSON.parse(linesRaw); } catch {}
  if (lines.length === 0) return { error: "Tambahkan minimal 1 item resep" };

  const mr = await prisma.medicalRecord.findUnique({ where: { id: medicalRecordId } });
  if (!mr) return { error: "MR tidak ditemukan" };
  const code = await nextCode("RX");

  const rx = await prisma.prescription.create({
    data: {
      code,
      patientId: mr.patientId,
      medicalRecordId,
      doctorId,
      status: "ISSUED",
      items: {
        create: lines.map((l) => ({
          itemId: l.itemId || null,
          isCompound: !!l.isCompound,
          compoundName: l.compoundName ?? null,
          qty: new Decimal(l.qty || 1),
          unit: l.unit ?? "pcs",
          dosage: l.dosage ?? null,
          duration: l.duration ?? null,
          notes: l.notes ?? null,
          unitPrice: new Decimal(l.unitPrice || 0),
          total: new Decimal((l.unitPrice || 0) * (l.qty || 1)),
        })),
      },
    },
  });
  revalidatePath(`/rekam-medis/${medicalRecordId}`);
  revalidatePath("/farmasi");
  return { id: rx.id };
}

/** Closes the visit: creates invoice, advances queue to cashier. */
export async function closeVisit(formData: FormData) {
  await requirePermission("medical_record.write");
  const medicalRecordId = String(formData.get("medicalRecordId") ?? "");
  const prescriptionId = String(formData.get("prescriptionId") ?? "") || null;
  const productLinesRaw = String(formData.get("productLines") ?? "[]");
  let productLines: any[] = [];
  try { productLines = JSON.parse(productLinesRaw); } catch {}

  const mr = await prisma.medicalRecord.findUnique({
    where: { id: medicalRecordId },
    include: { treatmentItems: true },
  });
  if (!mr) return { error: "MR tidak ditemukan" };

  // Hanya treatment item dengan total > 0 yang ditagih (yang gratis dari paket diskip)
  const billable = mr.treatmentItems.filter((t: any) => Number(t.total) > 0).map((t: any) => t.id);

  const invoice = await buildInvoiceForVisit({
    patientId: mr.patientId,
    appointmentId: mr.appointmentId,
    treatmentItemIds: billable,
    prescriptionId,
    productLines,
  });

  // Advance queue to cashier
  if (mr.appointmentId) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const ticket = await prisma.queueTicket.findFirst({
      where: { appointmentId: mr.appointmentId, status: { in: ["WAITING", "IN_PROGRESS", "CALLED"] } },
    });
    if (ticket && ticket.stage !== "DONE") {
      const count = await prisma.queueTicket.count({ where: { date: today, stage: "WAITING_CASHIER" } });
      const number = todayQueueNumber("K", count + 1);
      await prisma.queueTicket.update({
        where: { id: ticket.id },
        data: {
          stage: "WAITING_CASHIER",
          status: "WAITING",
          number,
          calledAt: null, servedAt: null, waNotifiedAt: null,
          history: { create: { fromStage: ticket.stage, toStage: "WAITING_CASHIER", toStatus: "WAITING" } },
        },
      });
    }
  }

  revalidatePath(`/rekam-medis/${medicalRecordId}`);
  revalidatePath("/kasir");
  revalidatePath("/antrian");
  return { invoiceId: invoice.id, code: invoice.code };
}
