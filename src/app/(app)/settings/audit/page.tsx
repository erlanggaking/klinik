import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AuditLogPage() {
  await requirePermission("audit.read");
  const [audits, photoAccess] = await Promise.all([
    prisma.auditLog.findMany({ include: { user: true }, orderBy: { at: "desc" }, take: 200 }),
    prisma.photoAccessLog.findMany({ include: { user: true, photo: { include: { patient: true } } }, orderBy: { at: "desc" }, take: 100 }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Trail aktivitas pengguna & akses foto sensitif."
      />

      <Card>
        <CardContent className="p-0">
          <div className="border-b p-4 text-sm font-medium">Aktivitas Aplikasi (200 terbaru)</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audits.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">Belum ada aktivitas tercatat.</TableCell></TableRow>
              ) : audits.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell>{formatDateTime(a.at)}</TableCell>
                  <TableCell>{a.user?.name ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline">{a.action}</Badge></TableCell>
                  <TableCell className="text-xs">{a.entity}{a.entityId ? `:${a.entityId.slice(-6)}` : ""}</TableCell>
                  <TableCell className="font-mono text-xs">{a.ipAddress ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="border-b p-4 text-sm font-medium">Akses Foto Sensitif (100 terbaru)</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Pasien</TableHead>
                <TableHead>Foto Tipe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {photoAccess.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">Belum ada akses foto.</TableCell></TableRow>
              ) : photoAccess.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell>{formatDateTime(a.at)}</TableCell>
                  <TableCell>{a.user.name}</TableCell>
                  <TableCell><Badge variant={a.action === "EXPORT" ? "warning" : "outline"}>{a.action}</Badge></TableCell>
                  <TableCell>{a.photo.patient.fullName}</TableCell>
                  <TableCell><Badge variant="outline">{a.photo.kind}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
