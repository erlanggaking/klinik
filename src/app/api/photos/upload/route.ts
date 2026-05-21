import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { storage, buildPhotoKey } from "@/lib/storage";
import { watermarkImage } from "@/lib/image";

export async function POST(req: NextRequest) {
  const session = await requirePermission("photo.write");
  const userId = (session.user as any).id as string;

  const fd = await req.formData();
  const file = fd.get("file") as File | null;
  const patientId = String(fd.get("patientId") ?? "");
  const kind = String(fd.get("kind") ?? "BEFORE") as "BEFORE" | "AFTER" | "PROGRESS";
  const bodyArea = String(fd.get("bodyArea") ?? "") || null;
  const notes = String(fd.get("notes") ?? "") || null;
  const isPublishable = fd.get("isPublishable") === "on";
  const consentId = String(fd.get("consentId") ?? "") || null;
  const treatmentId = String(fd.get("treatmentId") ?? "") || null;
  const medicalRecordId = String(fd.get("medicalRecordId") ?? "") || null;

  if (!file || !patientId) {
    return NextResponse.json({ error: "File & pasien wajib" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Ukuran file melebihi 10MB" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return NextResponse.json({ error: "Pasien tidak ditemukan" }, { status: 404 });

  const watermarked = await watermarkImage(buf, {
    line1: process.env.CLINIC_NAME ?? "Klinik Cantik",
    line2: `${patient.mrn} · ${new Date().toLocaleString("id-ID")}`,
  });

  const key = buildPhotoKey(patientId, file.name.replace(/\.\w+$/, ".jpg"));
  await storage().put(key, watermarked, "image/jpeg");

  const photo = await prisma.beforeAfterPhoto.create({
    data: {
      patientId,
      medicalRecordId,
      treatmentId,
      kind,
      storageKey: key,
      watermarked: true,
      bodyArea,
      notes,
      consentId,
      isPublishable,
      uploadedById: userId,
    },
  });

  return NextResponse.json({ ok: true, id: photo.id, key });
}
