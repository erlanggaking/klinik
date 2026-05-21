import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export default async function NewInventoryItemPage() {
  await requirePermission("inventory.write");

  async function action(formData: FormData) {
    "use server";
    await requirePermission("inventory.write");
    const sku = String(formData.get("sku") ?? "").trim();
    const nameId = String(formData.get("nameId") ?? "").trim();
    if (!sku || !nameId) return;
    await prisma.inventoryItem.create({
      data: {
        sku,
        nameId,
        itemType: String(formData.get("itemType") ?? "OTHER") as any,
        unit: String(formData.get("unit") ?? "pcs"),
        sellingPrice: new Decimal(Number(formData.get("sellingPrice") ?? 0)),
        costPrice: new Decimal(Number(formData.get("costPrice") ?? 0)),
        reorderPoint: new Decimal(Number(formData.get("reorderPoint") ?? 0)),
        reorderQty: new Decimal(Number(formData.get("reorderQty") ?? 0)),
        isBatchTracked: formData.get("isBatchTracked") === "on",
      },
    });
    redirect("/inventory");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Item Baru" />
      <Card>
        <CardContent className="pt-6">
          <form action={action} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field name="sku" label="SKU" required />
            <Field name="nameId" label="Nama" required />
            <div className="space-y-2">
              <Label>Tipe</Label>
              <select name="itemType" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="DRUG">Obat (Drug)</option>
                <option value="SKINCARE">Skincare</option>
                <option value="CONSUMABLE">Consumable (Bahan Treatment)</option>
                <option value="EQUIPMENT">Alat</option>
                <option value="OTHER">Lainnya</option>
              </select>
            </div>
            <Field name="unit" label="Unit (pcs/btl/tube/ml)" />
            <Field name="sellingPrice" label="Harga Jual (IDR)" type="number" />
            <Field name="costPrice" label="Harga Beli/HPP (IDR)" type="number" />
            <Field name="reorderPoint" label="Reorder Point (qty)" type="number" />
            <Field name="reorderQty" label="Reorder Qty" type="number" />
            <label className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" name="isBatchTracked" />
              Track per batch & tanggal expired (wajib untuk obat & skincare)
            </label>
            <div className="md:col-span-2"><Button type="submit">Simpan</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ name, label, type = "text", required }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}{required ? " *" : ""}</Label>
      <Input id={name} name={name} type={type} required={required} />
    </div>
  );
}
