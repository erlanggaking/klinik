import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  await requirePermission("report.read");
  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "revenue";
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");
  const from = fromStr ? new Date(fromStr) : new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const to = toStr ? new Date(toStr) : new Date();

  const wb = XLSX.utils.book_new();

  if (type === "revenue" || type === "all") {
    const payments = await prisma.payment.findMany({
      where: { paidAt: { gte: from, lte: to } },
      include: { invoice: { include: { patient: true } } },
      orderBy: { paidAt: "desc" },
    });
    const ws = XLSX.utils.json_to_sheet(
      payments.map((p: any) => ({
        Tanggal: p.paidAt.toISOString().slice(0, 16).replace("T", " "),
        Invoice: p.invoice.code,
        Pasien: p.invoice.patient.fullName,
        MRN: p.invoice.patient.mrn,
        Metode: p.method,
        Referensi: p.reference ?? "",
        Jumlah: Number(p.amount),
      }))
    );
    XLSX.utils.book_append_sheet(wb, ws, "Pendapatan");
  }

  if (type === "treatment" || type === "all") {
    const items = await prisma.treatmentItem.findMany({
      where: { performedAt: { gte: from, lte: to } },
      include: { treatment: true, performedBy: { include: { user: true } } },
      orderBy: { performedAt: "desc" },
    });
    const patientIds = Array.from(new Set(items.map((i: any) => i.patientId)));
    const patients = await prisma.patient.findMany({ where: { id: { in: patientIds } } });
    const pMap = new Map(patients.map((p: any) => [p.id, p]));
    const ws = XLSX.utils.json_to_sheet(
      items.map((t: any) => {
        const p = pMap.get(t.patientId) as any;
        return {
          Tanggal: t.performedAt.toISOString().slice(0, 16).replace("T", " "),
          Treatment: t.treatment.nameId,
          Pasien: p?.fullName ?? "",
          MRN: p?.mrn ?? "",
          "Therapist/Dokter": t.performedBy?.user.name ?? "",
          Qty: Number(t.qty),
          Total: Number(t.total),
          Outcome: t.outcome,
        };
      })
    );
    XLSX.utils.book_append_sheet(wb, ws, "Treatment");
  }

  if (type === "inventory" || type === "all") {
    const items = await prisma.inventoryItem.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { nameId: "asc" },
    });
    const ws = XLSX.utils.json_to_sheet(
      items.map((it: any) => ({
        SKU: it.sku,
        Nama: it.nameId,
        Tipe: it.itemType,
        Unit: it.unit,
        "Reorder Point": Number(it.reorderPoint),
        "Harga Beli": Number(it.costPrice),
        "Harga Jual": Number(it.sellingPrice),
        "Batch Tracked": it.isBatchTracked ? "Ya" : "Tidak",
      }))
    );
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
  }

  if (type === "patients" || type === "all") {
    const patients = await prisma.patient.findMany({
      include: { membershipTier: true },
      orderBy: { createdAt: "desc" },
    });
    const ws = XLSX.utils.json_to_sheet(
      patients.map((p: any) => ({
        MRN: p.mrn,
        Nama: p.fullName,
        Telp: p.phone,
        Email: p.email ?? "",
        "Jenis Kelamin": p.gender ?? "",
        "Tgl Lahir": p.birthDate?.toISOString().slice(0, 10) ?? "",
        Membership: p.membershipTier?.name ?? "",
        Poin: p.loyaltyPoints,
        "Alergi": p.knownAllergies ?? "",
      }))
    );
    XLSX.utils.book_append_sheet(wb, ws, "Pasien");
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const fname = `Laporan-${type}-${from.toISOString().slice(0, 10)}-${to.toISOString().slice(0, 10)}.xlsx`;
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fname}"`,
    },
  });
}
