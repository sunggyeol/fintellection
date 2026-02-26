import { Skeleton } from "@/components/ui/skeleton";

export default function StockLoading() {
  return (
    <div className="p-6">
      {/* Price header */}
      <div className="mb-4 space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          {/* Chart */}
          <div className="mb-6 border border-border bg-card p-4">
            <Skeleton className="mb-3 h-8 w-48" />
            <Skeleton className="h-[400px] w-full" />
          </div>
          {/* Tabs */}
          <div className="border border-border bg-card p-4">
            <Skeleton className="mb-4 h-9 w-56" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>

        {/* AI sidebar */}
        <div className="hidden lg:block">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
