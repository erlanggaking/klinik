"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function sendBlast(formData: FormData) {
  await requirePermission("message.send");
  const target = String(formData.get("target") ?? "ALL_OPTIN");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Pesan wajib" };

  let where: any = { whatsappOptIn: true, isActive: true };
  if (target === "GOLD") {
    const tiers = await prisma.membershipTier.findMany({ where: { code: { in: ["GOLD", "PLATINUM"] } } });
    where.membershipTierId = { in: tiers.map((t) => t.id) };
  } else if (target === "INACTIVE") {
    const cutoff = new Date(Date.now() - 90 * 24 * 3600 * 1000);
    where.medicalRecords = { every: { visitDate: { lt: cutoff } } };
  } else if (target === "BIRTHDAY_THIS_MONTH") {
    const m = new Date().getMonth() + 1;
    const all = await prisma.patient.findMany({ where: { whatsappOptIn: true, isActive: true, birthDate: { not: null } }, select: { id: true, birthDate: true } });
    const ids = all.filter((p) => p.birthDate && p.birthDate.getMonth() + 1 === m).map((p) => p.id);
    where.id = { in: ids };
  }

  const patients = await prisma.patient.findMany({ where });
  const clinicName = process.env.CLINIC_NAME ?? "Klinik Cantik";
  let count = 0;
  for (const p of patients) {
    const finalBody = body
      .replace(/\{\{\s*patient\.name\s*\}\}/g, p.fullName)
      .replace(/\{\{\s*clinic\.name\s*\}\}/g, clinicName);
    await prisma.messageOutbox.create({
      data: {
        channel: "WHATSAPP",
        toAddress: p.phone,
        body: finalBody,
        status: "QUEUED",
        scheduledAt: new Date(),
        patientId: p.id,
        refType: "BLAST",
      },
    });
    count++;
  }
  revalidatePath("/wa");
  return { count };
}
