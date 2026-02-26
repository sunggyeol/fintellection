"use client";

import { Search } from "lucide-react";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { Logo } from "@/components/common/Logo";

export function TopBar() {
  const { setIsOpen } = useGlobalSearch();

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-surface px-4">
      {/* Logo (visible only on mobile — desktop has sidebar logo) */}
      <div className="flex items-center gap-2 lg:hidden">
        <Logo size={20} className="text-primary" />
        <span className="text-[13px] font-semibold text-foreground">
          Fintellection
        </span>
      </div>

      {/* Spacer for desktop (sidebar provides left content) */}
      <div className="hidden lg:block lg:w-7" />

      {/* Search Bar */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-[30px] items-center gap-2 border border-border bg-background px-3 text-[13px] text-muted-foreground transition-colors hover:bg-elevated sm:mx-auto sm:w-full sm:max-w-[360px]"
      >
        <Search className="size-3.5 shrink-0" />
        <span className="hidden sm:inline">Search stocks (⌘K)</span>
        <span className="sm:hidden">Search</span>
      </button>

      {/* Right actions placeholder */}
      <div className="hidden w-7 sm:block" />
    </header>
  );
}
