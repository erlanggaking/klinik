"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/rbac";

export async function searchEverywhere(q: string) {
  await requireSession();
  const query = q.trim();
  if (!query) return { patients: [], invoices: [], appointments: [], records: [] };

  const [patients, invoices, appointments, records] = await Promise.all([
    prisma.patient.findMany({
      where: {
        OR: [
          { fullName: { contains: query, mode: "insensitive" } },
          { phone: { contains: query } },
          { mrn: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
    }),
    prisma.invoice.findMany({
      where: { code: { contains: query, mode: "insensitive" } },
      include: { patient: true },
      take: 5,
    }),
    prisma.appointment.findMany({
      where: { code: { contains: query, mode: "insensitive" } },
      include: { patient: true },
      take: 5,
    }),
    prisma.medicalRecord.findMany({
      where: { code: { contains: query, mode: "insensitive" } },
      include: { patient: true },
      take: 5,
    }),
  ]);

  return {
    patients: patients.map((p) => ({ id: p.id, mrn: p.mrn, fullName: p.fullName, phone: p.phone })),
    invoices: invoices.map((i) => ({ id: i.id, code: i.code, patientName: i.patient.fullName })),
    appointments: appointments.map((a) => ({ id: a.id, code: a.code, patientName: a.patient.fullName })),
    records: records.map((r) => ({ id: r.id, code: r.code, patientName: r.patient.fullName })),
  };
}
