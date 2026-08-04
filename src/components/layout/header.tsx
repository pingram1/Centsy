"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Logo } from "@/components/branding/logo";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useModeStore } from "@/stores/mode-store";
import { modeLabel } from "@/lib/format";
import { api } from "@/lib/client-api";

export function Header() {
  const mode = useModeStore((s) => s.mode);
  const [name, setName] = useState("You");

  useEffect(() => {
    api<{ user: { fullName: string } }>("/api/auth/me")
      .then((d) => setName(d.user.fullName.split(" ")[0] || "You"))
      .catch(() => setName("You"));
  }, []);

  const initials = name.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="flex h-14 items-center gap-3 px-4 sm:h-16 sm:px-6">
        <Logo size="sm" className="lg:hidden" />

        <div className="hidden min-w-0 flex-1 flex-col lg:flex">
          <p className="truncate text-sm text-muted-foreground">Hi, {name}</p>
          <p className="truncate text-sm font-medium">
            {modeLabel(mode)} · live
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
          <div className="hidden lg:block">
            <AddTransactionDialog triggerVariant="button" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="relative size-10"
            render={<Link href="/ai" />}
          >
            <Sparkles className="size-4" />
            <span className="sr-only">Centsy AI</span>
          </Button>
          <Link
            href="/settings"
            className="hidden rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:block"
          >
            <Avatar size="sm">
              <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
