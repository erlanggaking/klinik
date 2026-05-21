"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CommandDialog, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from "@/components/ui/cmdk";
import { searchEverywhere } from "@/app/(app)/_actions/search";
import { Search } from "lucide-react";
import { navGroups } from "./nav";

type Result = {
  patients: { id: string; mrn: string; fullName: string; phone: string }[];
  invoices: { id: string; code: string; patientName: string }[];
  appointments: { id: string; code: string; patientName: string }[];
  records: { id: string; code: string; patientName: string }[];
};

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [data, setData] = useState<Result>({ patients: [], invoices: [], appointments: [], records: [] });
  const [pending, start] = useTransition();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!q) { setData({ patients: [], invoices: [], appointments: [], records: [] }); return; }
    const t = setTimeout(() => {
      start(async () => {
        const r = await searchEverywhere(q);
        setData(r as Result);
      });
    }, 200);
    return () => clearTimeout(t);
  }, [q, open]);

  function go(href: string) { setOpen(false); router.push(href); }

  const navItems = navGroups.flatMap((g) => g.items);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent md:flex"
      >
        <Search className="h-3.5 w-3.5" />
        Cari... <kbd className="ml-2 rounded border bg-muted px-1 text-[10px]">⌘K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput value={q} onValueChange={setQ} placeholder="Cari pasien, invoice, appointment, atau menu..." />
        <CommandList className="max-h-[60vh] overflow-y-auto p-2">
          <CommandEmpty className="p-6 text-center text-sm text-muted-foreground">
            {pending ? "Mencari..." : "Ketik untuk mencari."}
          </CommandEmpty>

          {!q && (
            <CommandGroup heading="Navigasi" className="px-2 py-1 text-xs uppercase tracking-wider text-muted-foreground">
              {navItems.map((it) => (
                <CommandItem key={it.href} onSelect={() => go(it.href)}>
                  <it.icon className="h-4 w-4 text-muted-foreground" /> {it.label}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {data.patients.length > 0 && (
            <CommandGroup heading="Pasien" className="px-2 py-1 text-xs uppercase tracking-wider text-muted-foreground">
              {data.patients.map((p) => (
                <CommandItem key={p.id} onSelect={() => go(`/pasien/${p.id}`)}>
                  <div className="flex-1">
                    <div className="font-medium">{p.fullName}</div>
                    <div className="text-xs text-muted-foreground">{p.mrn} · {p.phone}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {data.invoices.length > 0 && (
            <CommandGroup heading="Invoice" className="px-2 py-1 text-xs uppercase tracking-wider text-muted-foreground">
              {data.invoices.map((iv) => (
                <CommandItem key={iv.id} onSelect={() => go(`/kasir/${iv.id}`)}>
                  <span className="font-mono text-xs">{iv.code}</span>
                  <span className="ml-2 text-muted-foreground">· {iv.patientName}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {data.appointments.length > 0 && (
            <CommandGroup heading="Appointment" className="px-2 py-1 text-xs uppercase tracking-wider text-muted-foreground">
              {data.appointments.map((a) => (
                <CommandItem key={a.id} onSelect={() => go(`/appointment`)}>
                  <span className="font-mono text-xs">{a.code}</span>
                  <span className="ml-2 text-muted-foreground">· {a.patientName}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {data.records.length > 0 && (
            <CommandGroup heading="Rekam Medis" className="px-2 py-1 text-xs uppercase tracking-wider text-muted-foreground">
              {data.records.map((r) => (
                <CommandItem key={r.id} onSelect={() => go(`/rekam-medis/${r.id}`)}>
                  <span className="font-mono text-xs">{r.code}</span>
                  <span className="ml-2 text-muted-foreground">· {r.patientName}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
