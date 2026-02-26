# Fintellection — Backend Requirements

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | Next.js 15+ (App Router) | All backend logic runs here — Server Actions, Route Handlers, Middleware |
| **Language** | TypeScript | Type safety for all server-side code, shared schemas with frontend |
| **Database** | Supabase (PostgreSQL 15) | Primary relational database for cached financial data, research history, RAG document store |
| **Vector Store** | pgvector (Supabase extension) | Vector similarity search for RAG embeddings (HNSW indexing) |
| **Scheduled Jobs** | pg_cron + pg_net (Supabase) | Scheduled data refresh, cache cleanup |
| **AI Orchestration** | Vercel AI SDK 6 + Mastra | Agent framework — defines agents, tools, workflows, memory, RAG pipeline |
| **Primary LLM** | Claude Sonnet 4.5 (Anthropic) | Research agent — best accuracy for financial analysis, tool use, 200K context |
| **Secondary LLM** | GPT-4.1 mini (OpenAI) | Cost-efficient sub-tasks: data extraction, formatting, follow-up generation |
| **Embeddings** | OpenAI text-embedding-3-small | 1536 dimensions for RAG vectors |
| **LLM Observability** | Langfuse | Trace every agent call — latency, cost, token usage, quality scoring |
| **Deployment** | Vercel Pro | Native Next.js hosting with serverless functions and Fluid Compute (800s timeout for long research queries) |

---

## Session & Persistence Model

There is **no user authentication**. The app does not have user accounts, login, or signup.

- **User-generated data** (watchlists, research history, preferences) is persisted **client-side** in the browser using IndexedDB or localStorage. The backend does not store per-user data.
- **Shared data** (cached stock quotes, RAG documents, market data) lives in Supabase and is accessible to all users.
- **Research sessions** are stored client-side by default. Optionally, the backend can store anonymized research sessions in Supabase for analytics and RAG improvement, but this is not tied to any user identity.
- No RLS (Row-Level Security) policies are needed since there are no user-scoped tables.
- No auth middleware, no JWT handling, no session cookies.

---

## Server Architecture

All backend logic is colocated within the Next.js application. There is no separate backend server.

### Request Flow

```
Client Request
  │
  ├── Server Components (data reads)
  │     ├── Supabase queries for cached financial data
  │     ├── Financial data API calls (cached)
  │     └── Returns pre-rendered HTML
  │
  ├── Server Actions (mutations)
  │     ├── Validated via Zod
  │     ├── Supabase writes (e.g., updating cached data)
  │     └── Returns typed responses
  │
  └── Route Handlers (/api/*)
        ├── /api/chat — AI research streaming endpoint (Vercel AI SDK)
        ├── /api/cron/* — Vercel Cron triggers for scheduled data refresh
        └── /api/health — Health check
```

### When to use Server Actions vs Route Handlers

- **Server Actions**: Simple mutations triggered from UI — saving preferences, CRUD operations. Benefits from progressive enhancement and Zod validation.
- **Route Handlers**: Long-running streams (AI research via `streamText`), cron job triggers, any endpoint that external services or libraries need to call directly.

---

## Database Schema

Since there's no auth, the database only stores **shared/cached data**, not per-user data.

### `stock_quotes` — Cached market data

Stores the latest quote data for actively watched tickers. Updated by cron jobs.

| Column | Type | Description |
|---|---|---|
| `symbol` | TEXT, PK | Ticker symbol (e.g., "AAPL") |
| `name` | TEXT | Company name |
| `price` | NUMERIC | Last known price |
| `change_pct` | NUMERIC | Daily change percentage |
| `volume` | BIGINT | Daily volume |
| `market_cap` | NUMERIC | Market capitalization |
| `pe_ratio` | NUMERIC | Price-to-earnings ratio |
| `week_52_high` | NUMERIC | 52-week high |
| `week_52_low` | NUMERIC | 52-week low |
| `exchange` | TEXT | Exchange (NYSE, NASDAQ, etc.) |
| `updated_at` | TIMESTAMPTZ | Last refresh timestamp |

