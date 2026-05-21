import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import { pdfStyles as s, clinicMeta, fmtIDR, fmtDate } from "./common";

export type InvoicePDFProps = {
  invoice: {
    code: string;
    issuedAt: Date | string;
    grandTotal: number | string;
    subtotal: number | string;
    discountTotal: number | string;
    taxTotal: number | string;
    paidTotal: number | string;
    status: string;
    items: Array<{
      description: string;
      qty: number | string;
      unitPrice: number | string;
      total: number | string;
    }>;
    payments?: Array<{ method: string; amount: number | string; reference?: string | null }>;
  };
  patient: { fullName: string; mrn: string; phone?: string | null };
  qrDataUrl?: string;
  isReceipt?: boolean; // kwitansi (lunas)
};

export function InvoicePDF({ invoice, patient, qrDataUrl, isReceipt }: InvoicePDFProps) {
  const c = clinicMeta();
  const remaining = Number(invoice.grandTotal) - Number(invoice.paidTotal);

  return (
    <Document>
      <Page size="A5" style={s.page}>
        <View style={s.header}>
          <View style={s.brand}>
            <Text style={s.brandName}>{c.name}</Text>
            <Text style={s.brandSub}>{c.address}</Text>
            <Text style={s.brandSub}>{c.phone} · {c.email}</Text>
          </View>
          <View style={s.meta}>
            <Text style={s.metaTitle}>{isReceipt ? "KWITANSI" : "INVOICE"}</Text>
            <Text style={s.metaCode}>{invoice.code}</Text>
            <Text>{fmtDate(invoice.issuedAt)}</Text>
            {qrDataUrl ? <Image src={qrDataUrl} style={{ width: 60, height: 60, marginLeft: "auto", marginTop: 4 }} /> : null}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Pasien</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>Nama</Text>
            <Text style={s.rowValue}>{patient.fullName}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>MRN</Text>
            <Text style={s.rowValue}>{patient.mrn}</Text>
          </View>
          {patient.phone ? (
            <View style={s.row}>
              <Text style={s.rowLabel}>Telp</Text>
              <Text style={s.rowValue}>{patient.phone}</Text>
            </View>
          ) : null}
        </View>

        <View style={s.section}>
          <View style={s.th}>
            <Text style={[s.td, { flex: 4 }]}>Item</Text>
            <Text style={[s.td, { flex: 1, textAlign: "right" }]}>Qty</Text>
            <Text style={[s.td, { flex: 2, textAlign: "right" }]}>Harga</Text>
            <Text style={[s.td, { flex: 2, textAlign: "right" }]}>Total</Text>
          </View>
          {invoice.items.map((it, idx) => (
            <View style={s.tr} key={idx}>
              <Text style={[s.td, { flex: 4 }]}>{it.description}</Text>
              <Text style={[s.td, { flex: 1, textAlign: "right" }]}>{Number(it.qty)}</Text>
              <Text style={[s.td, { flex: 2, textAlign: "right" }]}>{fmtIDR(it.unitPrice)}</Text>
              <Text style={[s.td, { flex: 2, textAlign: "right" }]}>{fmtIDR(it.total)}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 8 }}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Subtotal</Text>
            <Text style={s.totalValue}>Rp {fmtIDR(invoice.subtotal)}</Text>
          </View>
          {Number(invoice.discountTotal) > 0 && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Diskon</Text>
              <Text style={s.totalValue}>- Rp {fmtIDR(invoice.discountTotal)}</Text>
            </View>
          )}
          {Number(invoice.taxTotal) > 0 && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Pajak</Text>
              <Text style={s.totalValue}>Rp {fmtIDR(invoice.taxTotal)}</Text>
            </View>
          )}
          <View style={s.totalRow}>
            <Text style={[s.totalLabel, s.grandTotal]}>TOTAL</Text>
            <Text style={[s.totalValue, s.grandTotal]}>Rp {fmtIDR(invoice.grandTotal)}</Text>
          </View>
          {Number(invoice.paidTotal) > 0 && (
            <>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Dibayar</Text>
                <Text style={s.totalValue}>Rp {fmtIDR(invoice.paidTotal)}</Text>
              </View>
              {remaining > 0 && (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Sisa</Text>
                  <Text style={s.totalValue}>Rp {fmtIDR(remaining)}</Text>
                </View>
              )}
            </>
          )}
        </View>

        {invoice.payments && invoice.payments.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Pembayaran</Text>
            {invoice.payments.map((p, i) => (
              <View key={i} style={s.row}>
                <Text style={s.rowLabel}>{p.method}</Text>
                <Text style={s.rowValue}>
                  Rp {fmtIDR(p.amount)} {p.reference ? `· ref ${p.reference}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={s.signatureBox}>
          <Text style={s.signatureLabel}>Hormat kami,</Text>
          <View style={s.signatureLine}></View>
          <Text style={s.signatureName}>{c.name}</Text>
        </View>

        <Text style={s.footer} fixed>
          Terima kasih atas kepercayaan Anda · {c.name} · {invoice.code} · Status: {invoice.status}
        </Text>
      </Page>
    </Document>
  );
}
