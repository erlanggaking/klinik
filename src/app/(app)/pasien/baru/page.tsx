import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PatientForm } from "../patient-form";
import { prisma } from "@/lib/prisma";

export default async function NewPatientPage() {
  await requirePermission("patient.write");
  const tiers = await prisma.membershipTier.findMany({ where: { isActive: true } });
  return (
    <div className="space-y-6">
      <PageHeader title="Pasien Baru" description="Daftarkan pasien baru ke sistem." />
      <Card>
        <CardContent className="pt-6">
          <PatientForm tiers={tiers.map((t) => ({ id: t.id, name: t.name }))} />
        </CardContent>
      </Card>
    </div>
  );
}
