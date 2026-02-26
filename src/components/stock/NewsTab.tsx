"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Clock } from "lucide-react";
import type { NewsArticle } from "@/types/financial";

interface NewsTabProps {
  symbol: string;
}

export function NewsTab({ symbol }: NewsTabProps) {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/news?symbol=${symbol}`)
      .then((r) => r.json())
      .then((data) => setNews(data))
      .catch(() => setNews([]))
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-shimmer h-16" />
        ))}
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No recent news for {symbol}
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {news.map((article) => (
        <a
          key={article.id}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-accent"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary">
              {article.title}
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{article.source}</span>
              <span>·</span>
              <Clock className="size-3" />
              <span>
                {new Date(article.publishedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <ExternalLink className="mt-1 size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
        </a>
      ))}
    </div>
  );
}
