"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { performTreatment } from "../actions";

export function PerformTreatmentForm({
  medicalRecordId,
  treatments,
  staff,
  patientPackages,
}: {
  medicalRecordId: string;
  treatments: { id: string; label: string }[];
  staff: { id: string; label: string }[];
  patientPackages: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [usePackage, setUsePackage] = useState(false);

  async function action(fd: FormData) {
    setPending(true);
    const r = await performTreatment(fd);
    setPending(false);
    if (r?.error) alert(r.error);
    else router.refresh();
  }

  return (
    <form action={action} className="rounded-md border bg-muted/30 p-3">
      <input type="hidden" name="medicalRecordId" value={medicalRecordId} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="space-y-1 md:col-span-2">
          <Label className="text-xs">Treatment</Label>
          <select name="treatmentId" required className="h-9 w-full rounded-md border bg-background px-2 text-sm">
            <option value="">Pilih...</option>
            {treatments.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Therapist / Dokter</Label>
          <select name="performedById" className="h-9 w-full rounded-md border bg-background px-2 text-sm">
            <option value="">-</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Qty</Label>
          <Input name="qty" type="number" min={1} defaultValue={1} />
        </div>

        {patientPackages.length > 0 && (
          <div className="md:col-span-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="usePackage" checked={usePackage} onChange={(e) => setUsePackage(e.target.checked)} />
              Pakai paket pasien
            </label>
            {usePackage && (
              <select name="patientPackageId" className="mt-2 h-9 w-full rounded-md border bg-background px-2 text-sm">
                <option value="">Pilih paket...</option>
                {patientPackages.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            )}
          </div>
        )}

        <div className="md:col-span-4">
          <Button type="submit" size="sm" disabled={pending}>{pending ? "Menyimpan..." : "+ Catat Treatment"}</Button>
        </div>
      </div>
    </form>
  );
}
