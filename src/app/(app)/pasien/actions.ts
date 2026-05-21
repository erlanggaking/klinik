"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { nextCode } from "@/lib/codes";
import { revalidatePath } from "next/cache";

export async function createPatient(formData: FormData) {
  await requirePermission("patient.write");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!firstName || !phone) return { error: "Nama depan & telepon wajib diisi" };
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  const mrn = await nextCode("PT");
  const referralCode = `REF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  try {
    const consent = formData.get("consentSigned") === "on";
    const tierId = String(formData.get("membershipTierId") ?? "") || null;
    const birthRaw = String(formData.get("birthDate") ?? "");
    const data: any = {
      mrn,
      firstName,
      lastName: lastName || null,
      fullName: fullName || firstName,
      phone,
      email: String(formData.get("email") ?? "") || null,
      gender: (String(formData.get("gender") ?? "") as any) || null,
      birthDate: birthRaw ? new Date(birthRaw) : null,
      idNumber: String(formData.get("idNumber") ?? "") || null,
      occupation: String(formData.get("occupation") ?? "") || null,
      address: String(formData.get("address") ?? "") || null,
      emergencyName: String(formData.get("emergencyName") ?? "") || null,
      emergencyPhone: String(formData.get("emergencyPhone") ?? "") || null,
      skinType: String(formData.get("skinType") ?? "") || null,
      knownAllergies: String(formData.get("knownAllergies") ?? "") || null,
      membershipTierId: tierId,
      membershipSince: tierId ? new Date() : null,
      consentSigned: consent,
      consentSignedAt: consent ? new Date() : null,
      referralCode,
    };
    const p = await prisma.patient.create({ data });
    revalidatePath("/pasien");
    return { id: p.id };
  } catch (e: any) {
    return { error: e?.message ?? "Gagal menyimpan pasien" };
  }
}
