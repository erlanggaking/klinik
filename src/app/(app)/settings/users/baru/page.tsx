import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createUser } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  await requirePermission("settings.write");
  const roles = await prisma.role.findMany();

  async function action(fd: FormData) {
    "use server";
    const r = await createUser(fd);
    if (r?.id) redirect("/settings/users");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pengguna Baru" />
      <Card>
        <CardContent className="pt-6">
          <form action={action} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <F name="email" label="Email" type="email" required />
            <F name="name" label="Nama Lengkap" required />
            <F name="password" label="Password Awal" type="password" required />
            <div className="space-y-2">
              <Label>Staff Type (kalau dokter/therapist)</Label>
              <select name="staffType" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">- (bukan staff klinis)</option>
                <option value="DOCTOR">Dokter</option>
                <option value="THERAPIST">Therapist</option>
                <option value="NURSE">Perawat</option>
                <option value="PHARMACIST">Apoteker</option>
                <option value="OTHER">Lainnya</option>
              </select>
            </div>
            <F name="specialty" label="Spesialisasi (untuk dokter)" />
            <F name="licenseNumber" label="No. STR / Lisensi" />
            <div className="space-y-2 md:col-span-2">
              <Label>Role *</Label>
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => (
                  <label key={r.id} className="flex items-center gap-1 text-sm">
                    <input type="checkbox" name="role" value={r.code} />
                    {r.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2"><Button type="submit">Simpan</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
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
