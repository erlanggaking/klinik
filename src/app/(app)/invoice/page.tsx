import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDateTime, formatIDR } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, any> = {
  DRAFT: "outline", PENDING: "warning", PARTIALLY_PAID: "info",
  PAID: "success", VOID: "destructive", REFUNDED: "destructive",
};

export default async function InvoicePage() {
  await requirePermission("invoice.read");
  const list = await prisma.invoice.findMany({
    include: { patient: true },
    orderBy: { issuedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Invoice" description="Daftar semua invoice." />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Pasien</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Dibayar</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">Belum ada invoice.</TableCell></TableRow>
              ) : (
                list.map((iv: any) => (
                  <TableRow key={iv.id}>
                    <TableCell className="font-mono text-xs">{iv.code}</TableCell>
                    <TableCell>{formatDateTime(iv.issuedAt)}</TableCell>
                    <TableCell>{iv.patient.fullName}</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[iv.status]}>{iv.status}</Badge></TableCell>
                    <TableCell>{formatIDR(Number(iv.grandTotal))}</TableCell>
                    <TableCell>{formatIDR(Number(iv.paidTotal))}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/kasir/${iv.id}`}>Buka</Link>
                      </Button>
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
