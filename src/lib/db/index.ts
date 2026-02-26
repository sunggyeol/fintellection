import Dexie, { type Table } from "dexie";
import type { DBWatchlist, DBResearchSession, DBUserPreferences } from "@/types/database";

class FintellectionDB extends Dexie {
  watchlists!: Table<DBWatchlist, string>;
  researchSessions!: Table<DBResearchSession, string>;
  preferences!: Table<DBUserPreferences, string>;

  constructor() {
    super("fintellection");
    this.version(1).stores({
      watchlists: "id, name, createdAt",
      researchSessions: "id, title, createdAt, updatedAt",
      preferences: "id",
    });
  }
}

export const db = new FintellectionDB();

// ── Watchlist helpers ────────────────────────────────────────

export async function getDefaultWatchlist(): Promise<DBWatchlist | undefined> {
  const all = await db.watchlists.orderBy("createdAt").first();
  return all;
}

export async function ensureDefaultWatchlist(): Promise<DBWatchlist> {
  let wl = await getDefaultWatchlist();
  if (!wl) {
    wl = {
      id: crypto.randomUUID(),
      name: "My Watchlist",
      symbols: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.watchlists.add(wl);
  }
  return wl;
}

export async function addToWatchlist(symbol: string): Promise<void> {
  const wl = await ensureDefaultWatchlist();
  if (!wl.symbols.includes(symbol)) {
    await db.watchlists.update(wl.id, {
      symbols: [...wl.symbols, symbol],
      updatedAt: new Date(),
    });
  }
}

export async function removeFromWatchlist(symbol: string): Promise<void> {
  const wl = await ensureDefaultWatchlist();
  await db.watchlists.update(wl.id, {
    symbols: wl.symbols.filter((s) => s !== symbol),
    updatedAt: new Date(),
  });
}

// ── Research session helpers ─────────────────────────────────

export async function saveResearchSession(
  session: DBResearchSession
): Promise<void> {
  await db.researchSessions.put(session);
}

export async function getRecentSessions(
  limit = 10
): Promise<DBResearchSession[]> {
  return db.researchSessions
    .orderBy("updatedAt")
    .reverse()
    .limit(limit)
    .toArray();
}

export async function getSession(
  id: string
): Promise<DBResearchSession | undefined> {
  return db.researchSessions.get(id);
}

export async function clearAllData(): Promise<void> {
  await Promise.all([
    db.watchlists.clear(),
    db.researchSessions.clear(),
    db.preferences.clear(),
  ]);
}
