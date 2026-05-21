import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatIDR } from "@/lib/format";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function POPage() {
  await requirePermission("po.read");
  const list = await prisma.purchaseOrder.findMany({
    include: { supplier: true, items: true },
    orderBy: { orderedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Order"
        description="Pesanan ke supplier untuk re-stock."
        actions={<Button asChild><Link href="/inventory/po/baru"><Plus className="h-4 w-4" /> PO Baru</Link></Button>}
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Diorder</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">Belum ada PO.</TableCell></TableRow>
              ) : (
                list.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.code}</TableCell>
                    <TableCell>{p.supplier.name}</TableCell>
                    <TableCell>{formatDate(p.orderedAt)}</TableCell>
                    <TableCell>{p.items.length}</TableCell>
                    <TableCell>{formatIDR(Number(p.grandTotal))}</TableCell>
                    <TableCell><Badge variant="outline">{p.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost"><Link href={`/inventory/po/${p.id}`}>Buka</Link></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
