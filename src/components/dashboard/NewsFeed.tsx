"use client";

import Link from "next/link";
import type { NewsArticle } from "@/types/financial";

interface NewsFeedProps {
  articles: NewsArticle[];
  loading?: boolean;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NewsFeed({ articles, loading }: NewsFeedProps) {
  if (loading) {
    return (
      <div className="border border-border bg-card">
        <div className="border-b border-border px-3 py-2">
          <span className="text-[13px] font-medium text-foreground">Market News</span>
        </div>
        <div className="space-y-2 p-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-3/4 animate-shimmer" />
              <div className="h-3 w-1/2 animate-shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!articles.length) return null;

  return (
    <div className="border border-border bg-card">
      <div className="border-b border-border px-3 py-2">
        <span className="text-[13px] font-medium text-foreground">Market News</span>
      </div>
      <div className="max-h-[300px] overflow-y-auto sm:max-h-[500px]">
        {articles.map((article) => (
          <div key={article.id} className="border-b border-border px-3 py-2.5 last:border-b-0">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                {article.source}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {timeAgo(article.publishedAt)}
              </span>
            </div>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="line-clamp-2 text-[12px] leading-snug text-foreground transition-colors hover:text-primary"
            >
              {article.title}
            </a>
            {article.symbols.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {article.symbols.slice(0, 3).map((sym) => (
                  <Link
                    key={sym}
                    href={`/stock/${sym}`}
                    className="bg-elevated px-1.5 py-0.5 text-[9px] font-medium text-primary transition-colors hover:bg-accent"
                  >
                    {sym}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
