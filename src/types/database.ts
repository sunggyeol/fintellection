/** Database/IndexedDB types */

export interface DBWatchlist {
  id: string;
  name: string;
  symbols: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: "dark" | "light" | "system";
  defaultWatchlistId: string | null;
  experienceLevel: "beginner" | "intermediate" | "advanced";
  sectorInterests: string[];
}

export interface DBResearchSession {
  id: string;
  title: string;
  query: string;
  response?: string;
  messages: string; // JSON-serialized UIMessage[]
  symbolsReferenced: string[];
  sources?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface DBUserPreferences {
  key: string; // always "default"
  value: UserPreferences;
  updatedAt: Date;
}

export interface DBMetaEntry {
  key: string;
  value: string;
  updatedAt: Date;
}

/** Supabase row types */

export interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  preferences: UserPreferences | null;
  created_at: string;
  updated_at: string;
}

export interface WatchlistRow {
  id: string;
  user_id: string;
  name: string;
  symbols: string[];
  created_at: string;
  updated_at: string;
}

export interface ResearchSessionRow {
  id: string;
  user_id: string;
  query: string;
  response: string;
  symbols_referenced: string[];
  sources: unknown;
  created_at: string;
}
