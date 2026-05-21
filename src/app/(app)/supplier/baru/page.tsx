import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function NewSupplierPage() {
  await requirePermission("supplier.write");

  async function action(formData: FormData) {
    "use server";
    await requirePermission("supplier.write");
    const code = String(formData.get("code") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    if (!code || !name) return;
    await prisma.supplier.create({
      data: {
        code,
        name,
        contactName: String(formData.get("contactName") ?? "") || null,
        phone: String(formData.get("phone") ?? "") || null,
        email: String(formData.get("email") ?? "") || null,
        address: String(formData.get("address") ?? "") || null,
      },
    });
    redirect("/supplier");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Supplier Baru" />
      <Card>
        <CardContent className="pt-6">
          <form action={action} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <F name="code" label="Kode" required />
            <F name="name" label="Nama Perusahaan" required />
            <F name="contactName" label="Nama Kontak" />
            <F name="phone" label="No. Telp" />
            <F name="email" label="Email" type="email" />
            <F name="address" label="Alamat" className="md:col-span-2" />
            <div className="md:col-span-2"><Button type="submit">Simpan</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function F({ name, label, type = "text", required, className }: { name: string; label: string; type?: string; required?: boolean; className?: string }) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label htmlFor={name}>{label}{required ? " *" : ""}</Label>
      <Input id={name} name={name} type={type} required={required} />
    </div>
  );
}
