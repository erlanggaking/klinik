import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/rbac";
import { PrescriptionPDF } from "@/lib/pdf/prescription";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await requireSession();
  const rx = await prisma.prescription.findUnique({
    where: { id: params.id },
    include: {
      patient: true,
      doctor: { include: { user: true } },
      items: { include: { item: true } },
    },
  });
  if (!rx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pdf = await renderToBuffer(
    PrescriptionPDF({
      prescription: {
        code: rx.code,
        issuedAt: rx.issuedAt,
        notes: rx.notes,
        signatureUrl: rx.signatureUrl,
        items: rx.items.map((it: any) => ({
          name: it.compoundName ?? it.item?.nameId ?? "—",
          qty: Number(it.qty),
          unit: it.unit,
          dosage: it.dosage,
          duration: it.duration,
          notes: it.notes,
        })),
      },
      patient: {
        fullName: rx.patient.fullName,
        mrn: rx.patient.mrn,
        birthDate: rx.patient.birthDate,
        gender: rx.patient.gender,
        knownAllergies: rx.patient.knownAllergies,
      },
      doctor: {
        name: rx.doctor.user.name,
        licenseNumber: rx.doctor.licenseNumber,
        specialty: rx.doctor.specialty,
      },
    })
  );

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Resep-${rx.code}.pdf"`,
    },
  });
}
