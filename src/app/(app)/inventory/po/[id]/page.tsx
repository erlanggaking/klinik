import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatIDR } from "@/lib/format";
import { receivePO } from "../actions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PODetailPage({ params }: { params: { id: string } }) {
  await requirePermission("po.read");
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: params.id },
    include: { supplier: true, items: { include: { item: true } } },
  });
  if (!po) notFound();

  async function doReceive() {
    "use server";
    await receivePO(po!.id);
    redirect(`/inventory/po/${po!.id}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`PO ${po.code}`}
        description={`${po.supplier.name} · ${formatDate(po.orderedAt)}`}
        actions={
          po.status !== "RECEIVED" && po.status !== "CANCELLED" ? (
            <form action={doReceive}>
              <Button>Terima Barang →</Button>
            </form>
          ) : null
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Detail Item</span>
            <Badge>{po.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Harga Beli</TableHead>
                <TableHead>Batch No</TableHead>
                <TableHead>Expired</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.items.map((it: any) => (
                <TableRow key={it.id}>
                  <TableCell>{it.item.nameId}</TableCell>
                  <TableCell>{Number(it.qty)} {it.item.unit}</TableCell>
                  <TableCell>{formatIDR(Number(it.unitCost))}</TableCell>
                  <TableCell>{it.batchNo ?? "—"}</TableCell>
                  <TableCell>{it.expiredAt ? formatDate(it.expiredAt) : "—"}</TableCell>
                  <TableCell className="text-right">{formatIDR(Number(it.total))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="border-t p-4 text-right">
            <span className="text-muted-foreground">Total: </span>
            <span className="text-lg font-semibold">{formatIDR(Number(po.grandTotal))}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
