"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { portalLogin } from "../actions";

export function PortalLoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [mrn, setMrn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const r = await portalLogin(phone, mrn);
    setLoading(false);
    if ((r as any).error) {
      setError((r as any).error);
      return;
    }
    router.push("/portal");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>No. WhatsApp</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08123..." required />
      </div>
      <div className="space-y-2">
        <Label>No. MRN</Label>
        <Input value={mrn} onChange={(e) => setMrn(e.target.value)} placeholder="PT-2026-00001" required />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Memproses..." : "Masuk"}
      </Button>
    </form>
  );
}
