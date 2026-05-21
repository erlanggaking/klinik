import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";

export type Permission =
  // Front Office
  | "patient.read" | "patient.write"
  | "appointment.read" | "appointment.write" | "appointment.cancel"
  | "queue.read" | "queue.manage"
  | "membership.read" | "membership.write"
  // Medical
  | "medical_record.read" | "medical_record.write"
  | "diagnosis.write"
  | "treatment.perform"
  | "photo.read" | "photo.write" | "photo.share"
  | "prescription.read" | "prescription.write"
  // Operasional
  | "pharmacy.dispense"
  | "inventory.read" | "inventory.write" | "inventory.opname"
  | "supplier.read" | "supplier.write"
  | "po.read" | "po.write"
  // Financial
  | "kasir.operate" | "kasir.refund" | "kasir.void"
  | "invoice.read" | "invoice.write"
  | "package.read" | "package.write"
  | "deposit.read" | "deposit.write"
  | "report.read"
  // CRM
  | "promo.read" | "promo.write"
  | "loyalty.read" | "loyalty.adjust"
  | "followup.read" | "followup.run"
  | "message.send"
  // Dashboard / Settings
  | "dashboard.read" | "settings.read" | "settings.write"
  | "audit.read";

export const ALL_PERMISSIONS: Permission[] = [
  "patient.read","patient.write",
  "appointment.read","appointment.write","appointment.cancel",
  "queue.read","queue.manage",
  "membership.read","membership.write",
  "medical_record.read","medical_record.write",
  "diagnosis.write",
  "treatment.perform",
  "photo.read","photo.write","photo.share",
  "prescription.read","prescription.write",
  "pharmacy.dispense",
  "inventory.read","inventory.write","inventory.opname",
  "supplier.read","supplier.write",
  "po.read","po.write",
  "kasir.operate","kasir.refund","kasir.void",
  "invoice.read","invoice.write",
  "package.read","package.write",
  "deposit.read","deposit.write",
  "report.read",
  "promo.read","promo.write",
  "loyalty.read","loyalty.adjust",
  "followup.read","followup.run",
  "message.send",
  "dashboard.read","settings.read","settings.write",
  "audit.read",
];

export const ROLE_PRESETS: Record<string, { name: string; permissions: Permission[] }> = {
  ADMIN: {
    name: "Administrator",
    permissions: ALL_PERMISSIONS,
  },
  OWNER: {
    name: "Owner",
    permissions: ALL_PERMISSIONS,
  },
  MANAGER: {
    name: "Manager",
    permissions: [
      "dashboard.read","report.read","audit.read",
      "patient.read","appointment.read","queue.read","membership.read",
      "medical_record.read","photo.read","prescription.read",
      "inventory.read","supplier.read","po.read","po.write",
      "invoice.read","package.read","package.write","deposit.read","deposit.write",
      "promo.read","promo.write","loyalty.read","followup.read","message.send",
      "settings.read",
    ],
  },
  RECEPTIONIST: {
    name: "Resepsionis",
    permissions: [
      "dashboard.read",
      "patient.read","patient.write",
      "appointment.read","appointment.write","appointment.cancel",
      "queue.read","queue.manage",
      "membership.read",
      "invoice.read",
      "promo.read","loyalty.read","followup.read","message.send",
    ],
  },
  DOCTOR: {
    name: "Dokter",
    permissions: [
      "dashboard.read",
      "patient.read",
      "appointment.read","queue.read","queue.manage",
      "medical_record.read","medical_record.write",
      "diagnosis.write","treatment.perform",
      "photo.read","photo.write",
      "prescription.read","prescription.write",
    ],
  },
  THERAPIST: {
    name: "Therapist",
    permissions: [
      "dashboard.read",
      "patient.read",
      "appointment.read","queue.read","queue.manage",
      "medical_record.read",
      "treatment.perform",
      "photo.read","photo.write",
    ],
  },
  CASHIER: {
    name: "Kasir",
    permissions: [
      "dashboard.read",
      "patient.read",
      "invoice.read","invoice.write",
      "kasir.operate","kasir.refund","kasir.void",
      "package.read","package.write",
      "deposit.read","deposit.write",
      "promo.read","loyalty.read","loyalty.adjust",
    ],
  },
  PHARMACIST: {
    name: "Apoteker / Farmasi",
    permissions: [
      "dashboard.read",
      "patient.read",
      "prescription.read","pharmacy.dispense",
      "inventory.read","inventory.write","inventory.opname",
      "supplier.read","po.read","po.write",
    ],
  },
};

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireSession() {
  const session = await getCurrentSession();
  if (!session?.user) redirect("/login");
  return session!;
}

export async function requirePermission(permission: Permission) {
  const session = await requireSession();
  const perms = (session.user as any).permissions as string[];
  if (!perms.includes(permission)) redirect("/forbidden");
  return session;
}

export function hasPermission(perms: string[] | undefined, permission: Permission) {
  return Boolean(perms?.includes(permission));
}
