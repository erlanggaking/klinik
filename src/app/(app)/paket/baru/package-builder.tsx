"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { createPackage } from "../actions";

type Item = { treatmentId: string; sessions: number };

export function PackageBuilder({
  treatments,
}: {
  treatments: { id: string; label: string; price: number }[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addItem() { setItems((l) => [...l, { treatmentId: "", sessions: 1 }]); }
  function update(i: number, p: Partial<Item>) { setItems((l) => l.map((x, idx) => (idx === i ? { ...x, ...p } : x))); }
  function remove(i: number) { setItems((l) => l.filter((_, idx) => idx !== i)); }

  async function action(fd: FormData) {
    setPending(true);
    setError(null);
    fd.set("items", JSON.stringify(items.filter((x) => x.treatmentId)));
    const r = await createPackage(fd);
    setPending(false);
    if (r?.error) setError(r.error);
    else router.push("/paket");
  }

  return (
    <form action={action} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <F name="code" label="Kode (PKG-FACIAL10)" required />
      <F name="nameId" label="Nama Paket" required />
      <F name="nameEn" label="Nama (EN)" />
      <F name="price" label="Harga Paket Rp" type="number" required />
      <F name="validityDays" label="Berlaku (hari, kosong=unlimited)" type="number" />
      <div className="space-y-2 md:col-span-2">
        <Label>Deskripsi</Label>
        <Input name="description" />
      </div>

      <div className="space-y-2 md:col-span-2">
        <div className="flex items-center justify-between">
          <Label>Item Paket</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>+ Tambah Item</Button>
        </div>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">Tambahkan treatment yang termasuk paket ini.</p>
        ) : (
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 rounded border p-2 md:grid-cols-12 md:items-end">
                <div className="md:col-span-8">
                  <Label className="text-xs">Treatment</Label>
                  <select
                    value={it.treatmentId}
                    onChange={(e) => update(i, { treatmentId: e.target.value })}
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                  >
                    <option value="">Pilih...</option>
                    {treatments.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <Label className="text-xs">Sesi</Label>
                  <Input type="number" min={1} value={it.sessions} onChange={(e) => update(i, { sessions: Number(e.target.value) })} />
                </div>
                <div className="md:col-span-1">
                  <Button type="button" size="icon" variant="ghost" onClick={() => remove(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>{pending ? "Menyimpan..." : "Simpan Paket"}</Button>
      </div>
    </form>
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
