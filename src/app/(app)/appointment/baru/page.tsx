import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { AppointmentForm } from "../appointment-form";

export const dynamic = "force-dynamic";

export default async function NewAppointmentPage({ searchParams }: { searchParams: { patientId?: string } }) {
  await requirePermission("appointment.write");
  const [patients, treatments, doctors] = await Promise.all([
    prisma.patient.findMany({ where: { isActive: true }, orderBy: { fullName: "asc" }, take: 500 }),
    prisma.treatment.findMany({ where: { isActive: true }, orderBy: { nameId: "asc" } }),
    prisma.staffProfile.findMany({ where: { staffType: { in: ["DOCTOR", "THERAPIST"] } }, include: { user: true } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Buat Appointment" description="Pilih pasien, treatment, dokter, dan jam." />
      <Card>
        <CardContent className="pt-6">
          <AppointmentForm
            initialPatientId={searchParams.patientId}
            patients={patients.map((p) => ({ id: p.id, label: `${p.fullName} (${p.mrn})` }))}
            treatments={treatments.map((t) => ({ id: t.id, label: `${t.nameId} (${t.durationMinutes}m)`, duration: t.durationMinutes }))}
            doctors={doctors.map((d) => ({ id: d.id, label: `${d.user.name} (${d.staffType})` }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
