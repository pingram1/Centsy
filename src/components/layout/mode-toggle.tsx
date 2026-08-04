"use client";

import { Building2, User } from "lucide-react";
import { useModeStore } from "@/stores/mode-store";
import { cn } from "@/lib/utils";
import type { FinanceMode } from "@/lib/types";

export function ModeToggle({ className }: { className?: string }) {
  const mode = useModeStore((s) => s.mode);
  const setMode = useModeStore((s) => s.setMode);

  return (
    <div
      role="group"
      aria-label="Finance mode"
      className={cn(
        "inline-flex items-center rounded-full border border-border/80 bg-card/80 p-1 shadow-sm backdrop-blur-sm",
        className
      )}
    >
      <ModeButton
        active={mode === "personal"}
        onClick={() => setMode("personal")}
        icon={<User className="size-3.5" />}
        label="Personal"
        mode="personal"
      />
      <ModeButton
        active={mode === "business"}
        onClick={() => setMode("business")}
        icon={<Building2 className="size-3.5" />}
        label="Business"
        mode="business"
      />
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
  mode,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  mode: FinanceMode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-all duration-200",
        active
          ? mode === "business"
            ? "bg-foreground text-background shadow-sm"
            : "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
