"use client";

import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import { callTicket, startServing, completeStage, skipTicket } from "./actions";
import { useRouter } from "next/navigation";

export function QueueActions({ ticketId, stage, status }: { ticketId: string; stage: string; status: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function run(fn: () => Promise<any>) {
    start(async () => {
      const r = await fn();
      if (r?.error) alert(r.error);
      router.refresh();
    });
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {status === "WAITING" && (
        <Button size="sm" disabled={pending} onClick={() => run(() => callTicket(ticketId))}>
          Panggil
        </Button>
      )}
      {status === "CALLED" && (
        <Button size="sm" disabled={pending} onClick={() => run(() => startServing(ticketId))}>
          Mulai Layani
        </Button>
      )}
      {status === "IN_PROGRESS" && (
        <Button size="sm" variant="default" disabled={pending} onClick={() => run(() => completeStage(ticketId))}>
          Selesai → Lanjut
        </Button>
      )}
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => skipTicket(ticketId))}>
        Skip
      </Button>
    </div>
  );
}
