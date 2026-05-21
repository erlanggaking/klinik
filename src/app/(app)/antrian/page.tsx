import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QueueActions } from "./queue-actions";
import { formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const STAGES = [
  { code: "WAITING_CONSULT", title: "Menunggu Konsultasi" },
  { code: "WAITING_TREATMENT", title: "Menunggu Treatment" },
  { code: "WAITING_PHARMACY", title: "Menunggu Farmasi" },
  { code: "WAITING_CASHIER", title: "Menunggu Kasir" },
] as const;

export default async function AntrianPage() {
  await requirePermission("queue.read");
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const tickets = await prisma.queueTicket.findMany({
    where: { date: today, status: { in: ["WAITING", "CALLED", "IN_PROGRESS"] } },
    include: { patient: true, appointment: { include: { primaryStaff: { include: { user: true } } } } },
    orderBy: [{ stage: "asc" }, { createdAt: "asc" }],
  });

  const grouped: Record<string, typeof tickets> = {
    WAITING_CONSULT: [],
    WAITING_TREATMENT: [],
    WAITING_PHARMACY: [],
    WAITING_CASHIER: [],
  };
  for (const t of tickets) (grouped[t.stage] ??= []).push(t);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Antrian"
        description={`Antrian aktif hari ini · ${tickets.length} pasien`}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {STAGES.map((s) => {
          const list = grouped[s.code] ?? [];
          return (
            <Card key={s.code}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{s.title}</span>
                  <Badge variant="outline">{list.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {list.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Kosong.</p>
                ) : (
                  list.map((t: any) => (
                    <div key={t.id} className="rounded border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-base font-semibold">{t.number}</span>
                        <Badge variant={t.status === "WAITING" ? "outline" : "info"}>{t.status}</Badge>
                      </div>
                      <div className="mt-1 font-medium">{t.patient.fullName}</div>
                      <div className="text-xs text-muted-foreground">
                        Sejak {formatTime(t.createdAt)}
                        {t.appointment?.primaryStaff?.user.name
                          ? ` · ${t.appointment.primaryStaff.user.name}`
                          : ""}
                      </div>
                      <QueueActions ticketId={t.id} stage={t.stage} status={t.status} />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
