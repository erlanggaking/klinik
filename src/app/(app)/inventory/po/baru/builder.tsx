"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { createPO } from "../actions";
import { formatIDR } from "@/lib/format";

type Item = { itemId: string; qty: number; unitCost: number; batchNo: string; expiredAt: string };

export function POBuilder({
  suppliers,
  items,
}: {
  suppliers: { id: string; label: string }[];
  items: { id: string; label: string; costPrice: number }[];
}) {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState("");
  const [lines, setLines] = useState<Item[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function add() { setLines((l) => [...l, { itemId: "", qty: 1, unitCost: 0, batchNo: "", expiredAt: "" }]); }
  function update(i: number, p: Partial<Item>) { setLines((l) => l.map((x, idx) => (idx === i ? { ...x, ...p } : x))); }
  function remove(i: number) { setLines((l) => l.filter((_, idx) => idx !== i)); }

  async function submit() {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("supplierId", supplierId);
    fd.set("items", JSON.stringify(lines.filter((x) => x.itemId)));
    const r = await createPO(fd);
    setPending(false);
    if (r?.error) setError(r.error);
    else router.push("/inventory/po");
  }

  const total = lines.reduce((s, x) => s + x.qty * x.unitCost, 0);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Supplier *</Label>
        <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
          <option value="">Pilih supplier...</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Item</Label>
          <Button type="button" variant="outline" size="sm" onClick={add}>+ Tambah</Button>
        </div>
        <div className="space-y-2">
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 rounded border p-2 md:grid-cols-12 md:items-end">
              <div className="md:col-span-4">
                <Label className="text-xs">Item</Label>
                <select
                  value={l.itemId}
                  onChange={(e) => {
                    const it = items.find((x) => x.id === e.target.value);
                    update(i, { itemId: e.target.value, unitCost: it?.costPrice ?? l.unitCost });
                  }}
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                >
                  <option value="">Pilih...</option>
                  {items.map((it) => <option key={it.id} value={it.id}>{it.label}</option>)}
                </select>
              </div>
              <div className="md:col-span-1">
                <Label className="text-xs">Qty</Label>
                <Input type="number" min={1} value={l.qty} onChange={(e) => update(i, { qty: Number(e.target.value) })} />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Harga Beli</Label>
                <Input type="number" min={0} value={l.unitCost} onChange={(e) => update(i, { unitCost: Number(e.target.value) })} />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Batch No</Label>
                <Input value={l.batchNo} placeholder="opsional" onChange={(e) => update(i, { batchNo: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Expired</Label>
                <Input type="date" value={l.expiredAt} onChange={(e) => update(i, { expiredAt: e.target.value })} />
              </div>
              <div className="md:col-span-1">
                <Button type="button" size="icon" variant="ghost" onClick={() => remove(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {lines.length > 0 && (
        <div className="text-right text-sm">
          <span className="text-muted-foreground">Total: </span>
          <span className="font-semibold">{formatIDR(total)}</span>
        </div>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex gap-2">
        <Button onClick={submit} disabled={pending || !supplierId || lines.length === 0}>
          {pending ? "Menyimpan..." : "Simpan PO"}
        </Button>
      </div>
    </div>
  );
}
