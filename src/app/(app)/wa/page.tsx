import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { BlastDialog } from "./blast-dialog";

export const dynamic = "force-dynamic";

export default async function WhatsAppPage() {
  await requirePermission("message.send");
  const [outbox, templates] = await Promise.all([
    prisma.messageOutbox.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.messageTemplate.findMany({ orderBy: { code: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp"
        description="Outbox, template & blast pesan. Provider WA bisa diset di Pengaturan (Fase 3)."
        actions={<BlastDialog />}
      />
      <Card>
        <CardHeader><CardTitle>Outbox (50 pesan terakhir)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dijadwal</TableHead>
                <TableHead>Tujuan</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Body (preview)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outbox.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">Outbox kosong.</TableCell></TableRow>
              ) : (
                outbox.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell>{formatDateTime(m.scheduledAt)}</TableCell>
                    <TableCell className="font-mono text-xs">{m.toAddress}</TableCell>
                    <TableCell>{m.channel}</TableCell>
                    <TableCell><Badge variant="outline">{m.status}</Badge></TableCell>
                    <TableCell className="max-w-md truncate text-xs">{m.body}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Template Pesan</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Locale</TableHead>
                <TableHead>Body (preview)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.code}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.channel}</TableCell>
                  <TableCell>{t.locale.toUpperCase()}</TableCell>
                  <TableCell className="max-w-md truncate text-xs">{t.body}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
