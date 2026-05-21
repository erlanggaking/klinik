import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OpnamePage() {
  await requirePermission("inventory.opname");
  const list = await prisma.stockOpname.findMany({ orderBy: { startedAt: "desc" }, include: { items: true } });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Opname"
        description="Audit fisik stok vs sistem dengan adjustment otomatis."
        actions={<Button asChild><Link href="/inventory/opname/baru"><Plus className="h-4 w-4" /> Mulai Opname</Link></Button>}
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Mulai</TableHead>
                <TableHead>Selesai</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">Belum ada opname.</TableCell></TableRow>
              ) : (
                list.map((o: any) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.code}</TableCell>
                    <TableCell>{formatDateTime(o.startedAt)}</TableCell>
                    <TableCell>{o.finishedAt ? formatDateTime(o.finishedAt) : "—"}</TableCell>
                    <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
                    <TableCell>{o.items.length}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost"><Link href={`/inventory/opname/${o.id}`}>Buka</Link></Button>
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
