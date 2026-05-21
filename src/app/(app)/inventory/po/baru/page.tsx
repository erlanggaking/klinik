import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { POBuilder } from "./builder";

export const dynamic = "force-dynamic";

export default async function NewPOPage() {
  await requirePermission("po.write");
  const [suppliers, items] = await Promise.all([
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.inventoryItem.findMany({ where: { isActive: true }, orderBy: { nameId: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Purchase Order Baru" />
      <Card>
        <CardContent className="pt-6">
          <POBuilder
            suppliers={suppliers.map((s) => ({ id: s.id, label: s.name }))}
            items={items.map((i) => ({ id: i.id, label: `${i.nameId} (${i.unit})`, costPrice: Number(i.costPrice) }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
