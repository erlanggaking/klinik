"use client";

import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import { togglePromoActive } from "./actions";
import { useRouter } from "next/navigation";

export function PromoToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await togglePromoActive(id, new FormData());
          router.refresh();
        })
      }
    >
      {isActive ? "Nonaktifkan" : "Aktifkan"}
    </Button>
  );
}
