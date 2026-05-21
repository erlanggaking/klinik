"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { issuePrescription } from "../actions";
import { Trash2 } from "lucide-react";

type Line = {
  itemId?: string;
  isCompound?: boolean;
  compoundName?: string;
  qty: number;
  unit: string;
  dosage?: string;
  duration?: string;
  notes?: string;
  unitPrice: number;
};

export function PrescriptionBuilder({
  medicalRecordId,
  doctors,
  drugs,
}: {
  medicalRecordId: string;
  doctors: { id: string; label: string }[];
  drugs: { id: string; label: string; price: number }[];
}) {
  const router = useRouter();
  const [doctorId, setDoctorId] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addLine() {
    setLines((l) => [...l, { qty: 1, unit: "tube", unitPrice: 0 }]);
  }
  function update(i: number, patch: Partial<Line>) {
    setLines((l) => l.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function remove(i: number) {
    setLines((l) => l.filter((_, idx) => idx !== i));
  }

  async function submit() {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("medicalRecordId", medicalRecordId);
    fd.set("doctorId", doctorId);
    fd.set("lines", JSON.stringify(lines));
    const r = await issuePrescription(fd);
    setPending(false);
    if (r?.error) setError(r.error);
    else {
      setLines([]);
      router.refresh();
    }
  }

  return (
    <div className="space-y-3 rounded-md border bg-muted/30 p-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="space-y-1 md:col-span-2">
          <Label className="text-xs">Dokter Peresep</Label>
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
          >
            <option value="">Pilih dokter...</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <Button type="button" variant="outline" size="sm" onClick={addLine}>+ Tambah Item</Button>
        </div>
      </div>

      {lines.length > 0 && (
        <div className="space-y-2">
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-1 items-end gap-2 rounded border bg-background p-2 md:grid-cols-12">
              <div className="md:col-span-4">
                <Label className="text-xs">Obat</Label>
                <select
                  value={l.itemId ?? ""}
                  onChange={(e) => {
                    const drug = drugs.find((d) => d.id === e.target.value);
                    update(i, { itemId: e.target.value || undefined, unitPrice: drug?.price ?? l.unitPrice });
                  }}
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                >
                  <option value="">Pilih obat...</option>
                  {drugs.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </div>
              <div className="md:col-span-1">
                <Label className="text-xs">Qty</Label>
                <Input type="number" min={1} value={l.qty} onChange={(e) => update(i, { qty: Number(e.target.value) })} />
              </div>
              <div className="md:col-span-1">
                <Label className="text-xs">Unit</Label>
                <Input value={l.unit} onChange={(e) => update(i, { unit: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Aturan Pakai</Label>
                <Input placeholder="1x sehari" value={l.dosage ?? ""} onChange={(e) => update(i, { dosage: e.target.value })} />
              </div>
              <div className="md:col-span-1">
                <Label className="text-xs">Durasi</Label>
                <Input placeholder="14 hr" value={l.duration ?? ""} onChange={(e) => update(i, { duration: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Harga (per unit)</Label>
                <Input type="number" min={0} value={l.unitPrice} onChange={(e) => update(i, { unitPrice: Number(e.target.value) })} />
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

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {lines.length > 0 && doctorId && (
        <Button onClick={submit} disabled={pending} size="sm">
          {pending ? "Menyimpan..." : "Issue Resep"}
        </Button>
      )}
    </div>
  );
}
