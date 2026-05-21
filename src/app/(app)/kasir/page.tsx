import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatIDR } from "@/lib/format";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function KasirPage() {
  await requirePermission("kasir.operate");

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  const [pending, paidToday, todayPayments] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: { in: ["PENDING", "PARTIALLY_PAID", "DRAFT"] } },
      include: { patient: true },
      orderBy: { issuedAt: "desc" },
      take: 50,
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { gte: today, lt: tomorrow } },
    }),
    prisma.payment.count({ where: { paidAt: { gte: today, lt: tomorrow } } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kasir"
        description={`Pendapatan hari ini: ${formatIDR(Number(paidToday._sum.amount ?? 0))} · ${todayPayments} transaksi`}
        actions={
          <Button asChild>
            <Link href="/kasir/baru"><Plus className="h-4 w-4" /> Transaksi Baru</Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Pasien</TableHead>
                <TableHead>Diterbitkan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Sudah Dibayar</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    Tidak ada invoice menunggu pembayaran.
                  </TableCell>
                </TableRow>
              ) : (
                pending.map((iv: any) => (
                  <TableRow key={iv.id}>
                    <TableCell className="font-mono text-xs">{iv.code}</TableCell>
                    <TableCell>{iv.patient.fullName}</TableCell>
                    <TableCell>{formatDateTime(iv.issuedAt)}</TableCell>
                    <TableCell><Badge variant="outline">{iv.status}</Badge></TableCell>
                    <TableCell>{formatIDR(Number(iv.grandTotal))}</TableCell>
                    <TableCell>{formatIDR(Number(iv.paidTotal))}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm">
                        <Link href={`/kasir/${iv.id}`}>Bayar</Link>
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
