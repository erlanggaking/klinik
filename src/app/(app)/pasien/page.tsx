import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function PasienPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  await requirePermission("patient.read");
  const q = searchParams.q?.trim();
  const patients = await prisma.patient.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { mrn: { contains: q, mode: "insensitive" } },
          ],
        }
      : {},
    include: { membershipTier: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registrasi Pasien"
        description="Database pasien klinik (rekam medis & info kontak)."
        actions={
          <Button asChild>
            <Link href="/pasien/baru">
              <Plus className="h-4 w-4" />
              Pasien Baru
            </Link>
          </Button>
        }
      />

      <form className="flex max-w-md gap-2">
        <Input name="q" defaultValue={q ?? ""} placeholder="Cari nama / telp / MRN..." />
        <Button type="submit" variant="outline">Cari</Button>
      </form>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MRN</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Telp / WA</TableHead>
                <TableHead>Membership</TableHead>
                <TableHead>Poin</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    Belum ada pasien.
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.mrn}</TableCell>
                    <TableCell>
                      <div className="font-medium">{p.fullName}</div>
                      <div className="text-xs text-muted-foreground">{p.gender ?? "-"}</div>
                    </TableCell>
                    <TableCell>{p.phone}</TableCell>
                    <TableCell>
                      {p.membershipTier ? (
                        <Badge variant="info">{p.membershipTier.name}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{p.loyaltyPoints}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/pasien/${p.id}`}>Detail</Link>
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
