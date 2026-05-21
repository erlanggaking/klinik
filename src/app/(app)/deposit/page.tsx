import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDateTime, formatIDR } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DepositPage() {
  await requirePermission("deposit.read");
  const accounts = await prisma.cashAccount.findMany({
    include: { entries: { orderBy: { occurredAt: "desc" }, take: 5 } },
    orderBy: { name: "asc" },
  });

  // Compute current balances
  const balances = await Promise.all(
    accounts.map(async (a) => {
      const inAgg = await prisma.cashEntry.aggregate({
        where: { accountId: a.id, entryType: "IN" },
        _sum: { amount: true },
      });
      const outAgg = await prisma.cashEntry.aggregate({
        where: { accountId: a.id, entryType: "OUT" },
        _sum: { amount: true },
      });
      return [a.id, Number(a.openingBalance) + Number(inAgg._sum.amount ?? 0) - Number(outAgg._sum.amount ?? 0)] as const;
    })
  );
  const balMap = new Map(balances);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deposit (Kas Klinik)"
        description="Saldo kas perusahaan: pendapatan dari kasir, pengeluaran ops, dan transfer."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link href="/deposit/akun-baru">+ Akun Kas</Link></Button>
            <Button asChild><Link href="/deposit/transaksi-baru"><Plus className="h-4 w-4" />Transaksi</Link></Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{a.name}</span>
                <Badge variant="outline">{a.accountType}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{formatIDR(balMap.get(a.id) ?? 0)}</div>
              <div className="mt-2 text-xs text-muted-foreground">
                {a.bankName ? `${a.bankName} ${a.accountNo ?? ""}` : "—"}
              </div>
            </CardContent>
          </Card>
        ))}
        {accounts.length === 0 && (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">Belum ada akun kas.</CardContent></Card>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>Transaksi Terbaru</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Akun</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.flatMap((a) => a.entries).slice(0, 30).map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell>{formatDateTime(e.occurredAt)}</TableCell>
                  <TableCell>{accounts.find((a) => a.id === e.accountId)?.name}</TableCell>
                  <TableCell>
                    <Badge variant={e.entryType === "IN" ? "success" : "destructive"}>{e.entryType}</Badge>
                  </TableCell>
                  <TableCell>{e.category ?? "-"}</TableCell>
                  <TableCell className="max-w-md truncate">{e.description}</TableCell>
                  <TableCell className="text-right">{formatIDR(Number(e.amount))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
