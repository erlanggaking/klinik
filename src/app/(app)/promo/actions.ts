"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";

export async function createPromo(formData: FormData) {
  await requirePermission("promo.write");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  if (!code || !name) return { error: "Kode & nama wajib" };

  const promoType = String(formData.get("promoType") ?? "PERCENT");
  const discountPct = Number(formData.get("discountPct") ?? 0);
  const discountAmount = Number(formData.get("discountAmount") ?? 0);
  const maxDiscount = Number(formData.get("maxDiscount") ?? 0);
  const minSpend = Number(formData.get("minSpend") ?? 0);
  const isAutoApply = formData.get("isAutoApply") === "on";
  const startsAt = String(formData.get("startsAt") ?? "");
  const endsAt = String(formData.get("endsAt") ?? "");
  const startTime = String(formData.get("startTime") ?? "") || null;
  const endTime = String(formData.get("endTime") ?? "") || null;
  const targetSegment = String(formData.get("targetSegment") ?? "") || null;
  const targetTiers = formData.getAll("targetTier").map((v) => String(v)).filter(Boolean);
  const daysOfWeek = formData.getAll("dayOfWeek").map((v) => Number(v));
  const maxUsesTotal = Number(formData.get("maxUsesTotal") ?? 0);
  const maxUsesPerPatient = Number(formData.get("maxUsesPerPatient") ?? 1);

  try {
    const p = await prisma.promo.create({
      data: {
        code,
        name,
        description: String(formData.get("description") ?? "") || null,
        promoType: promoType as any,
        discountPct: discountPct > 0 ? new Decimal(discountPct) : null,
        discountAmount: discountAmount > 0 ? new Decimal(discountAmount) : null,
        maxDiscount: maxDiscount > 0 ? new Decimal(maxDiscount) : null,
        minSpend: minSpend > 0 ? new Decimal(minSpend) : null,
        isAutoApply,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        startTime,
        endTime,
        daysOfWeek,
        targetSegment: targetSegment as any,
        targetTiers,
        maxUsesTotal: maxUsesTotal > 0 ? maxUsesTotal : null,
        maxUsesPerPatient,
      },
    });
    revalidatePath("/promo");
    return { id: p.id };
  } catch (e: any) {
    return { error: e?.message ?? "Gagal" };
  }
}

export async function togglePromoActive(id: string, _formData: FormData) {
  await requirePermission("promo.write");
  const p = await prisma.promo.findUnique({ where: { id } });
  if (!p) return;
  await prisma.promo.update({ where: { id }, data: { isActive: !p.isActive } });
  revalidatePath("/promo");
}

/** Validate & lookup promo by code untuk dipakai di kasir. */
export async function lookupPromo(code: string) {
  const p = await prisma.promo.findUnique({ where: { code: code.toUpperCase() } });
  if (!p || !p.isActive) return { error: "Promo tidak ditemukan / nonaktif" };
  const now = new Date();
  if (p.startsAt && now < p.startsAt) return { error: "Promo belum berlaku" };
  if (p.endsAt && now > p.endsAt) return { error: "Promo sudah berakhir" };
  if (p.maxUsesTotal && p.usesCount >= p.maxUsesTotal) return { error: "Kuota promo habis" };
  return { promo: { id: p.id, name: p.name, discountPct: Number(p.discountPct ?? 0), discountAmount: Number(p.discountAmount ?? 0), maxDiscount: Number(p.maxDiscount ?? 0) } };
}
