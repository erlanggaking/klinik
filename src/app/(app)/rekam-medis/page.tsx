import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RekamMedisPage() {
  await requirePermission("medical_record.read");
  const records = await prisma.medicalRecord.findMany({
    include: { patient: true, diagnoses: true },
    orderBy: { visitDate: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekam Medis"
        description="Riwayat kunjungan & catatan klinis pasien."
        actions={
          <Button asChild>
            <Link href="/rekam-medis/baru"><Plus className="h-4 w-4" /> Rekam Medis Baru</Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Pasien</TableHead>
                <TableHead>Keluhan</TableHead>
                <TableHead>Diagnosa</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    Belum ada rekam medis.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.code}</TableCell>
                    <TableCell>{formatDateTime(r.visitDate)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{r.patient.fullName}</div>
                      <div className="text-xs text-muted-foreground">{r.patient.mrn}</div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{r.chiefComplaint ?? "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {r.diagnoses.find((d: any) => d.isPrimary)?.label ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/rekam-medis/${r.id}`}>Buka</Link>
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
