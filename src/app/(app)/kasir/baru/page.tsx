import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { RetailKasirForm } from "./retail-form";

export const dynamic = "force-dynamic";

/**
 * Transaksi kasir untuk pembelian retail (skincare/produk) tanpa harus lewat MR.
 * Use case: walk-in customer beli produk di etalase klinik.
 */
export default async function NewKasirPage() {
  await requirePermission("kasir.operate");
  const [patients, products] = await Promise.all([
    prisma.patient.findMany({ where: { isActive: true }, orderBy: { fullName: "asc" }, take: 500 }),
    prisma.inventoryItem.findMany({
      where: { isActive: true, itemType: { in: ["SKINCARE", "DRUG"] } },
      orderBy: { nameId: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Transaksi Retail" description="Penjualan skincare/produk tanpa rekam medis." />
      <Card>
        <CardContent className="pt-6">
          <RetailKasirForm
            patients={patients.map((p) => ({ id: p.id, label: `${p.fullName} (${p.mrn})` }))}
            products={products.map((p) => ({
              id: p.id,
              label: `${p.nameId} (${p.unit})`,
              price: Number(p.sellingPrice),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
