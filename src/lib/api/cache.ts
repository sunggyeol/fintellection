/**
 * Simple in-memory TTL cache + circuit breaker for API providers.
 * Runs server-side only (Node.js process memory).
 */

// ── Centralized TTL Constants ────────────────────────────────

export const TTL = {
  QUOTE: 60_000,                // 1 min — real-time prices
  QUOTE_OPEN: 60_000,           // 1 min — regular trading session quotes
  SEARCH: 120_000,              // 2 min — user-driven
  NEWS: 900_000,                // 15 min — news doesn't change sub-minute
  HISTORY_LIVE: 300_000,        // 5 min — today's bars still changing
  HISTORY_PAST: 86_400_000,     // 24 hr — past-date OHLCV is immutable
  PROFILE: 604_800_000,         // 7 days — company profiles rarely change
  METRICS: 86_400_000,          // 24 hr — ratios change quarterly
  SEC_FILING: 86_400_000,       // 24 hr — filings are immutable
  SERPER: 900_000,              // 15 min — web search results
  FRED: 86_400_000,             // 24 hr — most series update monthly
  FRED_META: 604_800_000,       // 7 days — series metadata
  MARKET_OVERVIEW: 120_000,     // 2 min — dashboard movers
  MARKET_OVERVIEW_OPEN: 120_000,// 2 min — movers during regular session
  DASHBOARD: 120_000,           // 2 min — consolidated dashboard
  DASHBOARD_OPEN: 120_000,      // 2 min — equities dashboard during regular session
  SECTORS: 300_000,             // 5 min — sector performance
  EARNINGS: 900_000,            // 15 min — earnings calendar
  CRYPTO: 60_000,               // 1 min — crypto prices
  MARKET_NEWS: 300_000,         // 5 min — market-wide news
  MARKET_SUMMARY: 900_000,      // 15 min — AI-generated summary
} as const;

// ── TTL Cache ────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });

  // Lazy cleanup: cap total entries (raised for longer TTLs)
  if (store.size > 2000) {
    const now = Date.now();
    // First pass: remove expired
    for (const [k, v] of store) {
      if (now > v.expiresAt) store.delete(k);
    }
    // Second pass: LRU eviction if still over 1500
    if (store.size > 1500) {
      const sorted = [...store.entries()].sort(
        (a, b) => a[1].expiresAt - b[1].expiresAt
      );
      const toRemove = store.size - 1500;
      for (let i = 0; i < toRemove; i++) {
        store.delete(sorted[i][0]);
      }
    }
  }
}

/**
 * Cache-through helper: returns cached value or calls fn() and caches result.
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== null) return hit;
  const result = await fn();
  cacheSet(key, result, ttlMs);
  return result;
}

// ── Circuit Breaker ──────────────────────────────────────────

interface BreakerState {
  failures: number;
  openUntil: number; // timestamp when circuit closes again
}

const breakers = new Map<string, BreakerState>();

const FAILURE_THRESHOLD = 3;
const OPEN_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export function isCircuitOpen(provider: string): boolean {
  const state = breakers.get(provider);
  if (!state) return false;
  if (Date.now() > state.openUntil) {
    // Half-open: allow one attempt
    breakers.delete(provider);
    return false;
  }
  return true;
}

export function recordSuccess(provider: string): void {
  breakers.delete(provider);
}

export function recordFailure(provider: string): void {
  const state = breakers.get(provider) ?? { failures: 0, openUntil: 0 };
  state.failures++;
  if (state.failures >= FAILURE_THRESHOLD) {
    state.openUntil = Date.now() + OPEN_DURATION_MS;
  }
  breakers.set(provider, state);
}
