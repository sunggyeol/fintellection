import Dexie, { type Table } from "dexie";
import type {
  DBWatchlist,
  DBResearchSession,
  DBUserPreferences,
  DBMetaEntry,
  UserPreferences,
} from "@/types/database";

export const ANONYMOUS_ID_KEY = "fintellection.anonymousId";
export const DEFAULT_PREFERENCES_KEY = "default";
export const DEFAULT_WATCHLIST_NAME = "My Watchlist";

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "light",
  defaultWatchlistId: null,
  experienceLevel: "intermediate",
  sectorInterests: [],
};

class FintellectionDB extends Dexie {
  watchlists!: Table<DBWatchlist, string>;
  researchSessions!: Table<DBResearchSession, string>;
  preferences!: Table<DBUserPreferences, string>;
  meta!: Table<DBMetaEntry, string>;

  constructor() {
    super("fintellection");

    this.version(1).stores({
      watchlists: "id, name, createdAt",
      researchSessions: "id, title, createdAt, updatedAt",
      preferences: "id",
    });

    // v2: drop preferences (can't change primary key), save old data to meta
    this.version(2)
      .stores({
        watchlists: "id, name, createdAt, updatedAt",
        researchSessions: "id, query, createdAt, updatedAt",
        preferences: null, // drop — primary key changing from "id" to "key"
        meta: "key, updatedAt",
      })
      .upgrade(async (tx) => {
        // Migrate legacy preferences to meta as a temp store
        try {
          const metaTable = tx.table("meta");
          await metaTable.put({
            key: "_legacyPrefs",
            value: JSON.stringify(DEFAULT_PREFERENCES),
            updatedAt: new Date(),
          });
        } catch {
          // Non-critical — defaults will be used
        }
      });

    // v3: recreate preferences with new primary key
    this.version(3)
      .stores({
        preferences: "key, updatedAt",
      })
      .upgrade(async (tx) => {
        const prefsTable = tx.table("preferences");
        const metaTable = tx.table("meta");

        // Restore from legacy migration if available
        try {
          const legacyRow = await metaTable.get("_legacyPrefs");
          const legacy = legacyRow ? JSON.parse(legacyRow.value) : null;
          await prefsTable.put({
            key: DEFAULT_PREFERENCES_KEY,
            value: {
              theme: legacy?.theme ?? DEFAULT_PREFERENCES.theme,
              defaultWatchlistId:
                legacy?.defaultWatchlistId ?? DEFAULT_PREFERENCES.defaultWatchlistId,
              experienceLevel:
                legacy?.experienceLevel ?? DEFAULT_PREFERENCES.experienceLevel,
              sectorInterests:
                legacy?.sectorInterests ?? DEFAULT_PREFERENCES.sectorInterests,
            },
            updatedAt: new Date(),
          } as DBUserPreferences);
          await metaTable.delete("_legacyPrefs");
        } catch {
          // Non-critical — defaults will be used
        }
      });
  }
}

export const db = new FintellectionDB();

// Auto-recover from corrupted IndexedDB (e.g., failed primary key migration)
db.open().catch(async (err) => {
  if (
    err?.name === "UpgradeError" ||
    err?.name === "DatabaseClosedError" ||
    err?.message?.includes("primary key")
  ) {
    console.warn("[DB] Schema upgrade failed, deleting and recreating database:", err.message);
    await Dexie.delete("fintellection");
    // Dexie auto-opens on next access, so the DB will be recreated fresh
  }
});

function safeDate(value: Date | string | number | undefined, fallback: Date) {
  if (!value) return fallback;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export function ensureAnonymousId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  const existing = window.localStorage.getItem(ANONYMOUS_ID_KEY);
  if (existing) return existing;

  const next = crypto.randomUUID();
  window.localStorage.setItem(ANONYMOUS_ID_KEY, next);
  return next;
}

// ── Meta helpers ─────────────────────────────────────────────

export async function getMetaValue<T>(key: string): Promise<T | undefined> {
  const row = await db.meta.get(key);
  if (!row) return undefined;

  try {
    return JSON.parse(row.value) as T;
  } catch {
    return undefined;
  }
}

export async function setMetaValue<T>(key: string, value: T): Promise<void> {
  await db.meta.put({
    key,
    value: JSON.stringify(value),
    updatedAt: new Date(),
  });
}

export async function deleteMetaValue(key: string): Promise<void> {
  await db.meta.delete(key);
}

// ── Preference helpers ───────────────────────────────────────

