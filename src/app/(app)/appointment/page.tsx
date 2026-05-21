import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, LogIn } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { CheckInButton } from "./check-in-button";

export const dynamic = "force-dynamic";

const STATUS_VARIANTS: Record<string, any> = {
  BOOKED: "outline",
  CONFIRMED: "info",
  CHECKED_IN: "success",
  IN_CONSULTATION: "info",
  IN_TREATMENT: "info",
  COMPLETED: "success",
  CANCELLED: "destructive",
  NO_SHOW: "destructive",
};

export default async function AppointmentPage({ searchParams }: { searchParams: { date?: string } }) {
  await requirePermission("appointment.read");
  const date = searchParams.date ? new Date(searchParams.date) : new Date();
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);

  const list = await prisma.appointment.findMany({
    where: { startAt: { gte: dayStart, lte: dayEnd } },
    include: { patient: true, primaryStaff: { include: { user: true } }, treatments: { include: { treatment: true } } },
    orderBy: { startAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointment"
        description={`Daftar appointment ${dayStart.toLocaleDateString("id-ID", { dateStyle: "full" })}`}
        actions={
          <Button asChild>
            <Link href="/appointment/baru">
              <Plus className="h-4 w-4" /> Buat Appointment
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Pasien</TableHead>
                <TableHead>Treatment</TableHead>
                <TableHead>Dokter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    Tidak ada appointment di tanggal ini.
                  </TableCell>
                </TableRow>
              ) : (
                list.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="whitespace-nowrap">{formatDateTime(a.startAt)}</TableCell>
                    <TableCell className="font-mono text-xs">{a.code}</TableCell>
                    <TableCell>
                      <div className="font-medium">{a.patient.fullName}</div>
                      <div className="text-xs text-muted-foreground">{a.patient.phone}</div>
                    </TableCell>
                    <TableCell>
                      {a.treatments.map((t: any) => t.treatment.nameId).join(", ") || "-"}
                    </TableCell>
                    <TableCell>{a.primaryStaff?.user.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[a.status] ?? "outline"}>{a.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {a.status === "BOOKED" || a.status === "CONFIRMED" ? (
                        <CheckInButton appointmentId={a.id} />
                      ) : (
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/appointment/${a.id}`}>Detail</Link>
                        </Button>
                      )}
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
