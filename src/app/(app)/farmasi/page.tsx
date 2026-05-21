import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { dispenseRxForm } from "./actions";

export const dynamic = "force-dynamic";

export default async function FarmasiPage() {
  await requirePermission("prescription.read");
  const list = await prisma.prescription.findMany({
    where: { status: "ISSUED" },
    include: { patient: true, doctor: { include: { user: true } }, items: true },
    orderBy: { issuedAt: "asc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Farmasi" description="Resep yang menunggu disiapkan & diberikan ke pasien." />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Pasien</TableHead>
                <TableHead>Dokter</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">Tidak ada resep menunggu.</TableCell></TableRow>
              ) : (
                list.map((rx: any) => (
                  <TableRow key={rx.id}>
                    <TableCell className="font-mono text-xs">{rx.code}</TableCell>
                    <TableCell>{formatDateTime(rx.issuedAt)}</TableCell>
                    <TableCell>{rx.patient.fullName}</TableCell>
                    <TableCell>{rx.doctor.user.name}</TableCell>
                    <TableCell>{rx.items.length} item</TableCell>
                    <TableCell><Badge variant="outline">{rx.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <form action={dispenseRxForm.bind(null, rx.id)}>
                        <Button size="sm">Siapkan</Button>
                      </form>
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
