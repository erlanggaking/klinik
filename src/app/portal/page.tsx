import { redirect } from "next/navigation";
import Link from "next/link";
import { getPortalPatient, portalLogout } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime, formatIDR } from "@/lib/format";
import { LogOut, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const p = await getPortalPatient();
  if (!p) redirect("/portal/login");

  async function logout() {
    "use server";
    await portalLogout();
    redirect("/portal/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 p-4 py-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Halo, {p.fullName.split(" ")[0]} 💕</h1>
              <p className="text-sm text-muted-foreground">{p.mrn} · {p.phone}</p>
            </div>
          </div>
          <form action={logout}>
            <Button variant="ghost"><LogOut className="h-4 w-4" /> Keluar</Button>
          </form>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader><CardTitle className="text-sm">Loyalty Points</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{p.loyaltyPoints}</div>
              <div className="text-xs text-muted-foreground">{p.membershipTier?.name ?? "Reguler"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Paket Aktif</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{p.treatmentPackages.filter((pp: any) => pp.status === "ACTIVE").length}</div>
              <div className="text-xs text-muted-foreground">paket masih berlaku</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Booking Berikutnya</CardTitle></CardHeader>
            <CardContent>
              <Button asChild className="w-full"><Link href="/booking">+ Booking Baru</Link></Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Riwayat Appointment</CardTitle></CardHeader>
          <CardContent>
            {p.appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada appointment.</p>
            ) : (
              <ul className="space-y-2">
                {p.appointments.map((a: any) => (
                  <li key={a.id} className="flex items-center justify-between rounded border p-2 text-sm">
                    <div>
                      <div className="font-mono text-xs">{a.code}</div>
                      <div>{formatDateTime(a.startAt)}</div>
                    </div>
                    <Badge variant="outline">{a.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Riwayat Invoice</CardTitle></CardHeader>
          <CardContent>
            {p.invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada invoice.</p>
            ) : (
              <ul className="space-y-2">
                {p.invoices.map((iv: any) => (
                  <li key={iv.id} className="flex items-center justify-between rounded border p-2 text-sm">
                    <div>
                      <div className="font-mono text-xs">{iv.code}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(iv.issuedAt)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{iv.status}</Badge>
                      <span>{formatIDR(Number(iv.grandTotal))}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
