import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatIDR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MembershipPage() {
  await requirePermission("membership.read");
  const tiers = await prisma.membershipTier.findMany({ orderBy: { minSpend: "asc" } });
  const memberCount = await prisma.patient.count({ where: { membershipTierId: { not: null } } });

  return (
    <div className="space-y-6">
      <PageHeader title="Membership" description={`Tier program loyalty pasien · ${memberCount} member aktif`} />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Min. Spend</TableHead>
                <TableHead>Diskon</TableHead>
                <TableHead>Point Multiplier</TableHead>
                <TableHead>Birthday Bonus</TableHead>
                <TableHead>Anniversary</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">Belum ada tier.</TableCell></TableRow>
              ) : (
                tiers.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.code}</TableCell>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{formatIDR(Number(t.minSpend))}</TableCell>
                    <TableCell>{Number(t.discountPct)}%</TableCell>
                    <TableCell>×{Number(t.pointMultiplier)}</TableCell>
                    <TableCell>{t.birthdayBonus} pt</TableCell>
                    <TableCell>{t.anniversaryBonus} pt</TableCell>
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
