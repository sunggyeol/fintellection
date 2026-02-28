import type { SupabaseClient, User } from "@supabase/supabase-js";
import type {
  DBResearchSession,
  DBWatchlist,
  ProfileRow,
  ResearchSessionRow,
  UserPreferences,
  WatchlistRow,
} from "@/types/database";
import {
  DEFAULT_PREFERENCES,
  DEFAULT_WATCHLIST_NAME,
  addToWatchlist as addToLocalWatchlist,
  clearAllData as clearLocalData,
  deleteResearchSession as deleteLocalResearchSession,
  ensureDefaultWatchlist as ensureLocalDefaultWatchlist,
  ensureAnonymousId,
  getAllResearchSessions,
  getLocalDataSnapshot,
  getMetaValue,
  getPreferences as getLocalPreferences,
  getRecentSessions as getLocalRecentSessions,
  getSession as getLocalSession,
  getWatchlists as getLocalWatchlists,
  removeFromWatchlist as removeFromLocalWatchlist,
  replaceResearchSessionsCache,
  replaceWatchlistsCache,
  savePreferences as saveLocalPreferences,
  saveResearchSession as saveLocalResearchSession,
  saveWatchlist as saveLocalWatchlist,
  setMetaValue,
} from "@/lib/db";

export type DataMode = "anonymous" | "authenticated";

export interface DataAccessActor {
  mode: DataMode;
  userId: string | null;
  supabase: SupabaseClient | null;
}

