import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <div className="mb-4 text-6xl font-bold text-border">404</div>
        <h2 className="mb-1 text-lg font-semibold text-foreground">
          Page not found
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Home className="size-3" />
            Dashboard
          </Link>
          <Link
            href="/research"
            className="flex items-center gap-1.5 border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-elevated"
          >
            <Search className="size-3" />
            Research
          </Link>
        </div>
      </div>
    </div>
  );
}
