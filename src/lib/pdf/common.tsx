/**
 * Shared PDF styles & helpers.
 * Pakai @react-pdf/renderer (server-side rendering ke buffer).
 * Imported di route handler API, bukan ke React component biasa.
 */
import { StyleSheet } from "@react-pdf/renderer";

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1f2937",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 16,
    marginBottom: 20,
    borderBottom: "2 solid #ec4899",
  },
  brand: { flex: 1 },
  brandName: { fontSize: 20, fontWeight: 700, color: "#ec4899" },
  brandSub: { fontSize: 9, marginTop: 2, color: "#6b7280" },
  meta: { textAlign: "right", fontSize: 9 },
  metaTitle: { fontSize: 16, fontWeight: 700, color: "#374151" },
  metaCode: { fontFamily: "Courier", marginTop: 2 },
  section: { marginTop: 14 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
    color: "#374151",
    textTransform: "uppercase",
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  rowLabel: { color: "#6b7280", width: 90 },
  rowValue: { flex: 1 },
  table: { marginTop: 8, borderTop: "1 solid #e5e7eb", borderBottom: "1 solid #e5e7eb" },
  tr: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottom: "1 solid #f3f4f6",
  },
  th: {
    flexDirection: "row",
    paddingVertical: 6,
    backgroundColor: "#fdf2f8",
    borderBottom: "1 solid #fbcfe8",
    fontWeight: 700,
  },
  td: { paddingHorizontal: 6 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  totalLabel: { width: 120, textAlign: "right", color: "#6b7280" },
  totalValue: { width: 120, textAlign: "right" },
  grandTotal: { fontWeight: 700, fontSize: 12, color: "#ec4899" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
    borderTop: "1 solid #e5e7eb",
    paddingTop: 8,
  },
  signatureBox: {
    marginTop: 24,
    alignItems: "flex-end",
  },
  signatureLabel: { fontSize: 9, color: "#6b7280" },
  signatureName: { marginTop: 6, fontWeight: 700 },
  signatureLine: { marginTop: 30, borderBottom: "1 solid #6b7280", width: 160 },
});

export const clinicMeta = () => ({
  name: process.env.CLINIC_NAME ?? "Klinik Cantik",
  address: process.env.CLINIC_ADDRESS ?? "Jl. Cantik No. 1, Jakarta",
  phone: process.env.CLINIC_PHONE ?? "+62 21 1234 5678",
  email: process.env.CLINIC_EMAIL ?? "info@klinik.id",
});

export function fmtIDR(v: number | string) {
  const n = typeof v === "string" ? Number(v) : v;
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0 }).format(n || 0);
}

export function fmtDate(d: Date | string) {
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });
}
