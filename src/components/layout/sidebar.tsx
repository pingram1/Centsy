"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Car,
  Gauge,
  Home,
  Receipt,
  Settings,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/branding/logo";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { cn } from "@/lib/utils";
import { useModeStore } from "@/stores/mode-store";
import { modeLabel } from "@/lib/format";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/mileage", label: "Mileage & Gas", icon: Car },
  { href: "/ai", label: "Centsy AI", icon: Bot },
  { href: "/insights", label: "Insights", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const mode = useModeStore((s) => s.mode);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 px-4 py-5 backdrop-blur-md lg:flex">
      <div className="mb-6 px-1">
        <Logo />
        <p className="mt-2 text-xs text-muted-foreground">
          Money that makes money.
        </p>
      </div>

      <ModeToggle className="mb-6 w-full justify-between [&>button]:flex-1 [&>button]:justify-center" />

      <nav className="flex flex-1 flex-col gap-1" aria-label="Main">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/75 hover:bg-muted/70 hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "size-4 transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-border/70 bg-gradient-to-br from-primary/10 via-card to-insight/10 p-3.5">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground">
          <Gauge className="size-3.5 text-primary" />
          Active context
        </div>
        <p className="text-sm font-semibold">{modeLabel(mode)} mode</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Transactions, mileage, and insights are isolated to this mode.
        </p>
      </div>
    </aside>
  );
}
