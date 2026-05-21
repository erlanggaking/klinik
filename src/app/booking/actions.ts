"use server";

import { prisma } from "@/lib/prisma";
import { nextCode } from "@/lib/codes";

export async function submitPublicBooking(formData: FormData) {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const treatmentId = String(formData.get("treatmentId") ?? "");
  const startAtRaw = String(formData.get("startAt") ?? "");
  if (!firstName || !phone || !treatmentId || !startAtRaw) {
    return { error: "Mohon isi semua field wajib" };
  }

  const treatment = await prisma.treatment.findUnique({ where: { id: treatmentId } });
  if (!treatment) return { error: "Treatment tidak ditemukan" };
  const start = new Date(startAtRaw);
  const end = new Date(start.getTime() + treatment.durationMinutes * 60_000);

  // Find or create patient by phone
  let patient = await prisma.patient.findFirst({ where: { phone } });
  if (!patient) {
    const mrn = await nextCode("PT");
    patient = await prisma.patient.create({
      data: {
        mrn,
        firstName,
        lastName: lastName || null,
        fullName: [firstName, lastName].filter(Boolean).join(" "),
        phone,
        email: String(formData.get("email") ?? "") || null,
        consentSigned: false, // diisi saat datang
      },
    });
  }

  const code = await nextCode("APT");
  const appt = await prisma.appointment.create({
    data: {
      code,
      patientId: patient.id,
      startAt: start,
      endAt: end,
      status: "BOOKED",
      source: "PUBLIC",
      notes: String(formData.get("notes") ?? "") || null,
      treatments: { create: [{ treatmentId, plannedQty: 1 }] },
    },
  });

  return { code: appt.code };
}
