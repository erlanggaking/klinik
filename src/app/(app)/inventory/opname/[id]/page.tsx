import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { OpnameWorksheet } from "./worksheet";

export const dynamic = "force-dynamic";

export default async function OpnameDetailPage({ params }: { params: { id: string } }) {
  await requirePermission("inventory.opname");
  const op = await prisma.stockOpname.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { } },
    },
  });
  if (!op) notFound();

  // Resolve item names
  const items = await prisma.inventoryItem.findMany({
    where: { id: { in: op.items.map((i) => i.itemId) } },
  });
  const itemMap = new Map(items.map((i) => [i.id, i]));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Opname ${op.code}`}
        description={`Status: ${op.status}`}
      />
      <Card>
        <CardContent className="p-0">
          <OpnameWorksheet
            opnameId={op.id}
            committed={op.status === "COMMITTED"}
            items={op.items.map((it) => ({
              id: it.id,
              itemSku: itemMap.get(it.itemId)?.sku ?? "—",
              itemName: itemMap.get(it.itemId)?.nameId ?? "—",
              unit: itemMap.get(it.itemId)?.unit ?? "",
              systemQty: Number(it.systemQty),
              physicalQty: Number(it.physicalQty),
              note: it.note ?? "",
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
