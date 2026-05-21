import { prisma } from "./prisma";
import { nextCode } from "./codes";
import { Decimal } from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";

/**
 * Create or update an invoice for a patient based on actual treatments
 * performed + prescription items + skincare products selected.
 * Sumber kebenaran billing: TreatmentItem (sudah dikerjakan) + PrescriptionItem.
 */
export async function buildInvoiceForVisit(args: {
  patientId: string;
  appointmentId?: string | null;
  treatmentItemIds: string[];
  prescriptionId?: string | null;
  productLines?: { inventoryItemId: string; qty: number }[];
  promoId?: string | null;
}) {
  const { patientId, appointmentId, treatmentItemIds, prescriptionId, productLines, promoId } = args;

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const code = await nextCode("INV");
    const items: any[] = [];

    let subtotal = new Decimal(0);
    let discountTotal = new Decimal(0);
    let taxTotal = new Decimal(0);

    // Treatments
    if (treatmentItemIds.length) {
      const tis = await tx.treatmentItem.findMany({
        where: { id: { in: treatmentItemIds } },
        include: { treatment: true },
      });
      for (const ti of tis) {
        const total = new Decimal(ti.total);
        subtotal = subtotal.plus(total);
        discountTotal = discountTotal.plus(ti.discountAmount);
        items.push({
          itemType: "TREATMENT",
          treatmentId: ti.treatmentId,
          description: ti.treatment.nameId,
          qty: ti.qty,
          unitPrice: ti.unitPrice,
          discountPct: ti.discountPct,
          discountAmount: ti.discountAmount,
          taxPct: new Decimal(ti.treatment.taxPct ?? 0),
          taxAmount: new Decimal(0),
          total,
          treatmentItem: { connect: { id: ti.id } },
        } as any);
      }
    }

    // Prescription
    if (prescriptionId) {
      const rx = await tx.prescription.findUnique({
        where: { id: prescriptionId },
        include: { items: { include: { item: true } } },
      });
      if (rx) {
        for (const pi of rx.items) {
          const total = new Decimal(pi.total);
          subtotal = subtotal.plus(total);
          items.push({
            itemType: "PRESCRIPTION",
            description: pi.compoundName ?? pi.item?.nameId ?? "Resep",
            qty: pi.qty,
            unitPrice: pi.unitPrice,
            discountPct: new Decimal(0),
            discountAmount: new Decimal(0),
            taxPct: new Decimal(0),
            taxAmount: new Decimal(0),
            total,
            prescriptionItem: { connect: { id: pi.id } },
            prescription: { connect: { id: rx.id } },
            inventoryItem: pi.itemId ? { connect: { id: pi.itemId } } : undefined,
          } as any);
        }
      }
    }

    // Retail product
    if (productLines?.length) {
      for (const line of productLines) {
        const inv = await tx.inventoryItem.findUnique({ where: { id: line.inventoryItemId } });
        if (!inv) continue;
        const total = new Decimal(line.qty).mul(inv.sellingPrice);
        subtotal = subtotal.plus(total);
        items.push({
          itemType: "PRODUCT",
          description: inv.nameId,
          qty: new Decimal(line.qty),
          unitPrice: inv.sellingPrice,
          discountPct: new Decimal(0),
          discountAmount: new Decimal(0),
          taxPct: new Decimal(inv.taxPct ?? 0),
          taxAmount: new Decimal(0),
          total,
          inventoryItem: { connect: { id: inv.id } },
        } as any);
      }
    }

    // Apply membership tier discount
    const patient = await tx.patient.findUnique({
      where: { id: patientId },
      include: { membershipTier: true },
    });
    if (patient?.membershipTier?.discountPct && Number(patient.membershipTier.discountPct) > 0) {
      const tierPct = new Decimal(patient.membershipTier.discountPct).div(100);
      const tierDiscount = subtotal.mul(tierPct);
      discountTotal = discountTotal.plus(tierDiscount);
    }

    // Apply promo (simple: percent or amount; capped)
    let promoDiscount = new Decimal(0);
    if (promoId) {
      const promo = await tx.promo.findUnique({ where: { id: promoId } });
      if (promo) {
        const base = subtotal.minus(discountTotal);
        if (promo.discountPct && Number(promo.discountPct) > 0) {
          promoDiscount = base.mul(new Decimal(promo.discountPct).div(100));
        } else if (promo.discountAmount && Number(promo.discountAmount) > 0) {
          promoDiscount = new Decimal(promo.discountAmount);
        }
        if (promo.maxDiscount && promoDiscount.gt(new Decimal(promo.maxDiscount))) {
          promoDiscount = new Decimal(promo.maxDiscount);
        }
        discountTotal = discountTotal.plus(promoDiscount);
        await tx.promo.update({ where: { id: promoId }, data: { usesCount: { increment: 1 } } });
      }
    }

    const grandTotal = subtotal.minus(discountTotal).plus(taxTotal);

    const invoice = await tx.invoice.create({
      data: {
        code,
        patientId,
        appointmentId: appointmentId || null,
        status: "PENDING",
        subtotal,
        discountTotal,
        taxTotal,
        grandTotal,
        promoId: promoId || null,
        items: { create: items as any },
      },
    });

    return invoice;
  });
}
