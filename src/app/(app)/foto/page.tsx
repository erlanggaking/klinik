import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { UploadPhotoDialog } from "./upload-dialog";
import { PhotoCard } from "./photo-card";

export const dynamic = "force-dynamic";

export default async function FotoPage({ searchParams }: { searchParams: { kind?: string; patientId?: string } }) {
  await requirePermission("photo.read");

  const where: any = {};
  if (searchParams.kind) where.kind = searchParams.kind;
  if (searchParams.patientId) where.patientId = searchParams.patientId;

  const [photos, patients] = await Promise.all([
    prisma.beforeAfterPhoto.findMany({
      where,
      include: { patient: true },
      orderBy: { takenAt: "desc" },
      take: 60,
    }),
    prisma.patient.findMany({ orderBy: { fullName: "asc" }, take: 500 }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Before-After Photo"
        description={`Galeri foto pasien dengan watermark, signed URL, & audit log · ${photos.length} foto`}
        actions={
          <UploadPhotoDialog
            patients={patients.map((p) => ({ id: p.id, label: `${p.fullName} (${p.mrn})` }))}
          />
        }
      />

      {photos.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Belum ada foto. Klik "Upload Foto" untuk mulai.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((p: any) => (
            <PhotoCard
              key={p.id}
              id={p.id}
              storageKey={p.storageKey}
              patientName={p.patient.fullName}
              kind={p.kind}
              bodyArea={p.bodyArea}
              takenAt={p.takenAt}
              isPublishable={p.isPublishable}
            />
          ))}
        </div>
      )}
    </div>
  );
}
