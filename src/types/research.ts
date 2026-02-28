/** Research interface types */

export interface ResearchSession {
  id: string;
  title: string;
  query: string;
  symbolsReferenced: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpQuestion {
  query: string;
  rationale: string;
}

/** Human-readable labels shown during tool call streaming */
export const TOOL_LABELS: Record<string, string> = {
  financial_data: "Fetching financial data",
  web_search: "Searching the web",
  rag_query: "Searching knowledge base",
  calculator: "Running calculations",
  sec_filing: "Reading SEC filing",
  fred_data: "Fetching macro data",
} as const;
