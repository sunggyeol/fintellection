/** Database/IndexedDB types */

export interface DBWatchlist {
  id: string;
  name: string;
  symbols: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DBResearchSession {
  id: string;
  title: string;
  query: string;
  messages: string; // JSON-serialized
  symbolsReferenced: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DBUserPreferences {
  id: string; // always "default"
  theme: "dark" | "light" | "system";
  defaultWatchlistId: string | null;
  experienceLevel: "beginner" | "intermediate" | "advanced";
  sectorInterests: string[];
}
