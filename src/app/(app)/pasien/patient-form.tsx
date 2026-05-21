"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createPatient } from "./actions";

export function PatientForm({ tiers }: { tiers: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const res = await createPatient(formData);
    setPending(false);
    if (res?.error) {
      setError(res.error);
    } else if (res?.id) {
      router.push(`/pasien/${res.id}`);
      router.refresh();
    }
  }

  return (
    <form action={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Nama Depan" name="firstName" required />
      <Field label="Nama Belakang" name="lastName" />
      <Field label="No. HP / WA" name="phone" required placeholder="08123..." />
      <Field label="Email" name="email" type="email" />
      <div className="space-y-2">
        <Label>Jenis Kelamin</Label>
        <select name="gender" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
          <option value="">-</option>
          <option value="FEMALE">Perempuan</option>
          <option value="MALE">Laki-laki</option>
          <option value="OTHER">Lainnya</option>
        </select>
      </div>
      <Field label="Tanggal Lahir" name="birthDate" type="date" />
      <Field label="No. KTP / Passport" name="idNumber" />
      <Field label="Pekerjaan" name="occupation" />
      <Field label="Alamat" name="address" className="md:col-span-2" />
      <Field label="Kontak Darurat" name="emergencyName" />
      <Field label="No. Kontak Darurat" name="emergencyPhone" />
      <div className="space-y-2">
        <Label>Jenis Kulit</Label>
        <select name="skinType" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
          <option value="">-</option>
          <option value="NORMAL">Normal</option>
          <option value="OILY">Berminyak</option>
          <option value="DRY">Kering</option>
          <option value="COMBINATION">Kombinasi</option>
          <option value="SENSITIVE">Sensitif</option>
        </select>
      </div>
      <Field label="Alergi (jika ada)" name="knownAllergies" />
      <div className="space-y-2 md:col-span-2">
        <Label>Tier Membership (opsional)</Label>
        <select name="membershipTierId" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
          <option value="">-</option>
          {tiers.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2 md:col-span-2">
        <input type="checkbox" id="consentSigned" name="consentSigned" defaultChecked />
        <Label htmlFor="consentSigned">Pasien menyetujui consent umum (data & treatment)</Label>
      </div>
      {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}
      <div className="flex gap-2 md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : "Daftar Pasien"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label htmlFor={name}>{label}{required ? " *" : ""}</Label>
      <Input id={name} name={name} type={type} required={required} placeholder={placeholder} />
    </div>
  );
}
