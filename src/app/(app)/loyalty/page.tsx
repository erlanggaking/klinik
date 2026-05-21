import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LoyaltyPage() {
  await requirePermission("loyalty.read");
  const ledger = await prisma.loyaltyLedger.findMany({
    include: { patient: true },
    orderBy: { occurredAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Loyalty" description="Ledger transaksi poin pasien (earn / redeem / bonus)." />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Pasien</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Δ Poin</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">Belum ada transaksi loyalty.</TableCell></TableRow>
              ) : (
                ledger.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell>{formatDateTime(l.occurredAt)}</TableCell>
                    <TableCell>{l.patient.fullName}</TableCell>
                    <TableCell><Badge variant="outline">{l.reason}</Badge></TableCell>
                    <TableCell className={`text-right font-semibold ${l.delta >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                      {l.delta >= 0 ? `+${l.delta}` : l.delta}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.notes ?? "-"}</TableCell>
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
