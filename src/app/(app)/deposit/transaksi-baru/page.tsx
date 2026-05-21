import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Decimal } from "@prisma/client/runtime/library";

export default async function NewCashEntryPage() {
  await requirePermission("deposit.write");
  const accounts = await prisma.cashAccount.findMany({ where: { isActive: true } });

  async function action(fd: FormData) {
    "use server";
    await requirePermission("deposit.write");
    const accountId = String(fd.get("accountId") ?? "");
    const entryType = String(fd.get("entryType") ?? "IN") as "IN" | "OUT";
    const amount = Number(fd.get("amount") ?? 0);
    const description = String(fd.get("description") ?? "").trim();
    if (!accountId || !amount || !description) return;
    await prisma.cashEntry.create({
      data: {
        accountId,
        entryType,
        amount: new Decimal(amount),
        category: String(fd.get("category") ?? "") || null,
        description,
        refType: "MANUAL",
      },
    });
    redirect("/deposit");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Transaksi Kas Baru" />
      <Card>
        <CardContent className="pt-6">
          <form action={action} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Akun *</Label>
              <select name="accountId" required className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">Pilih akun...</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.accountType})</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tipe *</Label>
              <select name="entryType" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="IN">Masuk (IN)</option>
                <option value="OUT">Keluar (OUT)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Jumlah *</Label>
              <Input type="number" min={1} name="amount" required />
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Input name="category" placeholder="OPS_EXPENSE / SALARY / ..." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Deskripsi *</Label>
              <Input name="description" required />
            </div>
            <div className="md:col-span-2"><Button type="submit">Simpan</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
