"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { createRetailInvoice } from "../actions";
import { formatIDR } from "@/lib/format";

type Line = { inventoryItemId: string; qty: number };

export function RetailKasirForm({
  patients,
  products,
}: {
  patients: { id: string; label: string }[];
  products: { id: string; label: string; price: number }[];
}) {
  const router = useRouter();
  const [patientId, setPatientId] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function add() { setLines((l) => [...l, { inventoryItemId: "", qty: 1 }]); }
  function update(i: number, p: Partial<Line>) { setLines((l) => l.map((x, idx) => (idx === i ? { ...x, ...p } : x))); }
  function remove(i: number) { setLines((l) => l.filter((_, idx) => idx !== i)); }

  const total = lines.reduce((s, l) => {
    const p = products.find((x) => x.id === l.inventoryItemId);
    return s + (p?.price ?? 0) * l.qty;
  }, 0);

  async function submit() {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("patientId", patientId);
    fd.set("promoCode", promoCode);
    fd.set("lines", JSON.stringify(lines.filter((l) => l.inventoryItemId)));
    const r = await createRetailInvoice(fd);
    setPending(false);
    if ((r as any).error) setError((r as any).error);
    else if ((r as any).id) router.push(`/kasir/${(r as any).id}`);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Pasien *</Label>
        <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
          <option value="">Pilih pasien...</option>
          {patients.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Produk</Label>
          <Button type="button" variant="outline" size="sm" onClick={add}>+ Tambah</Button>
        </div>
        {lines.length === 0 ? (
          <p className="text-xs text-muted-foreground">Tambahkan produk yang dibeli pasien.</p>
        ) : lines.map((l, i) => {
          const p = products.find((x) => x.id === l.inventoryItemId);
          return (
            <div key={i} className="mb-2 flex items-end gap-2">
              <div className="flex-1">
                <select
                  value={l.inventoryItemId}
                  onChange={(e) => update(i, { inventoryItemId: e.target.value })}
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                >
                  <option value="">Pilih produk...</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.label} — {formatIDR(p.price)}</option>)}
                </select>
              </div>
              <div className="w-20">
                <Input type="number" min={1} value={l.qty} onChange={(e) => update(i, { qty: Number(e.target.value) })} />
              </div>
              <div className="w-28 text-right text-sm">
                {p ? formatIDR(p.price * l.qty) : "—"}
              </div>
              <Button type="button" size="icon" variant="ghost" onClick={() => remove(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <Label>Kode Promo (optional)</Label>
        <Input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="HEMAT10" />
      </div>

      {lines.length > 0 && (
        <div className="rounded border p-3 text-right">
          <span className="text-muted-foreground">Subtotal: </span>
          <span className="text-lg font-semibold">{formatIDR(total)}</span>
        </div>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button onClick={submit} disabled={pending || !patientId || lines.length === 0}>
        {pending ? "Membuat invoice..." : "Buat Invoice & Bayar"}
      </Button>
    </div>
  );
}
