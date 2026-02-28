"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, LogIn, LogOut, Settings, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function getInitials(name: string | null, email: string | null) {
  const source = (name ?? email ?? "").trim();
  if (!source) return "U";

  const parts = source.split(/\s+/).slice(0, 2);
  const initials = parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
  return initials || "U";
}

export function AuthStatusButton() {
  const { user, profile, mode, isReady, signInWithGoogle, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const displayName = useMemo(() => {
    return profile?.display_name ?? user?.email ?? "User";
  }, [profile?.display_name, user?.email]);

  const initials = useMemo(
    () => getInitials(profile?.display_name ?? null, user?.email ?? null),
    [profile?.display_name, user?.email]
  );

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!isReady) {
    return <div className="h-7 w-[84px]" aria-hidden />;
  }

  if (mode === "anonymous") {
    return (
      <button
        type="button"
        onClick={async () => {
          setBusy(true);
          try {
            await signInWithGoogle();
          } finally {
            setBusy(false);
          }
        }}
        disabled={busy}
        className="inline-flex h-7 items-center gap-1.5 border border-border bg-card px-2.5 text-xs text-foreground transition-colors hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <LogIn className="size-3" />
        )}
        <span className="hidden sm:inline">Sign in</span>
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      {/* Profile button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-7 items-center gap-1.5 border border-border bg-card px-2 text-xs text-foreground transition-colors hover:bg-elevated"
      >
        <span className="inline-flex size-4 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
          {initials}
        </span>
        <span className="hidden max-w-[140px] truncate sm:inline">
          {displayName}
        </span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 border border-border bg-card py-1 shadow-md">
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-elevated"
          >
            <Settings className="size-3.5 text-muted-foreground" />
            Settings
          </Link>
          <button
            type="button"
            onClick={async () => {
              setOpen(false);
              setBusy(true);
              try {
                await signOut();
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-elevated disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <LogOut className="size-3.5 text-muted-foreground" />
            )}
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
