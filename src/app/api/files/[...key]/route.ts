import { NextRequest, NextResponse } from "next/server";
import { storage, verifySignedKey } from "@/lib/storage";
import { getCurrentSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { key: string[] } }) {
  const key = decodeURIComponent(params.key.join("/"));
  const exp = req.nextUrl.searchParams.get("exp") ?? "";
  const sig = req.nextUrl.searchParams.get("sig") ?? "";

  // Two-tier auth: signed URL OR authenticated session.
  let allowed = false;
  if (sig && verifySignedKey(key, exp, sig)) allowed = true;
  if (!allowed) {
    const session = await getCurrentSession();
    if (session?.user) allowed = true;
  }
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Audit log access (best-effort)
  try {
    const session = await getCurrentSession();
    const photo = await prisma.beforeAfterPhoto.findFirst({ where: { storageKey: key } });
    if (photo && session?.user) {
      await prisma.photoAccessLog.create({
        data: {
          photoId: photo.id,
          userId: (session.user as any).id,
          action: "VIEW",
          ipAddress: req.headers.get("x-forwarded-for") ?? null,
          userAgent: req.headers.get("user-agent") ?? null,
        },
      });
    }
  } catch {}

  try {
    const buf = await storage().get(key);
    // Convert Node Buffer -> Uint8Array for Web Response body compatibility
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": guessMime(key),
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

function guessMime(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext) return "application/octet-stream";
  return (
    {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      pdf: "application/pdf",
    } as Record<string, string>
  )[ext] ?? "application/octet-stream";
}
