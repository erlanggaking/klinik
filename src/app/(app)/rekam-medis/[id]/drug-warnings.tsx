"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { checkPrescriptionWarnings } from "@/lib/drug-db";

/**
 * Component yang berjalan di server pun bisa, tapi pakai client agar bisa
 * di-update reactive saat resep ditambah lewat builder.
 */
export function DrugWarnings({
  prescriptions,
  patient,
}: {
  prescriptions: { items: { name: string }[] }[];
  patient?: { knownAllergies?: string | null; gender?: string | null };
}) {
  const warnings = useMemo(() => {
    const lines = prescriptions.flatMap((rx) => rx.items.map((it) => ({ name: it.name })));
    if (lines.length === 0) return [];
    return checkPrescriptionWarnings({ lines, patient });
  }, [prescriptions, patient]);

  if (warnings.length === 0) return null;

  return (
    <Card className="border-amber-300/60 bg-amber-50 dark:bg-amber-950/20">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center gap-2 font-medium text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          {warnings.length} peringatan resep
        </div>
        <ul className="space-y-1 text-sm">
          {warnings.map((w, i) => (
            <li key={i} className={
              w.level === "danger" ? "text-destructive font-medium" :
              w.level === "warning" ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"
            }>
              {w.level === "danger" ? "🚫" : w.level === "warning" ? "⚠️" : "ℹ️"} {w.message}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