Enable Supabase Realtime on this table so the frontend can subscribe to live price updates via WebSocket.

### `documents` — RAG document store

Stores chunked and embedded financial documents for retrieval-augmented generation.

| Column | Type | Description |
|---|---|---|
| `id` | BIGSERIAL, PK | Auto-incrementing ID |
| `source_type` | TEXT, NOT NULL | 'sec_filing', 'earnings_call', 'news', 'research_output' |
| `source_url` | TEXT | Original source URL |
| `symbol` | TEXT | Related ticker |
| `title` | TEXT | Document title |
| `content` | TEXT, NOT NULL | Chunk text content |
| `chunk_index` | INTEGER | Position within parent document |
| `metadata` | JSONB | Filing type, date, CIK, additional context |
| `embedding` | vector(1536) | OpenAI text-embedding-3-small vector |
| `created_at` | TIMESTAMPTZ | Ingestion timestamp |

Indexes: HNSW on `embedding` (vector_cosine_ops), B-tree on `symbol`, B-tree on `source_type`, B-tree on `created_at DESC`.

### `research_sessions_log` — Optional analytics/audit log

Anonymized log of research queries for improving the system. No user identity attached.

| Column | Type | Description |
|---|---|---|
| `id` | UUID, PK | Random ID |
| `query` | TEXT | The research question asked |
| `symbols_referenced` | TEXT[] | Tickers mentioned in the output |
| `model_used` | TEXT | LLM model identifier |
| `input_tokens` | INTEGER | Tokens consumed (input) |
| `output_tokens` | INTEGER | Tokens consumed (output) |
| `cost_cents` | INTEGER | Estimated cost in cents |
| `duration_ms` | INTEGER | Total execution time |
| `tool_calls_log` | JSONB | Audit log of all tool invocations |
| `created_at` | TIMESTAMPTZ | Timestamp |

---

## Agentic Researcher — Backend Implementation

### Agent Architecture

The research agent uses a **ReAct (Reasoning + Acting) pattern** built on Vercel AI SDK 6 and Mastra.

```
User Query
  │
  ▼
Research Orchestrator Agent (Claude Sonnet 4.5)
  │
  ├── Step 1: Query Analysis & Decomposition
  │     Break complex query into 2–7 sub-tasks
  │
  ├── Step 2: Parallel Tool Execution
  │     Tools are called as needed — the agent decides which tools to use and in what order
  │
  ├── Step 3: Cross-Reference & Validate
  │     Verify financial figures against structured API data
  │
  ├── Step 4: Synthesize Response
  │     Structured output: summary → findings → analysis → risks → sources
  │
  └── Step 5: Generate Follow-Up Questions
        Gap analysis → 3–5 recommended follow-up research paths
```

### Tools Available to the Agent

Each tool is defined with typed Zod input/output schemas.

**`web_search`**
- Searches the web for real-time news, analyst commentary, press releases
- Uses Serper API (Google Search) or Tavily API
- Returns: title, URL, snippet, date for each result

**`financial_data`**
- Fetches structured financial data: quotes, financial statements, ratios, earnings, news, technical indicators
- Routes to the appropriate provider based on data type (Finnhub for real-time/sentiment, FMP for fundamentals, Twelve Data for technicals)
- Results are cached in the `stock_quotes` table

**`sec_filing_reader`**
- Fetches and analyzes SEC EDGAR filings (10-K, 10-Q, 8-K, proxy statements)
- Extracts relevant sections from filings and chunks them for context
- SEC EDGAR is free and public but requires a `User-Agent` header with contact email; rate limit 10 req/sec

**`rag_query`**
- Semantic search over the `documents` table using pgvector
- Embeds the query, performs cosine similarity search, returns top-k chunks with metadata
- Discard results with similarity score below 0.75

**`calculator`**
- Performs financial calculations: DCF valuation, CAGR, ratio analysis, custom formulas
- Returns the result, the formula used, and a brief explanation

### LLM Model Routing

