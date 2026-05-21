"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { submitPublicBooking } from "./actions";
import { CheckCircle2 } from "lucide-react";

export function PublicBookingForm({ treatments }: { treatments: { id: string; label: string }[] }) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<{ code: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function action(fd: FormData) {
    setPending(true);
    setError(null);
    const r = await submitPublicBooking(fd);
    setPending(false);
    if (r.error) setError(r.error);
    else if (r.code) setDone({ code: r.code });
  }

  if (done) {
    return (
      <div className="space-y-3 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h2 className="text-xl font-semibold">Booking Diterima!</h2>
        <p className="text-sm text-muted-foreground">
          Kode booking kamu: <span className="font-mono font-semibold">{done.code}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Tim kami akan menghubungi via WhatsApp untuk konfirmasi.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field name="firstName" label="Nama Depan" required />
      <Field name="lastName" label="Nama Belakang" />
      <Field name="phone" label="No. WhatsApp" required placeholder="08123..." />
      <Field name="email" label="Email" type="email" />
      <div className="space-y-2 md:col-span-2">
        <Label>Treatment yang Diinginkan *</Label>
        <select name="treatmentId" required className="h-10 w-full rounded-md border bg-background px-3 text-sm">
          <option value="">Pilih...</option>
          {treatments.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Tanggal & Jam Diinginkan *</Label>
        <Input type="datetime-local" name="startAt" required />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Catatan (opsional)</Label>
        <Input name="notes" />
      </div>
      {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Mengirim..." : "Kirim Booking"}
        </Button>
      </div>
    </form>
  );
}

function Field({ name, label, type = "text", required, placeholder }: { name: string; label: string; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}{required ? " *" : ""}</Label>
      <Input id={name} name={name} type={type} required={required} placeholder={placeholder} />
    </div>
  );
}
