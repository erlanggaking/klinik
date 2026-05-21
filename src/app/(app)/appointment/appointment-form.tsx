"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createAppointment } from "./actions";

export function AppointmentForm({
  initialPatientId,
  patients,
  treatments,
  doctors,
}: {
  initialPatientId?: string;
  patients: { id: string; label: string }[];
  treatments: { id: string; label: string; duration: number }[];
  doctors: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function action(fd: FormData) {
    setPending(true);
    setError(null);
    const r = await createAppointment(fd);
    setPending(false);
    if (r.error) setError(r.error);
    else if (r.id) {
      router.push("/appointment");
      router.refresh();
    }
  }

  return (
    <form action={action} className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

      <div className="space-y-2">
        <Label>Tanggal & Jam Mulai *</Label>
        <Input type="datetime-local" name="startAt" required />
      </div>

      <div className="space-y-2">
        <Label>Dokter / Therapist Utama</Label>
        <select name="primaryStaffId" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
          <option value="">-</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>{d.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Treatment * (pilih satu atau lebih)</Label>
        <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto rounded-md border p-3 md:grid-cols-2">
          {treatments.map((t) => (
            <label key={t.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="treatmentId" value={t.id} />
              {t.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Catatan</Label>
        <Input name="notes" placeholder="Catatan dari resepsionis..." />
      </div>

      {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}

      <div className="flex gap-2 md:col-span-2">
        <Button type="submit" disabled={pending}>{pending ? "Menyimpan..." : "Buat Appointment"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
      </div>
    </form>
  );
}
