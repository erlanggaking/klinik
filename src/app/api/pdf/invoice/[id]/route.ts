import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/rbac";
import { InvoicePDF } from "@/lib/pdf/invoice";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await requireSession();
  const url = new URL(req.url);
  const isReceipt = url.searchParams.get("receipt") === "1";

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { patient: true, items: true, payments: true },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const qr = await QRCode.toDataURL(`INV:${invoice.code}|${Number(invoice.grandTotal)}`, { margin: 1, scale: 4 });

  const pdf = await renderToBuffer(
    InvoicePDF({
      invoice: {
        code: invoice.code,
        issuedAt: invoice.issuedAt,
        grandTotal: Number(invoice.grandTotal),
        subtotal: Number(invoice.subtotal),
        discountTotal: Number(invoice.discountTotal),
        taxTotal: Number(invoice.taxTotal),
        paidTotal: Number(invoice.paidTotal),
        status: invoice.status,
        items: invoice.items.map((i: any) => ({
          description: i.description,
          qty: Number(i.qty),
          unitPrice: Number(i.unitPrice),
          total: Number(i.total),
        })),
        payments: invoice.payments.map((p: any) => ({
          method: p.method,
          amount: Number(p.amount),
          reference: p.reference,
        })),
      },
      patient: { fullName: invoice.patient.fullName, mrn: invoice.patient.mrn, phone: invoice.patient.phone },
      qrDataUrl: qr,
      isReceipt,
    })
  );

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${isReceipt ? "Kwitansi" : "Invoice"}-${invoice.code}.pdf"`,
    },
  });
}
