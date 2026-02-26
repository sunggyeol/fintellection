import { Skeleton } from "@/components/ui/skeleton";

export default function ResearchLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex h-10 items-center justify-between border-b border-border px-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="size-7" />
      </div>

      {/* Center content */}
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <Skeleton className="mx-auto mb-4 size-12" />
          <Skeleton className="mx-auto mb-1 h-6 w-48" />
          <Skeleton className="mx-auto mb-6 h-4 w-72" />
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-56" />
            ))}
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-border p-4">
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
