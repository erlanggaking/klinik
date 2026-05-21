"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createMedicalRecord } from "./actions";

export function MedicalRecordForm({
  initialPatientId,
  initialAppointmentId,
  patients,
}: {
  initialPatientId?: string;
  initialAppointmentId?: string;
  patients: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function action(fd: FormData) {
    setPending(true);
    setError(null);
    const r = await createMedicalRecord(fd);
    setPending(false);
    if (r.error) setError(r.error);
    else if (r.id) router.push(`/rekam-medis/${r.id}`);
  }

  return (
    <form action={action} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <input type="hidden" name="appointmentId" defaultValue={initialAppointmentId ?? ""} />
      <div className="space-y-2 md:col-span-2">
        <Label>Pasien *</Label>
        <select
          name="patientId"
          required
          defaultValue={initialPatientId ?? ""}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Pilih pasien...</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Keluhan Utama</Label>
        <Input name="chiefComplaint" placeholder="Mis: Jerawat di area dagu sejak 2 minggu" />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Riwayat Penyakit / Treatment Sebelumnya</Label>
        <textarea name="historyOfIllness" rows={3} className="w-full rounded-md border bg-background p-3 text-sm" />
      </div>
      <div className="space-y-2">
        <Label>Alergi</Label>
        <Input name="allergies" />
      </div>
      <div className="space-y-2">
        <Label>Obat yang Sedang Dikonsumsi</Label>
        <Input name="currentMeds" />
      </div>
      <div className="space-y-2">
        <Label>Skala Fitzpatrick (I-VI)</Label>
        <select name="fitzpatrick" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
          <option value="">-</option>
          {["I","II","III","IV","V","VI"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Diagnosa Primer</Label>
        <Input name="diagnosisPrimary" placeholder="Mis: Acne vulgaris derajat sedang" />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Plan / Rencana Treatment</Label>
        <textarea name="plan" rows={2} className="w-full rounded-md border bg-background p-3 text-sm" />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Catatan Dokter</Label>
        <textarea name="doctorNotes" rows={3} className="w-full rounded-md border bg-background p-3 text-sm" />
      </div>

      {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}
      <div className="flex gap-2 md:col-span-2">
        <Button type="submit" disabled={pending}>{pending ? "Menyimpan..." : "Simpan & Lanjutkan"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
      </div>
    </form>
  );
}
