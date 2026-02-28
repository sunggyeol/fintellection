import Link from "next/link";
import { SidebarNav } from "./SidebarNav";
import { Logo } from "@/components/common/Logo";

export function Sidebar() {
  return (
    <aside className="app-shell-height hidden w-52 flex-col border-r border-border bg-sidebar lg:flex">
      {/* Logo */}
      <div className="flex h-12 items-center border-b border-border px-3">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={22} className="text-primary" />
          <span className="text-[13px] font-semibold tracking-tight text-foreground">
            Fintellection
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        <SidebarNav />
      </div>
    </aside>
  );
}
