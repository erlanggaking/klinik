"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const COOKIE = "patient-session";

export async function portalLogin(phone: string, mrn: string) {
  const p = await prisma.patient.findFirst({
    where: { phone: phone.trim(), mrn: mrn.trim().toUpperCase() },
  });
  if (!p) return { error: "Data tidak cocok. Cek nomor WA & MRN kamu." };
  cookies().set(COOKIE, p.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 hari
    path: "/",
  });
  return { ok: true };
}

export async function portalLogout() {
  cookies().delete(COOKIE);
}

export async function getPortalPatient() {
  const id = cookies().get(COOKIE)?.value;
  if (!id) return null;
  return prisma.patient.findUnique({
    where: { id },
    include: {
      membershipTier: true,
      appointments: { orderBy: { startAt: "desc" }, take: 10 },
      medicalRecords: { orderBy: { visitDate: "desc" }, take: 5 },
      invoices: { orderBy: { issuedAt: "desc" }, take: 10 },
      treatmentPackages: { include: { package: true } },
      loyaltyLedger: { orderBy: { occurredAt: "desc" }, take: 10 },
    },
  });
}
