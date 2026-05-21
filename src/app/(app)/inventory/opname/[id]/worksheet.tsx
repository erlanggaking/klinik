"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { updateOpnamePhysical, commitOpname } from "../actions";

type Row = {
  id: string;
  itemSku: string;
  itemName: string;
  unit: string;
  systemQty: number;
  physicalQty: number;
  note: string;
};

export function OpnameWorksheet({
  opnameId,
  committed,
  items,
}: {
  opnameId: string;
  committed: boolean;
  items: Row[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(items);
  const [pending, setPending] = useState(false);

  function update(i: number, p: Partial<Row>) {
    setRows((l) => l.map((x, idx) => (idx === i ? { ...x, ...p } : x)));
  }

  async function save() {
    setPending(true);
    await updateOpnamePhysical(
      opnameId,
      rows.map((r) => ({ id: r.id, physicalQty: r.physicalQty, note: r.note }))
    );
    setPending(false);
    router.refresh();
  }

  async function commit() {
    if (!confirm("Commit opname akan membuat stock movement adjustment. Lanjutkan?")) return;
    setPending(true);
    await save();
    await commitOpname(opnameId);
    setPending(false);
    router.push("/inventory/opname");
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Sistem</TableHead>
            <TableHead>Fisik</TableHead>
            <TableHead>Selisih</TableHead>
            <TableHead>Catatan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => {
            const diff = r.physicalQty - r.systemQty;
            return (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.itemSku}</TableCell>
                <TableCell>
                  <div className="font-medium">{r.itemName}</div>
                  <div className="text-xs text-muted-foreground">{r.unit}</div>
                </TableCell>
                <TableCell className="text-muted-foreground">{r.systemQty}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    className="w-24"
                    value={r.physicalQty}
                    disabled={committed}
                    onChange={(e) => update(i, { physicalQty: Number(e.target.value) })}
                  />
                </TableCell>
                <TableCell className={diff === 0 ? "text-muted-foreground" : diff > 0 ? "text-emerald-600" : "text-destructive"}>
                  {diff > 0 ? `+${diff}` : diff}
                </TableCell>
                <TableCell>
                  <Input
                    className="w-48"
                    value={r.note}
                    disabled={committed}
                    placeholder="Catatan..."
                    onChange={(e) => update(i, { note: e.target.value })}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {!committed && (
        <div className="flex gap-2 border-t p-4">
          <Button onClick={save} variant="outline" disabled={pending}>Simpan Draft</Button>
          <Button onClick={commit} disabled={pending}>Commit Opname →</Button>
        </div>
      )}
    </>
  );
}
