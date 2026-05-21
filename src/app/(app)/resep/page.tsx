import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ResepPage() {
  await requirePermission("prescription.read");
  const list = await prisma.prescription.findMany({
    include: { patient: true, doctor: { include: { user: true } }, items: true },
    orderBy: { issuedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Resep" description="Riwayat resep yang diterbitkan dokter." />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Pasien</TableHead>
                <TableHead>Dokter</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">Belum ada resep.</TableCell></TableRow>
              ) : (
                list.map((rx: any) => (
                  <TableRow key={rx.id}>
                    <TableCell className="font-mono text-xs">{rx.code}</TableCell>
                    <TableCell>{formatDateTime(rx.issuedAt)}</TableCell>
                    <TableCell>{rx.patient.fullName}</TableCell>
                    <TableCell>{rx.doctor.user.name}</TableCell>
                    <TableCell>{rx.items.length} item</TableCell>
                    <TableCell><Badge variant={rx.status === "DISPENSED" ? "success" : "outline"}>{rx.status}</Badge></TableCell>
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
