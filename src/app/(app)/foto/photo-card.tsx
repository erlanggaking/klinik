"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PhotoCard({
  id,
  storageKey,
  patientName,
  kind,
  bodyArea,
  takenAt,
  isPublishable,
}: {
  id: string;
  storageKey: string;
  patientName: string;
  kind: string;
  bodyArea?: string | null;
  takenAt: Date | string;
  isPublishable: boolean;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/photos/${id}/url`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setSrc(j.url);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [id]);

  return (
    <Card className="overflow-hidden">
      <div className="aspect-square bg-muted">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={`${patientName} ${kind}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Memuat...</div>
        )}
      </div>
      <div className="space-y-1 p-3 text-xs">
        <div className="flex items-center justify-between">
          <Badge variant={kind === "BEFORE" ? "outline" : kind === "AFTER" ? "success" : "info"}>{kind}</Badge>
          {isPublishable ? <Badge variant="secondary">Boleh publikasi</Badge> : null}
        </div>
        <div className="font-medium">{patientName}</div>
        <div className="text-muted-foreground">
          {bodyArea ?? "—"} · {new Date(takenAt).toLocaleDateString("id-ID")}
        </div>
      </div>
    </Card>
  );
}
