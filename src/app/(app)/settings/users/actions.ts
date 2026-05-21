"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function createUser(formData: FormData) {
  await requirePermission("settings.write");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const roleCodes = formData.getAll("role").map((v) => String(v));
  const staffType = String(formData.get("staffType") ?? "") || null;
  if (!email || !name || !password) return { error: "Email, nama, password wajib" };
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const u = await prisma.user.create({ data: { email, name, passwordHash, isActive: true } });
    for (const code of roleCodes) {
      const role = await prisma.role.findUnique({ where: { code } });
      if (role) await prisma.userRole.create({ data: { userId: u.id, roleId: role.id } });
    }
    if (staffType) {
      await prisma.staffProfile.create({
        data: {
          userId: u.id,
          staffType: staffType as any,
          specialty: String(formData.get("specialty") ?? "") || null,
          licenseNumber: String(formData.get("licenseNumber") ?? "") || null,
        },
      });
    }
    revalidatePath("/settings/users");
    return { id: u.id };
  } catch (e: any) {
    return { error: e?.message ?? "Gagal" };
  }
}

export async function toggleUserActive(userId: string, _formData: FormData) {
  await requirePermission("settings.write");
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u) return;
  await prisma.user.update({ where: { id: userId }, data: { isActive: !u.isActive } });
  revalidatePath("/settings/users");
}

export async function resetUserPassword(userId: string, newPassword: string) {
  await requirePermission("settings.write");
  if (newPassword.length < 6) return { error: "Password min 6 karakter" };
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return { ok: true };
}
