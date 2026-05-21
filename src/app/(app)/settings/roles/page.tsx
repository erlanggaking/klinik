import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { ALL_PERMISSIONS } from "@/lib/rbac";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { saveRolePermissions } from "./actions";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  await requirePermission("settings.write");
  const roles = await prisma.role.findMany({
    include: { permissions: { include: { permission: true } } },
    orderBy: { name: "asc" },
  });
  const permissions = await prisma.permission.findMany({ orderBy: { code: "asc" } });

  return (
    <div className="space-y-6">
      <PageHeader title="Role & Permission" description="Atur permission per role." />
      {roles.map((r: any) => {
        const granted = new Set(r.permissions.map((rp: any) => rp.permission.code));
        async function action(fd: FormData) {
          "use server";
          await saveRolePermissions(r.id, fd);
        }
        return (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{r.name} <Badge variant="outline" className="ml-2">{r.code}</Badge></span>
                {r.isSystem ? <Badge variant="secondary">System</Badge> : null}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={action}>
                <div className="grid grid-cols-1 gap-1 md:grid-cols-3">
                  {ALL_PERMISSIONS.map((p) => (
                    <label key={p} className="flex items-center gap-2 text-xs">
                      <input type="checkbox" name="perm" value={p} defaultChecked={granted.has(p)} />
                      <span className="font-mono">{p}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-4">
                  <Button type="submit" size="sm">Simpan Role {r.code}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
