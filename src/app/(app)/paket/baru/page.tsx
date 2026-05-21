import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PackageBuilder } from "./package-builder";

export const dynamic = "force-dynamic";

export default async function NewPackagePage() {
  await requirePermission("package.write");
  const treatments = await prisma.treatment.findMany({
    where: { isActive: true },
    orderBy: { nameId: "asc" },
  });
  return (
    <div className="space-y-6">
      <PageHeader title="Paket Baru" description="Bundling treatment + sesi + masa berlaku." />
      <Card>
        <CardContent className="pt-6">
          <PackageBuilder
            treatments={treatments.map((t) => ({ id: t.id, label: t.nameId, price: Number(t.price) }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
