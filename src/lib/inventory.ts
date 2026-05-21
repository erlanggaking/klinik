import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * FIFO stock allocator: allocate `qty` from the earliest-expiring available batches.
 * Returns the allocations [{batchId, qty}]. Throws if not enough stock.
 * Updates batch quantities and creates StockMovement entries within a transaction.
 */
export async function deductStock(args: {
  itemId: string;
  qty: number;
  reason: "TREATMENT_OUT" | "SALE_OUT" | "PRESCRIPTION_OUT" | "ADJUSTMENT_OUT" | "EXPIRED_OUT";
  refType: string;
  refId: string;
  byUserId?: string;
  note?: string;
}) {
  const { itemId, qty, reason, refType, refId, byUserId, note } = args;
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const item = await tx.inventoryItem.findUnique({ where: { id: itemId } });
    if (!item) throw new Error("Item not found");
    let remaining = new Decimal(qty);
    const allocations: { batchId: string; qty: Decimal }[] = [];

    if (item.isBatchTracked) {
      const batches = await tx.inventoryBatch.findMany({
        where: { itemId, quantity: { gt: 0 } },
        orderBy: [{ expiredAt: "asc" }, { receivedAt: "asc" }],
      });
      for (const b of batches) {
        if (remaining.lte(0)) break;
        const take = Decimal.min(b.quantity, remaining);
        allocations.push({ batchId: b.id, qty: take });
        remaining = remaining.minus(take);
        await tx.inventoryBatch.update({
          where: { id: b.id },
          data: { quantity: b.quantity.minus(take) },
        });
      }
      if (remaining.gt(0)) {
        throw new Error(
          `Stok tidak cukup untuk item ${item.sku}. Kurang ${remaining.toString()} ${item.unit}.`
        );
      }
      for (const a of allocations) {
        await tx.stockMovement.create({
          data: {
            itemId,
            batchId: a.batchId,
            movementType: reason,
            quantity: a.qty.negated(),
            refType,
            refId,
            byUserId,
            reason: note,
          },
        });
      }
    } else {
      // Untracked items: just record movement, no batch changes.
      await tx.stockMovement.create({
        data: {
          itemId,
          movementType: reason,
          quantity: new Decimal(qty).negated(),
          refType,
          refId,
          byUserId,
          reason: note,
        },
      });
    }
    return allocations;
  });
}

export async function currentStock(itemId: string): Promise<number> {
  const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) return 0;
  if (item.isBatchTracked) {
    const agg = await prisma.inventoryBatch.aggregate({
      where: { itemId },
      _sum: { quantity: true },
    });
    return Number(agg._sum.quantity ?? 0);
  }
  const agg = await prisma.stockMovement.aggregate({
    where: { itemId },
    _sum: { quantity: true },
  });
  return Number(agg._sum.quantity ?? 0);
}

export async function lowStockItems() {
  const items = await prisma.inventoryItem.findMany({ where: { isActive: true } });
  const result: Array<{ item: any; current: number; reorderPoint: number }> = [];
  for (const it of items) {
    const cur = await currentStock(it.id);
    if (cur <= Number(it.reorderPoint)) {
      result.push({ item: it, current: cur, reorderPoint: Number(it.reorderPoint) });
    }
  }
  return result;
}

export async function expiringBatches(daysAhead = 60) {
  const until = new Date();
  until.setDate(until.getDate() + daysAhead);
  return prisma.inventoryBatch.findMany({
    where: { expiredAt: { lte: until, gt: new Date() }, quantity: { gt: 0 } },
    include: { item: true },
    orderBy: { expiredAt: "asc" },
  });
}