export async function getPreferences(): Promise<UserPreferences> {
  const row = await db.preferences.get(DEFAULT_PREFERENCES_KEY);
  if (!row) return DEFAULT_PREFERENCES;

  return {
    theme: row.value.theme ?? DEFAULT_PREFERENCES.theme,
    defaultWatchlistId:
      row.value.defaultWatchlistId ?? DEFAULT_PREFERENCES.defaultWatchlistId,
    experienceLevel:
      row.value.experienceLevel ?? DEFAULT_PREFERENCES.experienceLevel,
    sectorInterests:
      row.value.sectorInterests ?? DEFAULT_PREFERENCES.sectorInterests,
  };
}

export async function savePreferences(value: UserPreferences): Promise<void> {
  await db.preferences.put({
    key: DEFAULT_PREFERENCES_KEY,
    value,
    updatedAt: new Date(),
  });
}

export async function updatePreferences(
  partial: Partial<UserPreferences>
): Promise<UserPreferences> {
  const current = await getPreferences();
  const next: UserPreferences = {
    ...current,
    ...partial,
  };
  await savePreferences(next);
  return next;
}

export async function getStoredPreferencesRow(): Promise<DBUserPreferences | undefined> {
  return db.preferences.get(DEFAULT_PREFERENCES_KEY);
}

// ── Watchlist helpers ────────────────────────────────────────

export async function getWatchlists(): Promise<DBWatchlist[]> {
  return db.watchlists.orderBy("createdAt").toArray();
}

export async function getDefaultWatchlist(): Promise<DBWatchlist | undefined> {
  return db.watchlists.orderBy("createdAt").first();
}

export async function ensureDefaultWatchlist(): Promise<DBWatchlist> {
  let wl = await getDefaultWatchlist();
  if (!wl) {
    wl = {
      id: crypto.randomUUID(),
      name: DEFAULT_WATCHLIST_NAME,
      symbols: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.watchlists.add(wl);
  }
  return wl;
}

export async function saveWatchlist(watchlist: DBWatchlist): Promise<void> {
  await db.watchlists.put({
    ...watchlist,
    createdAt: safeDate(watchlist.createdAt, new Date()),
    updatedAt: safeDate(watchlist.updatedAt, new Date()),
  });
}

export async function replaceWatchlistsCache(
  watchlists: DBWatchlist[]
): Promise<void> {
  await db.watchlists.clear();
  if (watchlists.length > 0) {
    await db.watchlists.bulkPut(watchlists);
  }
}

export async function addToWatchlist(symbol: string): Promise<void> {
  const wl = await ensureDefaultWatchlist();
  const normalized = symbol.toUpperCase();
  if (!wl.symbols.includes(normalized)) {
    await db.watchlists.update(wl.id, {
      symbols: [...wl.symbols, normalized],
      updatedAt: new Date(),
    });
  }
}

export async function removeFromWatchlist(symbol: string): Promise<void> {
  const wl = await ensureDefaultWatchlist();
  const normalized = symbol.toUpperCase();
  await db.watchlists.update(wl.id, {
    symbols: wl.symbols.filter((s) => s !== normalized),
    updatedAt: new Date(),
  });
}

// ── Research session helpers ─────────────────────────────────

export async function saveResearchSession(
  session: DBResearchSession
): Promise<void> {
  await db.researchSessions.put({
    ...session,
    createdAt: safeDate(session.createdAt, new Date()),
    updatedAt: safeDate(session.updatedAt, new Date()),
  });
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

export async function getAllResearchSessions(): Promise<DBResearchSession[]> {
  return db.researchSessions.orderBy("updatedAt").reverse().toArray();
}

export async function getSession(
  id: string
): Promise<DBResearchSession | undefined> {
  return db.researchSessions.get(id);
}

export async function deleteResearchSession(id: string): Promise<void> {
  await db.researchSessions.delete(id);
}

export async function replaceResearchSessionsCache(
  sessions: DBResearchSession[]
): Promise<void> {
  await db.researchSessions.clear();
  if (sessions.length > 0) {
    await db.researchSessions.bulkPut(sessions);
  }
}

export interface LocalDataSnapshot {
  watchlists: DBWatchlist[];
  researchSessions: DBResearchSession[];
  preferences: UserPreferences | null;
  hasData: boolean;
}

export async function getLocalDataSnapshot(): Promise<LocalDataSnapshot> {
  const [watchlists, researchSessions, prefsRow] = await Promise.all([
    getWatchlists(),
    getAllResearchSessions(),
    getStoredPreferencesRow(),
  ]);

  return {
    watchlists,
    researchSessions,
    preferences: prefsRow?.value ?? null,
    hasData:
      watchlists.length > 0 || researchSessions.length > 0 || Boolean(prefsRow),
  };
}

export async function clearAllData(): Promise<void> {
  await Promise.all([
    db.watchlists.clear(),
    db.researchSessions.clear(),
    db.preferences.clear(),
    db.meta.clear(),
  ]);
}
