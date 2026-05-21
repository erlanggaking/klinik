import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate, formatDateTime, formatIDR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  await requirePermission("patient.read");
  const p = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      membershipTier: true,
      appointments: { orderBy: { startAt: "desc" }, take: 10 },
      medicalRecords: { orderBy: { visitDate: "desc" }, take: 10 },
      invoices: { orderBy: { issuedAt: "desc" }, take: 10 },
      treatmentPackages: { include: { package: true }, orderBy: { purchasedAt: "desc" } },
    },
  });
  if (!p) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={p.fullName}
        description={`MRN ${p.mrn} · ${p.phone}${p.email ? " · " + p.email : ""}`}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/appointment/baru?patientId=${p.id}`}>+ Appointment</Link>
            </Button>
            <Button asChild>
              <Link href={`/rekam-medis/baru?patientId=${p.id}`}>+ Rekam Medis</Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Profil</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row k="Jenis Kelamin" v={p.gender ?? "-"} />
            <Row k="Tanggal Lahir" v={p.birthDate ? formatDate(p.birthDate) : "-"} />
            <Row k="KTP/Passport" v={p.idNumber ?? "-"} />
            <Row k="Pekerjaan" v={p.occupation ?? "-"} />
            <Row k="Alamat" v={p.address ?? "-"} />
            <Row k="Kontak Darurat" v={p.emergencyName ? `${p.emergencyName} (${p.emergencyPhone ?? "-"})` : "-"} />
            <Row k="Alergi" v={p.knownAllergies ?? "-"} />
            <Row k="Jenis Kulit" v={p.skinType ?? "-"} />
            <Row k="Consent" v={p.consentSigned ? `✓ ${formatDate(p.consentSignedAt!)}` : "Belum"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Membership & Loyalty</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row k="Tier" v={p.membershipTier?.name ?? "—"} />
            <Row k="Member Since" v={p.membershipSince ? formatDate(p.membershipSince) : "-"} />
            <Row k="Poin" v={`${p.loyaltyPoints}`} />
            <Row k="Kode Referral" v={p.referralCode ?? "-"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Paket Aktif</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {p.treatmentPackages.length === 0 ? (
              <p className="text-muted-foreground">Belum ada paket.</p>
            ) : (
              p.treatmentPackages.map((pp: any) => (
                <div key={pp.id} className="rounded border p-2">
                  <div className="font-medium">{pp.package.nameId}</div>
                  <div className="text-xs text-muted-foreground">
                    Status {pp.status} · Berlaku s/d {pp.expiresAt ? formatDate(pp.expiresAt) : "—"}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Riwayat Appointment</CardTitle></CardHeader>
          <CardContent>
            {p.appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada appointment.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {p.appointments.map((a: any) => (
                  <li key={a.id} className="flex items-center justify-between rounded border p-2">
                    <div>
                      <div className="font-medium">{a.code}</div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(a.startAt)}</div>
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
              <ul className="space-y-2 text-sm">
                {p.invoices.map((iv: any) => (
                  <li key={iv.id} className="flex items-center justify-between rounded border p-2">
                    <div>
                      <div className="font-medium">{iv.code}</div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(iv.issuedAt)}</div>
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

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
      <div className="text-muted-foreground">{k}</div>
      <div className="text-right">{v}</div>
    </div>
  );
}
