import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { ToggleUserActive } from "./toggle-active";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requirePermission("settings.write");
  const users = await prisma.user.findMany({
    include: { roles: { include: { role: true } }, staffProfile: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengguna"
        description={`${users.length} user terdaftar.`}
        actions={
          <Button asChild>
            <Link href="/settings/users/baru"><Plus className="h-4 w-4" /> User Baru</Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Staff Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-xs">{u.email}</TableCell>
                  <TableCell className="text-xs">
                    {u.roles.map((r: any) => <Badge key={r.role.id} variant="outline" className="mr-1">{r.role.code}</Badge>)}
                  </TableCell>
                  <TableCell className="text-xs">{u.staffProfile?.staffType ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? "success" : "destructive"}>{u.isActive ? "Aktif" : "Nonaktif"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <ToggleUserActive userId={u.id} isActive={u.isActive} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
