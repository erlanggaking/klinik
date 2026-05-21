import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatIDR, formatDateTime } from "@/lib/format";
import { PaymentForm } from "./payment-form";

export const dynamic = "force-dynamic";

export default async function KasirInvoicePage({ params }: { params: { id: string } }) {
  await requirePermission("kasir.operate");
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      patient: true,
      items: true,
      payments: { orderBy: { paidAt: "desc" } },
    },
  });
  if (!invoice) notFound();

  const cashAccounts = await prisma.cashAccount.findMany({ where: { isActive: true } });
  const remaining = Number(invoice.grandTotal) - Number(invoice.paidTotal);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Invoice ${invoice.code}`}
        description={`${invoice.patient.fullName} · ${formatDateTime(invoice.issuedAt)}`}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Detail</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Diskon</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((it: any) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-medium">{it.description}</TableCell>
                    <TableCell><Badge variant="outline">{it.itemType}</Badge></TableCell>
                    <TableCell>{Number(it.qty)}</TableCell>
                    <TableCell>{formatIDR(Number(it.unitPrice))}</TableCell>
                    <TableCell>{Number(it.discountPct) > 0 ? `${Number(it.discountPct)}%` : formatIDR(Number(it.discountAmount))}</TableCell>
                    <TableCell className="text-right">{formatIDR(Number(it.total))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ringkasan</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row k="Subtotal" v={formatIDR(Number(invoice.subtotal))} />
            <Row k="Diskon" v={formatIDR(Number(invoice.discountTotal))} />
            <Row k="Pajak" v={formatIDR(Number(invoice.taxTotal))} />
            <Row k="Grand Total" v={<strong>{formatIDR(Number(invoice.grandTotal))}</strong>} />
            <Row k="Sudah Dibayar" v={formatIDR(Number(invoice.paidTotal))} />
            <Row k="Sisa" v={<span className="font-semibold text-primary">{formatIDR(remaining)}</span>} />
            <div className="pt-2"><Badge>{invoice.status}</Badge></div>
          </CardContent>
        </Card>
      </div>

      {remaining > 0 ? (
        <Card>
          <CardHeader><CardTitle>Pembayaran</CardTitle></CardHeader>
          <CardContent>
            <PaymentForm
              invoiceId={invoice.id}
              remaining={remaining}
              cashAccounts={cashAccounts.map((a) => ({ id: a.id, name: a.name, type: a.accountType }))}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader><CardTitle>Riwayat Pembayaran</CardTitle></CardHeader>
        <CardContent>
          {invoice.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada pembayaran.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Ref</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDateTime(p.paidAt)}</TableCell>
                    <TableCell>{p.method}</TableCell>
                    <TableCell className="font-mono text-xs">{p.reference ?? "-"}</TableCell>
                    <TableCell className="text-right">{formatIDR(Number(p.amount))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
      <div className="text-muted-foreground">{k}</div>
      <div>{v}</div>
    </div>
  );
}
