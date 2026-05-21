import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatIDR } from "@/lib/format";
import { currentStock } from "@/lib/inventory";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_BADGE: Record<string, any> = {
  DRUG: "info",
  SKINCARE: "secondary",
  CONSUMABLE: "warning",
  EQUIPMENT: "outline",
  OTHER: "outline",
};

export default async function InventoryPage({ searchParams }: { searchParams: { type?: string } }) {
  await requirePermission("inventory.read");
  const items = await prisma.inventoryItem.findMany({
    where: searchParams.type ? { itemType: searchParams.type as any } : undefined,
    orderBy: { nameId: "asc" },
    include: { category: true },
  });
  const stocks = await Promise.all(items.map((it) => currentStock(it.id).then((q) => [it.id, q] as const)));
  const stockMap = new Map(stocks);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Daftar semua item: obat, skincare jual, consumables, alat."
        actions={
          <Button asChild>
            <Link href="/inventory/baru"><Plus className="h-4 w-4" /> Item Baru</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {[["", "Semua"], ["DRUG", "Obat"], ["SKINCARE", "Skincare"], ["CONSUMABLE", "Consumables"], ["EQUIPMENT", "Alat"]].map(([k, l]) => (
          <Button key={k} asChild variant={searchParams.type === k || (!searchParams.type && k === "") ? "default" : "outline"} size="sm">
            <Link href={k ? `?type=${k}` : "/inventory"}>{l}</Link>
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Reorder Pt.</TableHead>
                <TableHead>Harga Jual</TableHead>
                <TableHead>Batch?</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    Belum ada item.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((it: any) => {
                  const qty = stockMap.get(it.id) ?? 0;
                  const low = qty <= Number(it.reorderPoint);
                  return (
                    <TableRow key={it.id}>
                      <TableCell className="font-mono text-xs">{it.sku}</TableCell>
                      <TableCell>
                        <div className="font-medium">{it.nameId}</div>
                        {it.category ? <div className="text-xs text-muted-foreground">{it.category.nameId}</div> : null}
                      </TableCell>
                      <TableCell><Badge variant={TYPE_BADGE[it.itemType]}>{it.itemType}</Badge></TableCell>
                      <TableCell>
                        <span className={low ? "font-semibold text-amber-600" : ""}>
                          {qty} {it.unit}
                        </span>
                        {low ? <Badge variant="warning" className="ml-2">LOW</Badge> : null}
                      </TableCell>
                      <TableCell>{Number(it.reorderPoint)} {it.unit}</TableCell>
                      <TableCell>{formatIDR(Number(it.sellingPrice))}</TableCell>
                      <TableCell>{it.isBatchTracked ? "✓" : "-"}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
