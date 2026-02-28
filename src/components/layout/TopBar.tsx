"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { Logo } from "@/components/common/Logo";
import { AuthStatusButton } from "@/components/auth/AuthStatusButton";

export function TopBar() {
  const { setIsOpen } = useGlobalSearch();

  return (
    <header className="flex min-w-0 h-12 items-center justify-between gap-2 border-b border-border bg-surface px-4">
      {/* Logo (visible only on mobile — desktop has sidebar logo) */}
      <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 lg:hidden">
        <Logo size={20} className="text-primary" />
        <span className="truncate text-[13px] font-semibold text-foreground">
          Fintellection
        </span>
      </Link>

      {/* Spacer for desktop (sidebar provides left content) */}
      <div className="hidden lg:block lg:w-7" />

      {/* Search Bar */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-[30px] min-w-0 flex-1 max-w-[180px] items-center gap-2 border border-border bg-background px-2 text-[12px] text-muted-foreground transition-colors hover:bg-elevated sm:mx-auto sm:max-w-[360px] sm:flex-none sm:px-3 sm:text-[13px]"
      >
        <Search className="size-3.5 shrink-0" />
        <span className="hidden sm:inline">Search stocks (⌘K)</span>
        <span className="sm:hidden">Search</span>
      </button>

      {/* Right actions */}
      <div className="flex min-w-0 items-center justify-end">
        <AuthStatusButton />
      </div>
    </header>
  );
}
