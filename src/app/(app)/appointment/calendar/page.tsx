import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { addDays, startOfWeek, format } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * Calendar view sederhana per minggu, kolom = hari, baris = jam.
 */
export default async function AppointmentCalendarPage({ searchParams }: { searchParams: { week?: string } }) {
  await requirePermission("appointment.read");
  const today = searchParams.week ? new Date(searchParams.week) : new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const weekEnd = addDays(weekStart, 7);

  const appts = await prisma.appointment.findMany({
    where: { startAt: { gte: weekStart, lt: weekEnd } },
    include: { patient: true, primaryStaff: { include: { user: true } }, treatments: { include: { treatment: true } } },
    orderBy: { startAt: "asc" },
  });

  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 12 }).map((_, i) => i + 8); // 08:00 - 19:00

  const prevWeek = format(addDays(weekStart, -7), "yyyy-MM-dd");
  const nextWeek = format(addDays(weekStart, 7), "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kalender Appointment"
        description={`Minggu ${format(weekStart, "dd MMM")} - ${format(addDays(weekStart, 6), "dd MMM yyyy")}`}
        actions={
          <div className="flex gap-2 text-sm">
            <Link className="rounded border px-3 py-2 hover:bg-accent" href={`?week=${prevWeek}`}>← Minggu Lalu</Link>
            <Link className="rounded border px-3 py-2 hover:bg-accent" href="/appointment/calendar">Hari Ini</Link>
            <Link className="rounded border px-3 py-2 hover:bg-accent" href={`?week=${nextWeek}`}>Minggu Depan →</Link>
          </div>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="grid min-w-[900px] grid-cols-[60px_repeat(7,1fr)] divide-x">
              <div className="bg-muted/50 p-2 text-xs font-medium">Jam</div>
              {days.map((d, i) => (
                <div key={i} className="bg-muted/50 p-2 text-center text-xs font-medium">
                  <div>{format(d, "EEE")}</div>
                  <div className="text-base">{format(d, "dd")}</div>
                </div>
              ))}
              {hours.map((h) => (
                <>
                  <div key={`h-${h}`} className="border-t p-2 text-xs text-muted-foreground">{String(h).padStart(2, "0")}:00</div>
                  {days.map((d, di) => {
                    const slot = appts.filter((a: any) => {
                      const sd = new Date(a.startAt);
                      return sd.toDateString() === d.toDateString() && sd.getHours() === h;
                    });
                    return (
                      <div key={`s-${h}-${di}`} className="border-t p-1 align-top">
                        {slot.map((a: any) => (
                          <Link
                            key={a.id}
                            href={`/appointment`}
                            className="mb-1 block truncate rounded bg-primary/10 px-1.5 py-1 text-[11px] text-primary hover:bg-primary/20"
                            title={`${a.patient.fullName} · ${a.treatments.map((x: any) => x.treatment.nameId).join(", ")}`}
                          >
                            {format(new Date(a.startAt), "HH:mm")} {a.patient.fullName.split(" ")[0]}
                          </Link>
                        ))}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
