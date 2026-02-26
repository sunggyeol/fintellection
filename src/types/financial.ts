/** Core financial data types shared across the application */

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  marketCap: number;
  peRatio: number | null;
  week52High: number;
  week52Low: number;
  exchange: string;
  updatedAt: string;
}

export interface OHLCVBar {
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CompanyProfile {
  symbol: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  exchange: string;
  marketCap: number;
  employees: number | null;
  website: string | null;
  ceo: string | null;
  country: string;
  ipoDate: string | null;
  image: string | null;
}

export interface KeyMetrics {
  symbol: string;
  peRatio: number | null;
  forwardPE: number | null;
  pbRatio: number | null;
  psRatio: number | null;
  evToEbitda: number | null;
  dividendYield: number | null;
  eps: number | null;
  roe: number | null;
  roa: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  beta: number | null;
}

export interface IncomeStatement {
  date: string;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  operatingExpenses: number;
  operatingIncome: number;
  netIncome: number;
  eps: number;
  epsDiluted: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  image: string | null;
  publishedAt: string;
  symbols: string[];
  sentiment: "positive" | "negative" | "neutral" | null;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

export interface MarketMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
}

export interface IndexData {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePct: number;
  sparkline: number[];
  etf?: string;
}

export type TimeRange = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y" | "MAX";

export type ChartType = "candlestick" | "line" | "area";

export interface WatchlistItem {
  symbol: string;
  name: string;
  addedAt: string;
}

export interface Watchlist {
  id: string;
  name: string;
  items: WatchlistItem[];
  createdAt: string;
  updatedAt: string;
}
