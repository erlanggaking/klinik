"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { nextCode } from "@/lib/codes";

export async function createPO(formData: FormData) {
  await requirePermission("po.write");
  const supplierId = String(formData.get("supplierId") ?? "");
  const itemsRaw = String(formData.get("items") ?? "[]");
  let items: { itemId: string; qty: number; unitCost: number; batchNo?: string; expiredAt?: string }[] = [];
  try { items = JSON.parse(itemsRaw); } catch {}
  if (!supplierId || items.length === 0) return { error: "Supplier & item wajib" };

  const code = await nextCode("PO");
  const subtotal = items.reduce((s, i) => s + i.qty * i.unitCost, 0);

  const po = await prisma.purchaseOrder.create({
    data: {
      code,
      supplierId,
      status: "ORDERED",
      orderedAt: new Date(),
      subtotal: new Decimal(subtotal),
      grandTotal: new Decimal(subtotal),
      items: {
        create: items.map((i) => ({
          itemId: i.itemId,
          qty: new Decimal(i.qty),
          unitCost: new Decimal(i.unitCost),
          total: new Decimal(i.qty * i.unitCost),
          batchNo: i.batchNo ?? null,
          expiredAt: i.expiredAt ? new Date(i.expiredAt) : null,
        })),
      },
    },
  });
  revalidatePath("/inventory/po");
  return { id: po.id };
}

/** Receive PO: tambah ke inventory batch + stock movement. */
export async function receivePO(poId: string) {
  await requirePermission("po.write");
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { items: true },
  });
  if (!po) return { error: "PO tidak ditemukan" };
  if (po.status === "RECEIVED") return { error: "PO sudah diterima" };

  for (const it of po.items) {
    const batchNo = it.batchNo ?? `PO-${po.code}-${it.id.slice(-4)}`;
    await prisma.inventoryBatch.upsert({
      where: { itemId_batchNo: { itemId: it.itemId, batchNo } },
      update: {
        quantity: { increment: it.qty },
      },
      create: {
        itemId: it.itemId,
        batchNo,
        expiredAt: it.expiredAt,
        quantity: it.qty,
        initialQty: it.qty,
        costPrice: it.unitCost,
        supplierId: po.supplierId,
        poItemId: it.id,
      },
    });
    await prisma.stockMovement.create({
      data: {
        itemId: it.itemId,
        movementType: "PURCHASE_IN",
        quantity: it.qty,
        refType: "PO",
        refId: po.id,
        reason: `Penerimaan PO ${po.code}`,
      },
    });
    await prisma.purchaseOrderItem.update({
      where: { id: it.id },
      data: { receivedQty: it.qty },
    });
  }

  await prisma.purchaseOrder.update({
    where: { id: poId },
    data: { status: "RECEIVED", receivedAt: new Date() },
  });
  revalidatePath("/inventory/po");
  revalidatePath("/inventory");
  return { ok: true };
}
