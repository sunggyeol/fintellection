"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { Logo } from "@/components/common/Logo";
import { AuthStatusButton } from "@/components/auth/AuthStatusButton";

export function TopBar() {
  const { setIsOpen } = useGlobalSearch();

  return (
    <header className="grid h-12 grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-border bg-surface px-4 lg:grid-cols-[1fr_auto_1fr]">
      {/* Logo (visible only on mobile — desktop has sidebar logo) */}
      <div className="flex min-w-0 items-center">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 lg:hidden">
          <Logo size={20} className="text-primary" />
          <span className="truncate text-[13px] font-semibold text-foreground">
            Fintellection
          </span>
        </Link>
      </div>

      {/* Search Bar — fills space on mobile, centered on desktop */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-[30px] min-w-0 items-center gap-2 border border-border bg-background px-2 text-[12px] text-muted-foreground transition-colors hover:bg-elevated sm:px-3 sm:text-[13px] lg:w-[480px]"
      >
        <Search className="size-3.5 shrink-0" />
        <span className="hidden sm:inline">Search stocks (⌘K)</span>
        <span className="sm:hidden">Search</span>
      </button>

      {/* Right actions — fixed width on mobile to prevent search bar shift */}
      <div className="flex w-7 items-center justify-end sm:w-auto">
        <AuthStatusButton />
      </div>
    </header>
  );
}
