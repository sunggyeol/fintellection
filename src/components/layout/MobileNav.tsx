"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BrainCircuit,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/research", label: "Research Analyst", icon: BrainCircuit },
  { href: "/trader", label: "Agentic Trader", icon: Bot },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-nav-safe flex w-full shrink-0 items-stretch border-t border-border bg-surface lg:hidden">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="size-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
