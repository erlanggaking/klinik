import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatIDR } from "@/lib/format";
import { PerformTreatmentForm } from "./perform-treatment-form";
import { PrescriptionBuilder } from "./prescription-builder";
import { CloseVisitButton } from "./close-visit-button";

export const dynamic = "force-dynamic";

export default async function MedicalRecordDetailPage({ params }: { params: { id: string } }) {
  await requirePermission("medical_record.read");
  const mr = await prisma.medicalRecord.findUnique({
    where: { id: params.id },
    include: {
      patient: { include: { membershipTier: true, treatmentPackages: { where: { status: "ACTIVE" }, include: { package: { include: { items: { include: { treatment: true } } } } } } } },
      diagnoses: true,
      treatmentItems: { include: { treatment: true, performedBy: { include: { user: true } } } },
      prescriptions: { include: { items: { include: { item: true } } } },
      appointment: true,
    },
  });
  if (!mr) notFound();

  const [treatments, staffs, drugs, products] = await Promise.all([
    prisma.treatment.findMany({ where: { isActive: true }, orderBy: { nameId: "asc" } }),
    prisma.staffProfile.findMany({ where: { staffType: { in: ["DOCTOR", "THERAPIST"] } }, include: { user: true } }),
    prisma.inventoryItem.findMany({ where: { isActive: true, itemType: "DRUG" }, orderBy: { nameId: "asc" } }),
    prisma.inventoryItem.findMany({ where: { isActive: true, itemType: "SKINCARE" }, orderBy: { nameId: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Rekam Medis ${mr.code}`}
        description={`${mr.patient.fullName} (${mr.patient.mrn}) · ${formatDateTime(mr.visitDate)}`}
        actions={mr.appointment ? <Badge variant="outline">Appt: {mr.appointment.code}</Badge> : null}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Anamnesa & Plan</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row k="Keluhan" v={mr.chiefComplaint ?? "-"} />
            <Row k="Riwayat" v={mr.historyOfIllness ?? "-"} />
            <Row k="Alergi" v={mr.allergies ?? "-"} />
            <Row k="Obat saat ini" v={mr.currentMeds ?? "-"} />
            <Row k="Fitzpatrick" v={mr.fitzpatrick ?? "-"} />
            <Row k="Diagnosa Utama" v={mr.diagnoses.find((d: any) => d.isPrimary)?.label ?? "-"} />
            <Row k="Plan" v={mr.plan ?? "-"} />
            <Row k="Catatan Dokter" v={mr.doctorNotes ?? "-"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pasien</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row k="MRN" v={mr.patient.mrn} />
            <Row k="Telp" v={mr.patient.phone} />
            <Row k="Membership" v={mr.patient.membershipTier?.name ?? "—"} />
            <Row k="Alergi (umum)" v={mr.patient.knownAllergies ?? "-"} />
            <Row k="Skin Type" v={mr.patient.skinType ?? "-"} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Treatment Dilakukan</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {mr.treatmentItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada treatment dilakukan.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {mr.treatmentItems.map((ti: any) => (
                <li key={ti.id} className="flex items-center justify-between rounded border p-2">
                  <div>
                    <div className="font-medium">{ti.treatment.nameId}</div>
                    <div className="text-xs text-muted-foreground">
                      Qty {Number(ti.qty)} · {ti.performedBy?.user.name ?? "—"} · {formatDateTime(ti.performedAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    {Number(ti.total) === 0 ? (
                      <Badge variant="info">Dari Paket</Badge>
                    ) : (
                      <span className="font-medium">{formatIDR(Number(ti.total))}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <PerformTreatmentForm
            medicalRecordId={mr.id}
            treatments={treatments.map((t: any) => ({ id: t.id, label: `${t.nameId} — ${formatIDR(Number(t.price))}` }))}
            staff={staffs.map((s: any) => ({ id: s.id, label: `${s.user.name} (${s.staffType})` }))}
            patientPackages={mr.patient.treatmentPackages.map((pp: any) => ({
              id: pp.id,
              label: `${pp.package.nameId}`,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Resep</CardTitle></CardHeader>
        <CardContent>
          {mr.prescriptions.length > 0 ? (
            <ul className="mb-4 space-y-2 text-sm">
              {mr.prescriptions.map((rx: any) => (
                <li key={rx.id} className="rounded border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs">{rx.code}</span>
                    <Badge variant={rx.status === "DISPENSED" ? "success" : "outline"}>{rx.status}</Badge>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm">
                    {rx.items.map((it: any) => (
                      <li key={it.id} className="flex justify-between">
                        <span>{it.compoundName ?? it.item?.nameId} × {Number(it.qty)} {it.unit}{it.dosage ? ` · ${it.dosage}` : ""}</span>
                        <span className="text-muted-foreground">{formatIDR(Number(it.total))}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : null}
          <PrescriptionBuilder
            medicalRecordId={mr.id}
            doctors={staffs.filter((s: any) => s.staffType === "DOCTOR").map((s: any) => ({ id: s.id, label: s.user.name }))}
            drugs={drugs.map((d: any) => ({ id: d.id, label: `${d.nameId} (${d.unit})`, price: Number(d.sellingPrice) }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Selesaikan Kunjungan</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Klik untuk membuat invoice & memajukan pasien ke antrian kasir. Setelah ini, pasien akan muncul di antrian Kasir.
          </p>
          <CloseVisitButton
            medicalRecordId={mr.id}
            prescriptionId={mr.prescriptions[0]?.id ?? null}
            products={products.map((p: any) => ({ id: p.id, label: `${p.nameId} — ${formatIDR(Number(p.sellingPrice))}` }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
      <div className="text-muted-foreground">{k}</div>
      <div className="text-right">{v}</div>
    </div>
  );
}
