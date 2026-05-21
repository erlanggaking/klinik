import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { storage } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requirePermission("photo.read");
  const userId = (session.user as any).id as string;
  const photo = await prisma.beforeAfterPhoto.findUnique({ where: { id: params.id } });
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.photoAccessLog.create({
    data: { photoId: photo.id, userId, action: "VIEW" },
  });

  const url = await storage().signedUrl(photo.storageKey, 600);
  return NextResponse.json({ url });
}
