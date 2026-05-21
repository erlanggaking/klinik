"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { sendBlast } from "./actions";

export function BlastDialog() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const router = useRouter();

  async function action(fd: FormData) {
    setPending(true);
    setCount(null);
    const r = await sendBlast(fd);
    setPending(false);
    if ((r as any).count !== undefined) setCount((r as any).count);
    setTimeout(() => {
      setOpen(false);
      router.refresh();
    }, 1200);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Send className="h-4 w-4" /> Blast WhatsApp
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kirim Blast WhatsApp (dummy)</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-3">
          <div className="space-y-2">
            <Label>Target</Label>
            <select name="target" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="ALL_OPTIN">Semua pasien yang opt-in WA</option>
              <option value="GOLD">Tier Gold ke atas</option>
              <option value="INACTIVE">Pasien Inactive (90 hari)</option>
              <option value="BIRTHDAY_THIS_MONTH">Ultah bulan ini</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Pesan *</Label>
            <Textarea name="body" required placeholder="Halo {{patient.name}}, ada promo spesial..." rows={5} />
            <p className="text-xs text-muted-foreground">
              Variabel: <code>{"{{patient.name}}"}</code>, <code>{"{{clinic.name}}"}</code>
            </p>
          </div>
          {count !== null ? (
            <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-700">
              ✓ {count} pesan masuk ke outbox (dummy — tidak terkirim sampai provider WA dikoneksikan).
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>{pending ? "Memproses..." : "Kirim Blast"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