| Task | Model | Rationale |
|---|---|---|
| Research orchestration & synthesis | Claude Sonnet 4.5 | Best tool-use accuracy, lowest hallucination, deep financial reasoning |
| Data extraction from filings | GPT-4.1 mini | Cost-efficient, good at structured extraction |
| Follow-up question generation | GPT-4.1 mini | Simpler reasoning task |
| Embedding generation | text-embedding-3-small | Best quality/cost for RAG vectors |

### Streaming

The research endpoint uses Vercel AI SDK's `streamText` to stream the agent's response to the frontend in real-time. The agent's reasoning steps (e.g., "Searching for NVIDIA financials...", "Analyzing SEC filing...") should be visible to the user as the research progresses.

Use `maxSteps: 10` to cap the number of tool-use iterations per query.

### RAG Pipeline

**Ingestion** (runs on schedule or triggered by research queries):
1. Fetch documents from SEC EDGAR, news APIs, earnings transcripts
2. Chunk into 500–1000 token segments with 100 token overlap
3. Embed each chunk via OpenAI text-embedding-3-small
4. Store in `documents` table with embedding, metadata, and source reference

**Retrieval** (during research):
1. Embed the user's query
2. Cosine similarity search on pgvector: top 5 chunks above 0.75 similarity threshold
3. Pass retrieved chunks as context to the research agent

### Hallucination Mitigation

These are critical requirements — the agent deals with financial data that users may act on.

- Every factual financial claim must be grounded in retrieved context (RAG) or structured API data, not LLM parametric knowledge
- Every factual claim in the output must include an inline citation linking to its source
- If the vector similarity score for retrieved context is below 0.75, the agent should say "I don't have sufficient data to answer this accurately" rather than guessing
- Financial figures (revenue, earnings, market cap) must be cross-referenced against the structured financial data API response before inclusion
- All financial data must be tagged with its date — the agent should explicitly state how fresh the data is
- Every AI research output must include this disclaimer: "⚠️ AI-Generated Analysis — This content was generated by AI for informational purposes only. It is not investment advice and may contain errors. Always verify information and consult a licensed financial professional before making investment decisions."

---

## External API Integrations

### Financial Data Providers

| Provider | Role | Free Tier Limits | Key Data |
|---|---|---|---|
| **Finnhub** | Primary real-time data | 60 calls/min | WebSocket streaming, real-time news, sentiment, insider trades, congressional trading |
| **Financial Modeling Prep (FMP)** | Fundamentals | 250 calls/day | 30yr+ financial statements, SEC filings, earnings transcripts, DCF models |
| **Twelve Data** | Global market data | 800 calls/day | 100K+ symbols, 90+ exchanges, 100+ technical indicators |
| **SEC EDGAR** | Official SEC filings | 10 req/sec | 10-K, 10-Q, 8-K, proxy statements — free, public REST API |
| **FRED (Federal Reserve)** | Macroeconomic data | 120 calls/min | Interest rates, GDP, CPI, employment — free with API key |
| **Serper API** | Web search for agent | Pay-per-use (~$0.004/query) | Google Search results for the `web_search` tool |

### API Client Patterns

Each external API should have a dedicated client module with:
- Typed request/response schemas (Zod)
- Retry with exponential backoff (3 retries: 1s, 2s, 4s) for 429 and 5xx errors
- Provider fallback: if Finnhub fails for quote data, try Twelve Data, then FMP
- Timeout: 10s per call, 30s for SEC EDGAR (large filings)
- Graceful degradation: if all providers fail, serve cached data

### API Key Management

All API keys are stored as Vercel environment variables (encrypted at rest). They are never exposed to the client — all external API calls are made server-side.

---

## Scheduled Jobs (Cron)

