import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatIDR } from "@/lib/format";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function PaketPage() {
  await requirePermission("package.read");
  const packages = await prisma.treatmentPackage.findMany({
    include: { items: { include: { treatment: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paket Treatment"
        description="Bundling sesi & treatment dengan harga spesial."
        actions={<Button asChild><Link href="/paket/baru"><Plus className="h-4 w-4" /> Paket Baru</Link></Button>}
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Berlaku</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">Belum ada paket.</TableCell></TableRow>
              ) : (
                packages.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.code}</TableCell>
                    <TableCell className="font-medium">{p.nameId}</TableCell>
                    <TableCell className="text-sm">
                      {p.items.map((i: any) => `${i.treatment.nameId} ×${i.sessions}`).join(", ")}
                    </TableCell>
                    <TableCell>{p.validityDays ? `${p.validityDays} hari` : "Tidak terbatas"}</TableCell>
                    <TableCell>{formatIDR(Number(p.price))}</TableCell>
                    <TableCell><Badge variant={p.isActive ? "success" : "outline"}>{p.isActive ? "Aktif" : "Nonaktif"}</Badge></TableCell>
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
