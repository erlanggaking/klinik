import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Decimal } from "@prisma/client/runtime/library";

export default async function NewCashAccountPage() {
  await requirePermission("deposit.write");

  async function action(fd: FormData) {
    "use server";
    await requirePermission("deposit.write");
    await prisma.cashAccount.create({
      data: {
        code: String(fd.get("code") ?? ""),
        name: String(fd.get("name") ?? ""),
        accountType: String(fd.get("accountType") ?? "CASH") as any,
        bankName: String(fd.get("bankName") ?? "") || null,
        accountNo: String(fd.get("accountNo") ?? "") || null,
        openingBalance: new Decimal(Number(fd.get("openingBalance") ?? 0)),
      },
    });
    redirect("/deposit");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Akun Kas Baru" />
      <Card>
        <CardContent className="pt-6">
          <form action={action} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field name="code" label="Kode" required />
            <Field name="name" label="Nama Akun (Kas Tunai / Bank BCA / dll)" required />
            <div className="space-y-2">
              <Label>Tipe</Label>
              <select name="accountType" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="CASH">CASH</option>
                <option value="BANK">BANK</option>
                <option value="EDC">EDC</option>
                <option value="EWALLET">EWALLET</option>
              </select>
            </div>
            <Field name="bankName" label="Nama Bank (untuk BANK/EDC)" />
            <Field name="accountNo" label="No. Rekening" />
            <Field name="openingBalance" label="Saldo Awal (IDR)" type="number" />
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
