import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  await requirePermission("settings.read");
  const tpls = await prisma.messageTemplate.findMany({ orderBy: { code: "asc" } });

  return (
    <div className="space-y-6">
      <PageHeader title="Template Pesan" description="Template otomatis untuk WA & email (reminder, follow-up, dll)." />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Locale</TableHead>
                <TableHead>Body</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tpls.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.code}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell><Badge variant="outline">{t.channel}</Badge></TableCell>
                  <TableCell>{t.locale.toUpperCase()}</TableCell>
                  <TableCell className="whitespace-pre-wrap text-xs">{t.body}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Variabel yang didukung: {"{{patientName}}, {{appointmentTime}}, {{doctorName}}, {{treatmentName}}, {{invoiceCode}}, {{amount}}, {{loyaltyPoints}}, {{tier}}"}
      </p>
    </div>
  );
}
