"use client";

import { signOut } from "next-auth/react";
import { Button } from "./ui/button";
import { LogOut, Globe } from "lucide-react";
import { useState, useTransition } from "react";
import { GlobalSearch } from "./global-search";
import { ThemeToggle } from "./theme-toggle";

export function Topbar({ name, roles }: { name: string; roles: string[] }) {
  const [, startTransition] = useTransition();
  const [locale, setLocale] = useState<"id" | "en">(
    typeof document !== "undefined" && document.cookie.includes("locale=en") ? "en" : "id"
  );

  function toggleLocale() {
    const next = locale === "id" ? "en" : "id";
    document.cookie = `locale=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
    setLocale(next);
    startTransition(() => {
      location.reload();
    });
  }

  return (
    <div className="flex h-16 items-center justify-between gap-3 border-b bg-card px-4 md:px-6">
      <div className="hidden text-sm text-muted-foreground md:block">
        Halo, <span className="font-medium text-foreground">{name}</span>
        {roles.length ? <span className="ml-2 text-xs">· {roles.join(", ")}</span> : null}
      </div>
      <div className="flex flex-1 items-center justify-end gap-2">
        <GlobalSearch />
        <ThemeToggle />
        <Button variant="ghost" size="sm" onClick={toggleLocale}>
          <Globe className="h-4 w-4" />
          {locale.toUpperCase()}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut className="h-4 w-4" />
          Keluar
        </Button>
      </div>
    </div>
  );
}
