"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { deductStock } from "@/lib/inventory";

export async function dispenseRx(rxId: string) {
  await requirePermission("pharmacy.dispense");
  const rx = await prisma.prescription.findUnique({
    where: { id: rxId },
    include: { items: true },
  });
  if (!rx) return { error: "Resep tidak ditemukan" };
  if (rx.status !== "ISSUED") return { error: "Resep sudah pernah disiapkan/cancelled" };

  for (const it of rx.items) {
    if (it.itemId) {
      await deductStock({
        itemId: it.itemId,
        qty: Number(it.qty),
        reason: "PRESCRIPTION_OUT",
        refType: "PRESCRIPTION_ITEM",
        refId: it.id,
      }).catch((e) => console.error(`Stok tidak cukup untuk item ${it.itemId}:`, e));
    } else if (it.isCompound && it.compoundFormulaJson) {
      const formula = it.compoundFormulaJson as any[];
      for (const f of formula ?? []) {
        await deductStock({
          itemId: f.itemId,
          qty: Number(f.qty) * Number(it.qty),
          reason: "PRESCRIPTION_OUT",
          refType: "PRESCRIPTION_ITEM",
          refId: it.id,
        }).catch((e) => console.error(e));
      }
    }
  }

  await prisma.prescription.update({
    where: { id: rxId },
    data: { status: "DISPENSED", dispensedAt: new Date() },
  });
  revalidatePath("/farmasi");
  return { ok: true };
}

/** Form-action wrapper (returns void) for use with <form action={...}>. */
export async function dispenseRxForm(rxId: string, _formData: FormData) {
  await dispenseRx(rxId);
}
