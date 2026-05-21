import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatIDR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TreatmentCatalogPage() {
  await requirePermission("dashboard.read");
  const list = await prisma.treatment.findMany({
    include: { category: true },
    orderBy: { nameId: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Katalog Treatment" description="Daftar layanan klinik & harga." />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Durasi</TableHead>
                <TableHead>Butuh Dokter?</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">Belum ada treatment.</TableCell></TableRow>
              ) : (
                list.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.code}</TableCell>
                    <TableCell className="font-medium">{t.nameId}</TableCell>
                    <TableCell>{t.category.nameId}</TableCell>
                    <TableCell>{t.durationMinutes} mnt</TableCell>
                    <TableCell>{t.requiresDoctor ? "✓" : "-"}</TableCell>
                    <TableCell>{formatIDR(Number(t.price))}</TableCell>
                    <TableCell><Badge variant={t.isActive ? "success" : "outline"}>{t.isActive ? "Aktif" : "Nonaktif"}</Badge></TableCell>
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
