import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { formatDate, formatIDR } from "@/lib/format";
import { PromoToggle } from "./active-toggle";

export const dynamic = "force-dynamic";

export default async function PromoPage() {
  await requirePermission("promo.read");
  const promos = await prisma.promo.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promo"
        description="Voucher, auto-promo (happy hour / day-of-week), dan bundling promo."
        actions={<Button asChild><Link href="/promo/baru"><Plus className="h-4 w-4" /> Promo Baru</Link></Button>}
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Diskon</TableHead>
                <TableHead>Auto?</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Pakai</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promos.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="py-12 text-center text-muted-foreground">Belum ada promo.</TableCell></TableRow>
              ) : (
                promos.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.code}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><Badge variant="outline">{p.promoType}</Badge></TableCell>
                    <TableCell>
                      {p.discountPct ? `${Number(p.discountPct)}%` : p.discountAmount ? formatIDR(Number(p.discountAmount)) : "-"}
                    </TableCell>
                    <TableCell>{p.isAutoApply ? "✓" : "-"}</TableCell>
                    <TableCell className="text-xs">
                      {p.startsAt ? formatDate(p.startsAt) : "-"}
                      {p.endsAt ? ` → ${formatDate(p.endsAt)}` : ""}
                    </TableCell>
                    <TableCell>{p.usesCount}{p.maxUsesTotal ? `/${p.maxUsesTotal}` : ""}</TableCell>
                    <TableCell><Badge variant={p.isActive ? "success" : "outline"}>{p.isActive ? "Aktif" : "Nonaktif"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <PromoToggle id={p.id} isActive={p.isActive} />
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
