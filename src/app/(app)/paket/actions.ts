"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";

export async function createPackage(formData: FormData) {
  await requirePermission("package.write");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const nameId = String(formData.get("nameId") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const validityDays = Number(formData.get("validityDays") ?? 0);
  const itemsRaw = String(formData.get("items") ?? "[]");
  let items: { treatmentId: string; sessions: number }[] = [];
  try { items = JSON.parse(itemsRaw); } catch {}
  if (!code || !nameId || items.length === 0) return { error: "Kode, nama, dan minimal 1 treatment wajib" };

  try {
    const pkg = await prisma.treatmentPackage.create({
      data: {
        code,
        nameId,
        nameEn: String(formData.get("nameEn") ?? "") || null,
        description: String(formData.get("description") ?? "") || null,
        price: new Decimal(price),
        validityDays: validityDays > 0 ? validityDays : null,
        items: {
          create: items.map((i) => ({ treatmentId: i.treatmentId, sessions: i.sessions })),
        },
      },
    });
    revalidatePath("/paket");
    return { id: pkg.id };
  } catch (e: any) {
    return { error: e?.message ?? "Gagal" };
  }
}

/** Pasien beli paket — buat PatientPackage + auto-create invoice. */
export async function sellPackage(args: { patientId: string; packageId: string }) {
  await requirePermission("package.write");
  const pkg = await prisma.treatmentPackage.findUnique({ where: { id: args.packageId } });
  if (!pkg) return { error: "Paket tidak ditemukan" };

  const expiresAt = pkg.validityDays
    ? new Date(Date.now() + pkg.validityDays * 24 * 3600 * 1000)
    : null;

  const pp = await prisma.patientPackage.create({
    data: {
      patientId: args.patientId,
      packageId: pkg.id,
      purchasedAt: new Date(),
      expiresAt,
      status: "ACTIVE",
    },
  });
  revalidatePath(`/pasien/${args.patientId}`);
  return { id: pp.id };
}
