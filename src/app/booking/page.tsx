import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { PublicBookingForm } from "./form";

export const dynamic = "force-dynamic";

/**
 * Public booking form — accessible without login.
 * Pasien isi data minimum + pilih treatment + jam → sistem create patient (kalau belum ada) + appointment dengan source=PUBLIC.
 * Resepsionis akan konfirmasi via WA/telepon nanti.
 */
export default async function PublicBookingPage() {
  const treatments = await prisma.treatment.findMany({
    where: { isActive: true },
    orderBy: { nameId: "asc" },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 p-4 py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-semibold">Booking Online</h1>
          <p className="text-sm text-muted-foreground">
            Isi formulir di bawah, tim kami akan konfirmasi via WhatsApp.
          </p>
        </div>

        <Card>
          <CardHeader><CardTitle>Form Booking</CardTitle></CardHeader>
          <CardContent>
            <PublicBookingForm
              treatments={treatments.map((t) => ({
                id: t.id,
                label: `${t.nameId} (${t.durationMinutes} mnt)`,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
