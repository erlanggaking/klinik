import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createPromo } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewPromoPage() {
  await requirePermission("promo.write");
  const tiers = await prisma.membershipTier.findMany({ where: { isActive: true } });

  async function action(fd: FormData) {
    "use server";
    const r = await createPromo(fd);
    if (r?.id) redirect("/promo");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Promo Baru" description="Voucher kode atau auto-promo (happy hour, day-of-week)." />
      <Card>
        <CardContent className="pt-6">
          <form action={action} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <F name="code" label="Kode (HEMAT10, FLASH50, dll)" required />
            <F name="name" label="Nama Promo" required />
            <div className="space-y-2 md:col-span-2">
              <Label>Deskripsi</Label>
              <Input name="description" />
            </div>
            <div className="space-y-2">
              <Label>Tipe</Label>
              <select name="promoType" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="PERCENT">% Persen</option>
                <option value="AMOUNT">Nominal Rp</option>
                <option value="BUY_X_GET_Y">Buy X Get Y</option>
                <option value="PACKAGE_DEAL">Package Deal</option>
              </select>
            </div>
            <F name="discountPct" label="Diskon % (kalau persen)" type="number" />
            <F name="discountAmount" label="Diskon Nominal Rp" type="number" />
            <F name="maxDiscount" label="Cap Diskon Maksimal Rp" type="number" />
            <F name="minSpend" label="Minimal Belanja Rp" type="number" />
            <F name="startsAt" label="Mulai" type="datetime-local" />
            <F name="endsAt" label="Berakhir" type="datetime-local" />
            <F name="startTime" label="Jam Mulai (auto-promo, mis 14:00)" />
            <F name="endTime" label="Jam Selesai (mis 17:00)" />

            <div className="space-y-2 md:col-span-2">
              <Label>Hari Berlaku (auto-promo)</Label>
              <div className="flex flex-wrap gap-2">
                {["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map((d, i) => (
                  <label key={i} className="flex items-center gap-1 text-sm">
                    <input type="checkbox" name="dayOfWeek" value={i} /> {d}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target Segmen</Label>
              <select name="targetSegment" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">Semua</option>
                <option value="NEW">Pasien Baru</option>
                <option value="RETURNING">Pasien Lama</option>
                <option value="INACTIVE">Inactive</option>
                <option value="BIRTHDAY">Ulang Tahun</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Target Tier (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {tiers.map((t) => (
                  <label key={t.id} className="flex items-center gap-1 text-sm">
                    <input type="checkbox" name="targetTier" value={t.code} /> {t.name}
                  </label>
                ))}
              </div>
            </div>

            <F name="maxUsesTotal" label="Maks Total Pakai (kosong = tidak terbatas)" type="number" />
            <F name="maxUsesPerPatient" label="Maks per Pasien" type="number" />

            <label className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" name="isAutoApply" />
              Auto-apply (gak butuh input kode kasir)
            </label>

            <div className="md:col-span-2"><Button type="submit">Simpan</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function F({ name, label, type = "text", required }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}{required ? " *" : ""}</Label>
      <Input id={name} name={name} type={type} required={required} />
    </div>
  );
}
