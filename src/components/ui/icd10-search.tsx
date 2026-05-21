"use client";

import { useState, useEffect } from "react";
import { Input } from "./input";
import { Label } from "./label";

export function Icd10Search({ name = "diagnosisCode" }: { name?: string }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ code: string; label: string }[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      const res = await fetch(`/api/icd10?q=${encodeURIComponent(q)}`);
      const j = await res.json();
      setResults(j.results ?? []);
    }, 200);
    return () => clearTimeout(t);
  }, [q, open]);

  return (
    <div className="space-y-2">
      <Label>Kode ICD-10 (opsional, autocomplete)</Label>
      <div className="relative">
        <Input
          name={name}
          value={selected || q}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => { setSelected(""); setQ(e.target.value); }}
          placeholder="Cari kode atau nama diagnosa..."
        />
        {open && results.length > 0 && (
          <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover shadow-md">
            {results.map((r) => (
              <button
                key={r.code}
                type="button"
                onMouseDown={() => { setSelected(r.code); setQ(""); setOpen(false); }}
                className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <span className="font-mono text-xs">{r.code}</span>
                <span className="flex-1">{r.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
