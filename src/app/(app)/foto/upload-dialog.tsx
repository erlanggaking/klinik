"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";

export function UploadPhotoDialog({
  patients,
}: {
  patients: { id: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  async function action(fd: FormData) {
    setPending(true);
    setError(null);
    const res = await fetch("/api/photos/upload", { method: "POST", body: fd });
    setPending(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Gagal upload");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4" /> Upload Foto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Foto Before-After</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-3">
          <div className="space-y-2">
            <Label>Pasien *</Label>
            <select name="patientId" required className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Pilih pasien...</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipe *</Label>
              <select name="kind" required className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="BEFORE">Before</option>
                <option value="AFTER">After</option>
                <option value="PROGRESS">Progress</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Area</Label>
              <select name="bodyArea" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">-</option>
                <option value="FACE_FRONT">Wajah Depan</option>
                <option value="FACE_LEFT">Wajah Kiri</option>
                <option value="FACE_RIGHT">Wajah Kanan</option>
                <option value="NECK">Leher</option>
                <option value="BACK">Punggung</option>
                <option value="OTHER">Lainnya</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>File Foto * (JPG/PNG, max 10MB)</Label>
            <Input ref={fileRef} type="file" name="file" accept="image/*" required />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isPublishable" name="isPublishable" />
            <Label htmlFor="isPublishable" className="text-xs">Pasien izinkan untuk dipublikasikan / marketing</Label>
          </div>
          <div className="space-y-2">
            <Label>Catatan</Label>
            <Input name="notes" />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>{pending ? "Mengupload..." : "Upload"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
