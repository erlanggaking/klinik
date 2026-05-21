import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FollowUpPage() {
  await requirePermission("followup.read");
  const tasks = await prisma.followUpTask.findMany({
    include: { patient: true, rule: true },
    orderBy: { scheduledAt: "asc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Follow Up" description="Task follow-up otomatis & manual ke pasien." />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jadwal</TableHead>
                <TableHead>Pasien</TableHead>
                <TableHead>Rule</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subjek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">Tidak ada follow-up task.</TableCell></TableRow>
              ) : (
                tasks.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell>{formatDateTime(t.scheduledAt)}</TableCell>
                    <TableCell>{t.patient.fullName}</TableCell>
                    <TableCell>{t.rule?.name ?? "Manual"}</TableCell>
                    <TableCell>{t.channel}</TableCell>
                    <TableCell><Badge variant="outline">{t.status}</Badge></TableCell>
                    <TableCell>{t.subject ?? t.body?.slice(0, 80) ?? "-"}</TableCell>
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
