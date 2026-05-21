import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/format";
import { startOfMonth, endOfMonth, startOfYear } from "date-fns";
import Link from "next/link";
import { Download } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LaporanPage() {
  await requirePermission("report.read");
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const yearStart = startOfYear(now);

  const [revMonth, revYear, expenseMonth, treatmentItemsMonth, repeatVisits, complaints] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: monthStart, lte: monthEnd } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: yearStart } } }),
    prisma.cashEntry.aggregate({ _sum: { amount: true }, where: { entryType: "OUT", occurredAt: { gte: monthStart, lte: monthEnd } } }),
    prisma.treatmentItem.count({ where: { performedAt: { gte: monthStart, lte: monthEnd } } }),
    prisma.medicalRecord
      .groupBy({
        by: ["patientId"],
        where: { visitDate: { gte: new Date(now.getTime() - 90 * 24 * 3600 * 1000) } },
        _count: { _all: true },
      })
      .then((r: any[]) => r.filter((x) => x._count._all > 1).length),
    prisma.treatmentItem.count({ where: { outcome: { in: ["FAILED", "FOLLOWUP_NEEDED"] }, performedAt: { gte: monthStart, lte: monthEnd } } }),
  ]);

  const fromIso = monthStart.toISOString().slice(0, 10);
  const toIso = monthEnd.toISOString().slice(0, 10);
  const exportLinks = [
    { type: "all", label: "Semua Sheet (Pendapatan + Treatment + Inventory + Pasien)" },
    { type: "revenue", label: "Pendapatan" },
    { type: "treatment", label: "Treatment" },
    { type: "inventory", label: "Inventory" },
    { type: "patients", label: "Pasien" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Laporan" description="Ringkasan keuangan, operasional, dan medis." />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat title="Pendapatan Bulan Ini" value={formatIDR(Number(revMonth._sum.amount ?? 0))} />
        <Stat title="Pendapatan YTD" value={formatIDR(Number(revYear._sum.amount ?? 0))} />
        <Stat title="Pengeluaran Bulan Ini" value={formatIDR(Number(expenseMonth._sum.amount ?? 0))} />
        <Stat title="Laba Bersih Bulan Ini (kotor)" value={formatIDR(Number(revMonth._sum.amount ?? 0) - Number(expenseMonth._sum.amount ?? 0))} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat title="Treatment Bulan Ini" value={`${treatmentItemsMonth}`} sub="total tindakan" />
        <Stat title="Pasien Repeat (90 hari)" value={`${repeatVisits}`} sub="kunjungan ulang" />
        <Stat title="Treatment Followup" value={`${complaints}`} sub="butuh follow-up" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Excel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Range: {fromIso} sampai {toIso}.
          </p>
          <div className="flex flex-wrap gap-2">
            {exportLinks.map((e) => (
              <Button key={e.type} asChild variant="outline" size="sm">
                <Link href={`/api/reports/excel?type=${e.type}&from=${fromIso}&to=${toIso}`} target="_blank">
                  <Download className="h-4 w-4" /> {e.label}
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className="text-xl font-semibold">{value}</div>
        {sub ? <div className="text-xs text-muted-foreground">{sub}</div> : null}
      </CardContent>
    </Card>
  );
}
