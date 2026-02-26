"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BrainCircuit,
  ListChecks,
  Settings,
  CandlestickChart,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/research", label: "Analyst", icon: BrainCircuit },
  { href: "/watchlists", label: "Watchlists", icon: ListChecks },
  { href: "/trader", label: "Trader", icon: CandlestickChart },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-px px-1.5">
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
              "group flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] transition-colors",
              "hover:bg-elevated hover:text-foreground",
              isActive
                ? "bg-elevated text-foreground"
                : "text-muted-foreground"
            )}
          >
            <item.icon
              className={cn(
                "size-4 shrink-0 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