interface ProfileIdentity {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

const MIGRATION_META_PREFIX = "migration_done_v1:";
const LAST_SYNC_META_PREFIX = "last_server_sync:";

function assertAuthenticated(actor: DataAccessActor): asserts actor is {
  mode: "authenticated";
  userId: string;
  supabase: SupabaseClient;
} {
  if (
    actor.mode !== "authenticated" ||
    !actor.userId ||
    !actor.supabase
  ) {
    throw new Error("Authenticated data access requires user and Supabase client");
  }
}

function asDate(value: string | Date | null | undefined, fallback = new Date()) {
  if (!value) return fallback;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

function normalizeSymbols(symbols: string[]) {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const symbol of symbols) {
    const next = symbol.toUpperCase().trim();
    if (!next || seen.has(next)) continue;
    seen.add(next);
    normalized.push(next);
  }
  return normalized;
}

function buildSessionTitle(query: string) {
  const trimmed = query.trim() || "Untitled";
  return trimmed.length > 80 ? `${trimmed.slice(0, 80)}...` : trimmed;
}

function buildMessagesFromQueryAndResponse(query: string, response: string) {
  return JSON.stringify([
    {
      id: "local-user",
      role: "user",
      parts: [{ type: "text", text: query }],
    },
    {
      id: "local-assistant",
      role: "assistant",
      parts: [{ type: "text", text: response }],
    },
  ]);
}

function extractResponseFromSerializedMessages(serialized: string) {
  try {
    const parsed = JSON.parse(serialized) as Array<{
      role?: string;
      parts?: Array<{ type?: string; text?: string }>;
      content?: string;
    }>;

    const chunks: string[] = [];
    for (const message of parsed) {
      if (message.role !== "assistant") continue;

      if (Array.isArray(message.parts)) {
        for (const part of message.parts) {
          if (part?.type === "text" && typeof part.text === "string") {
            chunks.push(part.text);
          }
        }
      }

      if (typeof message.content === "string") {
        chunks.push(message.content);
      }
    }

    return chunks.join("\n\n").trim();
  } catch {
    return "";
  }
}

function toLocalWatchlist(row: WatchlistRow): DBWatchlist {
  return {
    id: row.id,
    name: row.name,
    symbols: normalizeSymbols(row.symbols ?? []),
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  };
}

function toWatchlistInsert(userId: string, watchlist: DBWatchlist) {
  return {
    id: watchlist.id,
    user_id: userId,
    name: watchlist.name,
    symbols: normalizeSymbols(watchlist.symbols),
    created_at: asDate(watchlist.createdAt).toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function toLocalResearchSession(row: ResearchSessionRow): DBResearchSession {
  const createdAt = asDate(row.created_at);
  const response = row.response ?? "";
  return {
    id: row.id,
    title: buildSessionTitle(row.query),
    query: row.query,
    response,
    messages: buildMessagesFromQueryAndResponse(row.query, response),
    symbolsReferenced: normalizeSymbols(row.symbols_referenced ?? []),
    sources: row.sources ?? [],
    createdAt,
    updatedAt: createdAt,
  };
}

function toResearchInsert(userId: string, session: DBResearchSession) {
  const response =
    session.response?.trim() ||
    extractResponseFromSerializedMessages(session.messages);

  return {
    id: session.id,
    user_id: userId,
    query: session.query,
    response,
    symbols_referenced: normalizeSymbols(session.symbolsReferenced),
    sources: session.sources ?? [],
    created_at: asDate(session.createdAt).toISOString(),
  };
}

async function fetchServerWatchlists(
  actor: DataAccessActor
): Promise<DBWatchlist[]> {
  assertAuthenticated(actor);

  const { data, error } = await actor.supabase
    .from("watchlists")
    .select("*")
    .eq("user_id", actor.userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as WatchlistRow[]).map(toLocalWatchlist);
}

async function fetchServerResearchSessions(
  actor: DataAccessActor,
  limit?: number
): Promise<DBResearchSession[]> {
  assertAuthenticated(actor);

  let query = actor.supabase
    .from("research_sessions")
    .select("*")
    .eq("user_id", actor.userId)
    .order("created_at", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as ResearchSessionRow[]).map(toLocalResearchSession);
}

async function fetchServerResearchSessionById(
  actor: DataAccessActor,
  id: string
): Promise<DBResearchSession | undefined> {
  assertAuthenticated(actor);

  const { data, error } = await actor.supabase
    .from("research_sessions")
    .select("*")
    .eq("user_id", actor.userId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return undefined;

  return toLocalResearchSession(data as ResearchSessionRow);
}

async function fetchServerPreferences(
  actor: DataAccessActor
): Promise<UserPreferences> {
  assertAuthenticated(actor);

  const { data, error } = await actor.supabase
    .from("profiles")
    .select("preferences")
    .eq("id", actor.userId)
    .maybeSingle();

  if (error) throw error;
  const preferences = (data?.preferences ?? null) as UserPreferences | null;
  return preferences ?? DEFAULT_PREFERENCES;
}

async function upsertServerWatchlist(
  actor: DataAccessActor,
  watchlist: DBWatchlist
): Promise<DBWatchlist> {
  assertAuthenticated(actor);

  const payload = toWatchlistInsert(actor.userId, watchlist);
  const { data, error } = await actor.supabase
    .from("watchlists")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw error;
  return toLocalWatchlist(data as WatchlistRow);
}

async function upsertServerResearchSession(
  actor: DataAccessActor,
  session: DBResearchSession
): Promise<DBResearchSession> {
  assertAuthenticated(actor);

  const payload = toResearchInsert(actor.userId, session);
  const { data, error } = await actor.supabase
    .from("research_sessions")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw error;
  return toLocalResearchSession(data as ResearchSessionRow);
}

export function actorFromAuth(
  user: Pick<User, "id"> | null,
  supabase: SupabaseClient | null
): DataAccessActor {
  return {
    mode: user ? "authenticated" : "anonymous",
    userId: user?.id ?? null,
    supabase: user ? supabase : null,
  };
}

export async function ensureProfile(
  actor: DataAccessActor,
  profile: ProfileIdentity
): Promise<ProfileRow> {
  assertAuthenticated(actor);

  const { data: existing, error: existingError } = await actor.supabase
    .from("profiles")
    .select("*")
    .eq("id", profile.id)
    .maybeSingle();

  if (existingError) throw existingError;

  if (!existing) {
    const { data, error } = await actor.supabase
      .from("profiles")
      .insert({
        id: profile.id,
        email: profile.email,
        display_name: profile.displayName,
        avatar_url: profile.avatarUrl,
        preferences: DEFAULT_PREFERENCES,
      })
      .select("*")
      .single();

    if (error) throw error;
    return data as ProfileRow;
  }

  const { data, error } = await actor.supabase
    .from("profiles")
    .update({
      email: profile.email,
      display_name: profile.displayName,
      avatar_url: profile.avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id)
    .select("*")
    .single();

  if (error) throw error;
  return data as ProfileRow;
}

export async function getProfile(
  actor: DataAccessActor
): Promise<ProfileRow | null> {
  if (actor.mode !== "authenticated" || !actor.userId || !actor.supabase) {
    return null;
  }

  const { data, error } = await actor.supabase
    .from("profiles")
    .select("*")
    .eq("id", actor.userId)
    .maybeSingle();

  if (error) throw error;
  return (data as ProfileRow | null) ?? null;
}

export async function ensureDefaultWatchlist(
  actor: DataAccessActor
): Promise<DBWatchlist> {
  if (actor.mode === "anonymous") {
    return ensureLocalDefaultWatchlist();
  }

  const watchlists = await fetchServerWatchlists(actor);
  if (watchlists.length > 0) {
    return watchlists[0];
  }

  const created = await upsertServerWatchlist(actor, {
    id: crypto.randomUUID(),
    name: DEFAULT_WATCHLIST_NAME,
    symbols: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await saveLocalWatchlist(created);
  return created;
}

export async function getWatchlists(
  actor: DataAccessActor
): Promise<DBWatchlist[]> {
  if (actor.mode === "anonymous") {
    return getLocalWatchlists();
  }

  const watchlists = await fetchServerWatchlists(actor);
  await replaceWatchlistsCache(watchlists);
  return watchlists;
}

export async function getDefaultWatchlist(
  actor: DataAccessActor
): Promise<DBWatchlist> {
  const watchlist = await ensureDefaultWatchlist(actor);
  await saveLocalWatchlist(watchlist);
  return watchlist;
}

export async function addToWatchlist(
  actor: DataAccessActor,
  symbol: string
): Promise<void> {
  if (actor.mode === "anonymous") {
    await addToLocalWatchlist(symbol);
    return;
  }

  const wl = await ensureDefaultWatchlist(actor);
  const nextSymbols = normalizeSymbols([...wl.symbols, symbol]);
  const updated = await upsertServerWatchlist(actor, {
    ...wl,
    symbols: nextSymbols,
    updatedAt: new Date(),
  });
  await saveLocalWatchlist(updated);
}

export async function removeFromWatchlist(
  actor: DataAccessActor,
  symbol: string
): Promise<void> {
  if (actor.mode === "anonymous") {
    await removeFromLocalWatchlist(symbol);
    return;
  }

  const wl = await ensureDefaultWatchlist(actor);
  const normalized = symbol.toUpperCase().trim();
  const updated = await upsertServerWatchlist(actor, {
    ...wl,
    symbols: wl.symbols.filter((item) => item !== normalized),
    updatedAt: new Date(),
  });
  await saveLocalWatchlist(updated);
}

export async function saveResearchSession(
  actor: DataAccessActor,
  session: DBResearchSession
): Promise<DBResearchSession> {
  if (actor.mode === "anonymous") {
    await saveLocalResearchSession(session);
    return session;
  }

  const persisted = await upsertServerResearchSession(actor, session);
  await saveLocalResearchSession(persisted);
  return persisted;
}

export async function getRecentSessions(
  actor: DataAccessActor,
  limit = 10
): Promise<DBResearchSession[]> {
  if (actor.mode === "anonymous") {
    return getLocalRecentSessions(limit);
  }

  const sessions = await fetchServerResearchSessions(actor, limit);
  await Promise.all(sessions.map((session) => saveLocalResearchSession(session)));
  return sessions;
}

export async function getSession(
  actor: DataAccessActor,
  id: string
): Promise<DBResearchSession | undefined> {
  if (actor.mode === "anonymous") {
    return getLocalSession(id);
  }

  const session = await fetchServerResearchSessionById(actor, id);
  if (session) {
    await saveLocalResearchSession(session);
    return session;
  }

  return getLocalSession(id);
}

export async function deleteSession(
  actor: DataAccessActor,
  id: string
): Promise<void> {
  if (actor.mode === "authenticated") {
    assertAuthenticated(actor);
    const { error } = await actor.supabase
      .from("research_sessions")
      .delete()
      .eq("user_id", actor.userId)
      .eq("id", id);
    if (error) throw error;
  }

  await deleteLocalResearchSession(id);
}

export async function getPreferences(
  actor: DataAccessActor
): Promise<UserPreferences> {
  if (actor.mode === "anonymous") {
    return getLocalPreferences();
  }

  const preferences = await fetchServerPreferences(actor);
  await saveLocalPreferences(preferences);
  return preferences;
}

export async function savePreferences(
  actor: DataAccessActor,
  preferences: UserPreferences
): Promise<UserPreferences> {
  if (actor.mode === "anonymous") {
    await saveLocalPreferences(preferences);
    return preferences;
  }

  assertAuthenticated(actor);
  const { error } = await actor.supabase
    .from("profiles")
    .update({
      preferences,
      updated_at: new Date().toISOString(),
    })
    .eq("id", actor.userId);

  if (error) throw error;

  await saveLocalPreferences(preferences);
  return preferences;
}

function getMigrationMetaKey(userId: string) {
  return `${MIGRATION_META_PREFIX}${userId}`;
}

function getLastSyncMetaKey(userId: string) {
  return `${LAST_SYNC_META_PREFIX}${userId}`;
}

export async function migrateAnonymousDataToUser(
  actor: DataAccessActor
): Promise<boolean> {
  assertAuthenticated(actor);

  const migrationMetaKey = getMigrationMetaKey(actor.userId);
  const migrationDone = await getMetaValue<{ migratedAt: string }>(migrationMetaKey);
  if (migrationDone) return false;

  const snapshot = await getLocalDataSnapshot();
  if (!snapshot.hasData) {
    return false;
  }

  const serverWatchlists = await fetchServerWatchlists(actor);
  const byName = new Map<string, DBWatchlist>();
  for (const watchlist of serverWatchlists) {
    byName.set(watchlist.name.trim().toLowerCase(), watchlist);
  }

  for (const localWatchlist of snapshot.watchlists) {
    const key = localWatchlist.name.trim().toLowerCase();
    const existing = byName.get(key);
    if (existing) {
      const merged = normalizeSymbols([
        ...existing.symbols,
        ...localWatchlist.symbols,
      ]);
      if (merged.join("|") !== existing.symbols.join("|")) {
        const updated = await upsertServerWatchlist(actor, {
          ...existing,
          symbols: merged,
          updatedAt: new Date(),
        });
        byName.set(key, updated);
      }
      continue;
    }

    const created = await upsertServerWatchlist(actor, localWatchlist);
    byName.set(key, created);
  }

  if (snapshot.researchSessions.length > 0) {
    const payload = snapshot.researchSessions.map((session) =>
      toResearchInsert(actor.userId, session)
    );
    const { error } = await actor.supabase
      .from("research_sessions")
      .upsert(payload, { onConflict: "id" });
    if (error) throw error;
  }

  if (snapshot.preferences) {
    await savePreferences(actor, snapshot.preferences);
  }

  await setMetaValue(migrationMetaKey, { migratedAt: new Date().toISOString() });
  return true;
}

export async function syncServerToLocalCache(actor: DataAccessActor): Promise<void> {
  if (actor.mode !== "authenticated" || !actor.userId) return;

  const [watchlists, sessions, preferences] = await Promise.all([
    fetchServerWatchlists(actor),
    fetchServerResearchSessions(actor),
    fetchServerPreferences(actor),
  ]);

  await Promise.all([
    replaceWatchlistsCache(watchlists),
    replaceResearchSessionsCache(sessions),
    saveLocalPreferences(preferences),
    setMetaValue(getLastSyncMetaKey(actor.userId), {
      syncedAt: new Date().toISOString(),
    }),
  ]);
}

export async function clearIndexedDbData(): Promise<void> {
  await clearLocalData();
  ensureAnonymousId();
}

export async function getLocalResearchForMigration() {
  return getAllResearchSessions();
}
