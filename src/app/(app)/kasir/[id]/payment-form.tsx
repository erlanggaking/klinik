"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordPayment } from "../actions";

export function PaymentForm({
  invoiceId,
  remaining,
  cashAccounts,
}: {
  invoiceId: string;
  remaining: number;
  cashAccounts: { id: string; name: string; type: string }[];
}) {
  const router = useRouter();
  const [method, setMethod] = useState("CASH");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function action(fd: FormData) {
    setPending(true);
    setError(null);
    const r = await recordPayment(invoiceId, fd);
    setPending(false);
    if (r?.error) setError(r.error);
    else router.refresh();
  }

  return (
    <form action={action} className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <Label>Metode</Label>
        <select
          name="method"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
        >
          <option value="CASH">Cash / Tunai</option>
          <option value="EDC_DEBIT">EDC Debit</option>
          <option value="EDC_CREDIT">EDC Kredit</option>
          <option value="QRIS">QRIS</option>
          <option value="BANK_TRANSFER">Transfer Bank</option>
          <option value="POINTS_REDEMPTION">Tukar Poin</option>
          <option value="OTHER">Lainnya</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>Jumlah</Label>
        <Input type="number" name="amount" defaultValue={remaining} step="1" min={1} max={remaining} required />
      </div>

      <div className="space-y-2">
        <Label>No. Referensi (EDC/QRIS/Transfer)</Label>
        <Input name="reference" placeholder="opsional" />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Akun Kas (catat ke arus kas klinik)</Label>
        <select name="cashAccountId" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
          <option value="">- Tidak dicatat ke kas -</option>
          {cashAccounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
          ))}
        </select>
      </div>

      {error ? <p className="text-sm text-destructive md:col-span-3">{error}</p> : null}
      <div className="md:col-span-3">
        <Button type="submit" disabled={pending}>{pending ? "Memproses..." : "Catat Pembayaran"}</Button>
      </div>
    </form>
  );
}
