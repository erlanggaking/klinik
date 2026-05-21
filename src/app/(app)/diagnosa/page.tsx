import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DiagnosaPage() {
  await requirePermission("medical_record.read");
  const list = await prisma.diagnosis.findMany({
    include: { medicalRecord: { include: { patient: true } }, diagnosedBy: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Diagnosa" description="Riwayat diagnosa di seluruh kunjungan." />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Pasien</TableHead>
                <TableHead>Diagnosa</TableHead>
                <TableHead>ICD-10</TableHead>
                <TableHead>Dokter</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">Belum ada diagnosa.</TableCell></TableRow>
              ) : (
                list.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell>{formatDateTime(d.createdAt)}</TableCell>
                    <TableCell>{d.medicalRecord.patient.fullName}</TableCell>
                    <TableCell className="font-medium">{d.label}</TableCell>
                    <TableCell className="font-mono text-xs">{d.code ?? "-"}</TableCell>
                    <TableCell>{d.diagnosedBy?.user.name ?? "-"}</TableCell>
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
