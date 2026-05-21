import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function save(formData: FormData) {
  "use server";
  await requirePermission("settings.write");
  const entries: Record<string, string> = {
    "clinic.name": String(formData.get("name") ?? ""),
    "clinic.address": String(formData.get("address") ?? ""),
    "clinic.phone": String(formData.get("phone") ?? ""),
    "clinic.email": String(formData.get("email") ?? ""),
    "clinic.taxId": String(formData.get("taxId") ?? ""),
    "clinic.licenseNo": String(formData.get("licenseNo") ?? ""),
  };
  for (const [key, value] of Object.entries(entries)) {
    await prisma.setting.upsert({
      where: { key },
      update: { valueJson: value },
      create: { key, valueJson: value },
    });
  }
  revalidatePath("/settings/clinic");
}

export default async function ClinicSettingsPage() {
  await requirePermission("settings.read");
  const settings = await prisma.setting.findMany({ where: { key: { startsWith: "clinic." } } });
  const m = Object.fromEntries(settings.map((s: any) => [s.key, typeof s.valueJson === "string" ? s.valueJson : JSON.stringify(s.valueJson)]));

  return (
    <div className="space-y-6">
      <PageHeader title="Info Klinik" description="Data klinik untuk header invoice, struk, dan PDF resep." />
      <Card>
        <CardHeader><CardTitle>Identitas</CardTitle></CardHeader>
        <CardContent>
          <form action={save} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2"><Label>Nama Klinik *</Label><Input name="name" defaultValue={m["clinic.name"] ?? ""} required /></div>
            <div className="md:col-span-2 space-y-2"><Label>Alamat</Label><Input name="address" defaultValue={m["clinic.address"] ?? ""} /></div>
            <div className="space-y-2"><Label>Telepon</Label><Input name="phone" defaultValue={m["clinic.phone"] ?? ""} /></div>
            <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" defaultValue={m["clinic.email"] ?? ""} /></div>
            <div className="space-y-2"><Label>NPWP</Label><Input name="taxId" defaultValue={m["clinic.taxId"] ?? ""} /></div>
            <div className="space-y-2"><Label>No. Izin Klinik</Label><Input name="licenseNo" defaultValue={m["clinic.licenseNo"] ?? ""} /></div>
            <div className="md:col-span-2"><Button type="submit">Simpan</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
