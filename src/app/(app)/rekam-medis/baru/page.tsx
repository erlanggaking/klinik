import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { MedicalRecordForm } from "../mr-form";

export const dynamic = "force-dynamic";

export default async function NewMedicalRecordPage({ searchParams }: { searchParams: { patientId?: string; appointmentId?: string } }) {
  await requirePermission("medical_record.write");
  const patients = await prisma.patient.findMany({ orderBy: { fullName: "asc" }, take: 500 });
  return (
    <div className="space-y-6">
      <PageHeader title="Rekam Medis Baru" description="Buat catatan kunjungan baru." />
      <Card>
        <CardContent className="pt-6">
          <MedicalRecordForm
            initialPatientId={searchParams.patientId}
            initialAppointmentId={searchParams.appointmentId}
            patients={patients.map((p) => ({ id: p.id, label: `${p.fullName} (${p.mrn})` }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
