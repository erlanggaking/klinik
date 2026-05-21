import { requirePermission } from "@/lib/rbac";
import { dashboardKpis } from "@/lib/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { formatIDR } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CalendarCheck2, TrendingUp, Users, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requirePermission("dashboard.read");
  const k = await dashboardKpis();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Ringkasan operasional & performa klinik hari ini."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Wallet />} label="Pendapatan Hari Ini" value={formatIDR(k.revenueToday)} />
        <Stat icon={<TrendingUp />} label="Pendapatan Bulan Ini" value={formatIDR(k.revenueMonth)} />
        <Stat icon={<Users />} label="Pasien Hari Ini" value={`${k.patientsToday}`} sub={`${k.appointmentsToday} appointment`} />
        <Stat icon={<CalendarCheck2 />} label="Selesai Hari Ini" value={`${k.completedToday}`} sub={`dari ${k.appointmentsToday} appt`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pendapatan 7 Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={k.last7Revenue} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Treatment (Bulan Ini)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {k.topTreatments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data.</p>
            ) : (
              k.topTreatments.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="font-medium">{t.name}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{t.count}x</span>
                    <span>{formatIDR(t.revenue)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Skincare Terjual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {k.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data.</p>
            ) : (
              k.topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="font-medium">{p.name}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{p.qty} pcs</span>
                    <span>{formatIDR(p.revenue)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performa Dokter & Therapist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {k.doctorPerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data.</p>
            ) : (
              k.doctorPerformance.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="font-medium">{d.name}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{d.treatments} tindakan</span>
                    <span>{formatIDR(d.revenue)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          <Badge variant={k.lowStockCount > 0 ? "warning" : "success"}>
            {k.lowStockCount} item low-stock
          </Badge>
          <Badge variant={k.expiringSoon > 0 ? "warning" : "success"}>
            {k.expiringSoon} batch expired ≤60 hari
          </Badge>
          <span className="text-muted-foreground">
            Detail di menu Inventory.
          </span>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold">{value}</div>
          {sub ? <div className="text-xs text-muted-foreground">{sub}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}
