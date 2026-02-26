import { Suspense } from "react";
import { StockDetailClient } from "@/components/stock/StockDetailClient";
import { Skeleton } from "@/components/ui/skeleton";

interface StockDetailPageProps {
  params: Promise<{ symbol: string }>;
}

export default async function StockDetailPage({
  params,
}: StockDetailPageProps) {
  const { symbol } = await params;
  const ticker = symbol.toUpperCase();

  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      }
    >
      <StockDetailClient symbol={ticker} />
    </Suspense>
  );
}
