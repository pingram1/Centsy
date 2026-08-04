"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Home, Receipt, Settings } from "lucide-react";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/transactions", label: "Activity", icon: Receipt },
  { href: "/ai", label: "AI", icon: Bot },
  { href: "/settings", label: "You", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid h-[4.25rem] max-w-lg grid-cols-5 items-end px-1">
        <TabLink
          href={tabs[0].href}
          label={tabs[0].label}
          icon={tabs[0].icon}
          active={isActive(pathname, tabs[0].href)}
        />
        <TabLink
          href={tabs[1].href}
          label={tabs[1].label}
          icon={tabs[1].icon}
          active={isActive(pathname, tabs[1].href)}
        />

        <div className="relative flex flex-col items-center justify-end pb-1">
          <AddTransactionDialog triggerVariant="fab" />
          <span className="mt-1 text-[10px] font-medium text-primary">Snap</span>
        </div>

        <TabLink
          href={tabs[2].href}
          label={tabs[2].label}
          icon={tabs[2].icon}
          active={isActive(pathname, tabs[2].href)}
        />
        <TabLink
          href={tabs[3].href}
          label={tabs[3].label}
          icon={tabs[3].icon}
          active={isActive(pathname, tabs[3].href)}
        />
      </div>
    </nav>
  );
}

function isActive(pathname: string, href: string) {
  return (
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(href))
  );
}

function TabLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground active:text-foreground"
      )}
    >
      <Icon className={cn("size-5", active && "stroke-[2.25px]")} />
      {label}
    </Link>
  );
}
