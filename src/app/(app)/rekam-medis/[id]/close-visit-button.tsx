"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { closeVisit } from "../actions";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CloseVisitButton({
  medicalRecordId,
  prescriptionId,
  products,
}: {
  medicalRecordId: string;
  prescriptionId: string | null;
  products: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [productLines, setProductLines] = useState<{ inventoryItemId: string; qty: number }[]>([]);

  function addProduct() {
    setProductLines((l) => [...l, { inventoryItemId: "", qty: 1 }]);
  }
  function update(i: number, patch: Partial<{ inventoryItemId: string; qty: number }>) {
    setProductLines((l) => l.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function remove(i: number) {
    setProductLines((l) => l.filter((_, idx) => idx !== i));
  }

  async function submit() {
    setPending(true);
    const fd = new FormData();
    fd.set("medicalRecordId", medicalRecordId);
    if (prescriptionId) fd.set("prescriptionId", prescriptionId);
    fd.set("productLines", JSON.stringify(productLines.filter((p) => p.inventoryItemId)));
    const r = await closeVisit(fd);
    setPending(false);
    if (r?.error) alert(r.error);
    else if (r?.invoiceId) {
      router.push(`/kasir/${r.invoiceId}`);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label className="text-sm">Skincare Retail Tambahan (opsional)</Label>
          <Button type="button" variant="outline" size="sm" onClick={addProduct}>+ Produk</Button>
        </div>
        {productLines.map((p, i) => (
          <div key={i} className="mb-2 flex items-end gap-2">
            <div className="flex-1">
              <select
                value={p.inventoryItemId}
                onChange={(e) => update(i, { inventoryItemId: e.target.value })}
                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
              >
                <option value="">Pilih produk...</option>
                {products.map((pr) => <option key={pr.id} value={pr.id}>{pr.label}</option>)}
              </select>
            </div>
            <div className="w-24">
              <Input type="number" min={1} value={p.qty} onChange={(e) => update(i, { qty: Number(e.target.value) })} />
            </div>
            <Button type="button" size="icon" variant="ghost" onClick={() => remove(i)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button onClick={submit} disabled={pending} size="lg">
        {pending ? "Memproses..." : "Selesaikan & Kirim ke Kasir →"}
      </Button>
    </div>
  );
}
