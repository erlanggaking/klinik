"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { nextCode } from "@/lib/codes";
import { currentStock } from "@/lib/inventory";

export async function startOpname() {
  await requirePermission("inventory.opname");
  const code = await nextCode("OP");
  // Snapshot all active items dengan stok saat ini
  const items = await prisma.inventoryItem.findMany({ where: { isActive: true } });
  const opname = await prisma.stockOpname.create({
    data: {
      code,
      status: "IN_PROGRESS",
      items: {
        create: await Promise.all(
          items.map(async (it) => ({
            itemId: it.id,
            systemQty: new Decimal(await currentStock(it.id)),
            physicalQty: new Decimal(await currentStock(it.id)),
            diff: new Decimal(0),
          }))
        ),
      },
    },
  });
  revalidatePath("/inventory/opname");
  return { id: opname.id };
}

export async function updateOpnamePhysical(opnameId: string, items: { id: string; physicalQty: number; note?: string }[]) {
  await requirePermission("inventory.opname");
  for (const it of items) {
    const cur = await prisma.stockOpnameItem.findUnique({ where: { id: it.id } });
    if (!cur) continue;
    const phys = new Decimal(it.physicalQty);
    await prisma.stockOpnameItem.update({
      where: { id: it.id },
      data: {
        physicalQty: phys,
        diff: phys.minus(cur.systemQty),
        note: it.note,
      },
    });
  }
  revalidatePath(`/inventory/opname`);
  return { ok: true };
}

export async function commitOpname(opnameId: string) {
  await requirePermission("inventory.opname");
  const op = await prisma.stockOpname.findUnique({
    where: { id: opnameId },
    include: { items: true },
  });
  if (!op) return { error: "Opname tidak ditemukan" };

  for (const it of op.items) {
    const diff = Number(it.diff);
    if (diff === 0) continue;
    await prisma.stockMovement.create({
      data: {
        itemId: it.itemId,
        movementType: diff > 0 ? "OPNAME_IN" : "OPNAME_OUT",
        quantity: new Decimal(diff),
        refType: "OPNAME",
        refId: op.id,
        reason: it.note ?? "Stock opname adjustment",
      },
    });
    if (diff > 0) {
      // Tambah stock ke batch latest atau buat batch baru "OPNAME-yyyymm"
      const monthKey = new Date().toISOString().slice(0, 7);
      const batchNo = `OPNAME-${monthKey}`;
      const existing = await prisma.inventoryBatch.findUnique({
        where: { itemId_batchNo: { itemId: it.itemId, batchNo } },
      });
      if (existing) {
        await prisma.inventoryBatch.update({
          where: { id: existing.id },
          data: { quantity: { increment: new Decimal(diff) } },
        });
      } else {
        await prisma.inventoryBatch.create({
          data: { itemId: it.itemId, batchNo, quantity: new Decimal(diff), initialQty: new Decimal(diff), expiredAt: null },
        });
      }
    }
  }

  await prisma.stockOpname.update({
    where: { id: opnameId },
    data: { status: "COMMITTED", finishedAt: new Date() },
  });
  revalidatePath("/inventory/opname");
  return { ok: true };
}
