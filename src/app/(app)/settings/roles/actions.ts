"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function saveRolePermissions(roleId: string, formData: FormData) {
  await requirePermission("settings.write");
  const codes = formData.getAll("perm").map((v) => String(v));
  const perms = await prisma.permission.findMany({ where: { code: { in: codes } } });
  await prisma.rolePermission.deleteMany({ where: { roleId } });
  for (const p of perms) {
    await prisma.rolePermission.create({ data: { roleId, permissionId: p.id } });
  }
  revalidatePath("/settings/roles");
  return { ok: true };
}