| Job | Schedule | Description |
|---|---|---|
| Refresh stock quotes | Every 1 min (market hours) | Fetch latest prices for actively tracked tickers → upsert `stock_quotes` → triggers Supabase Realtime push |
| Refresh market overview | Every 5 min (market hours) | Major indices, top movers, gainers/losers |
| Clean expired cache | Daily at 03:00 UTC | Delete old news articles (>30 days), stale quotes for untracked tickers |
| Reindex popular tickers | Daily at 02:00 UTC | Fetch latest SEC filings and earnings for popular tickers → embed → store in RAG |

Cron jobs are triggered via Vercel Cron (configured in `vercel.json`) hitting Route Handler endpoints. Each cron endpoint should verify a `CRON_SECRET` header for security.

---

## Data Caching Strategy

| Data Type | Cache Location | TTL |
|---|---|---|
| Real-time prices | Supabase Realtime (WebSocket push) | Live |
| Daily historical OHLCV | Supabase table | 1 hour during market, 24 hours after close |
| Fundamentals (quarterly) | Supabase table | Refresh on earnings release |
| Company profiles | Supabase table | 7 days |
| News articles | Supabase table | 15 minutes |
| RAG embeddings | pgvector | Refresh when new documents are ingested |
| AI research outputs | Browser (IndexedDB) | Permanent (user's local history) |

---

## Monitoring & Observability

| Tool | Purpose |
|---|---|
| **Langfuse** | LLM observability — trace every agent call, measure latency, cost, token usage, quality scores. Each research session = one trace. Each tool call = one span. User feedback (thumbs up/down) attached to traces. |
| **Vercel Analytics** | Web vitals, page performance, traffic |
| **Vercel Logs** | Serverless function logs, error tracking |

### Alerting Thresholds

- LLM cost per query exceeds $0.50 → warning
- External API provider down for > 5 minutes → critical alert
- Daily LLM spend exceeds $50 → warning
- Error rate on `/api/chat` exceeds 5% → critical alert

---

## Security

Even without auth, these security measures are required:

- **API keys**: Environment variables only. Never in code, logs, or client bundles. Only variables prefixed with `NEXT_PUBLIC_` are exposed to the client.
- **XSS prevention**: All AI-generated markdown output must be sanitized before rendering (use rehype-sanitize).
- **Rate limiting**: Implement rate limiting on the `/api/chat` endpoint to prevent abuse (e.g., 10 requests/min per IP). Use Vercel KV with `@upstash/ratelimit` or a simple in-memory approach.
- **CSRF**: Server Actions have built-in CSRF protection in Next.js. Route Handlers should verify the Origin header.
- **Security headers**: Set appropriate headers — `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Content-Security-Policy`.
- **Audit logging**: Log all AI agent tool calls to `research_sessions_log` for debugging and potential regulatory review.

---

## Environment Variables

| Variable | Used By | Exposed to Client? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client | Yes |
| `ANTHROPIC_API_KEY` | Research agent (Claude) | No |
| `OPENAI_API_KEY` | Embeddings + sub-tasks | No |
| `FINNHUB_API_KEY` | Financial data | No |
| `FMP_API_KEY` | Fundamentals data | No |
| `TWELVE_DATA_API_KEY` | Market data | No |
| `SERPER_API_KEY` | Web search tool | No |
| `FRED_API_KEY` | Macro data | No |
| `CRON_SECRET` | Cron job authentication | No |
| `LANGFUSE_PUBLIC_KEY` | LLM observability | No |
| `LANGFUSE_SECRET_KEY` | LLM observability | No |
| `LANGFUSE_BASE_URL` | LLM observability | No |

---

## Cost Projections

| Component | Monthly Cost (Launch) | Monthly Cost (Growth — 1K users) |
|---|---|---|
| Supabase Pro | $25 | $50–75 |
| Vercel Pro | $20 | $20 |
| LLM APIs (blended ~$0.08/query) | ~$160 (2K queries) | ~$1,200 (15K queries) |
| Financial data APIs (free tiers) | $0 | $50–80 (paid tiers) |
| Serper API (web search) | ~$10 | ~$60 |
| Langfuse (cloud) | $0 (self-hosted) or $59 | $59 |
| **Total** | **~$215–275** | **~$1,450–1,550** |