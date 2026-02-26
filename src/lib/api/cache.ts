/**
 * Simple in-memory TTL cache + circuit breaker for API providers.
 * Runs server-side only (Node.js process memory).
 */

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

  // Lazy cleanup: cap total entries
  if (store.size > 500) {
    const now = Date.now();
    for (const [k, v] of store) {
      if (now > v.expiresAt) store.delete(k);
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
