"use client";

import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useTransition } from "react";
import { checkInAppointment } from "./actions";
import { useRouter } from "next/navigation";

export function CheckInButton({ appointmentId }: { appointmentId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r: any = await checkInAppointment(appointmentId);
          if (r?.error) alert(r.error);
          router.refresh();
        })
      }
    >
      <LogIn className="h-4 w-4" /> Check-in
    </Button>
  );
}
