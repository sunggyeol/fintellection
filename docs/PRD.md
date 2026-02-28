# Fintellection: Product Requirements Document (MVP)

**Version:** 1.0
**Date:** February 26, 2026
**Author:** Product & Engineering
**Audience:** Sung (Founder/Developer)
**Status:** Draft for Review

---

## Executive summary

**Fintellection is an AI-powered financial intelligence platform that brings institutional-grade research capabilities to individual retail investors at a fraction of the cost.** The MVP ships two fully built modules — an Agentic Researcher that conducts deep, multi-step financial analysis using large language models, and a Stock Dashboard built on TradingView's charting library that visualizes research outputs alongside interactive price charts. A third module, the Agentic Trader, is scoped for future development and will execute trades with human-in-the-loop approval.

The platform is built on a **Next.js + Supabase** full-stack architecture, leveraging Vercel AI SDK and Mastra for agent orchestration, Supabase pgvector for retrieval-augmented generation, and TradingView Lightweight Charts (or Advanced Charts under free license) for professional charting. The total addressable market for AI-powered retail investor tools is projected to reach **$60 billion by 2033**, with retail investor inflows into U.S. stocks surging 53% year-over-year to $302 billion in 2025. Fintellection targets the underserved gap between free consumer tools (Yahoo Finance, basic Perplexity queries) and institutional platforms ($32,000/year Bloomberg Terminal), competing most directly with Fiscal.ai (formerly FinChat) at a projected price point of **$15–30/month**.

---

## Problem statement

Retail investors face a fundamental asymmetry: they are making increasingly large capital allocation decisions — **$302 billion in U.S. stock inflows in 2025 alone** — with tools that are either oversimplified or prohibitively expensive. The current landscape forces investors into an uncomfortable choice.

**Free tools provide data without intelligence.** Yahoo Finance, Google Finance, and basic stock screeners deliver raw numbers but leave investors to interpret complex financial statements, earnings calls, and macroeconomic signals on their own. Research shows that **51% of retail investors are influenced by FOMO** and 30% panic-sold during the 2025 volatility — symptoms of inadequate analytical frameworks, not lack of data.

**Premium tools provide opinions without reasoning.** Motley Fool ($199–499/year) and Seeking Alpha ($299–2,400/year) offer stock picks and crowdsourced analysis, but investors can't interrogate the methodology, explore alternative scenarios, or conduct independent research on adjacent questions. These platforms tell users *what* to buy but not *how to think about investing*.

**Institutional tools are inaccessible.** Bloomberg Terminal ($31,980/year), AlphaSense ($10,000+/year), and Capital IQ provide the depth that retail investors need but at price points 100–1,000× beyond their budgets. Even "Bloomberg-lite" platforms like Koyfin ($39–79/month) deliver the data but not the AI-powered synthesis.

**General-purpose AI lacks financial grounding.** Perplexity, ChatGPT, and Gemini can answer financial questions but draw from unverified web data, hallucinate financial figures, and lack structured access to authoritative financial databases, SEC filings, or real-time market data.

Fintellection solves this by pairing **agentic AI research** (grounded in verified financial data sources, SEC filings, and real-time market feeds) **with interactive charting** — giving retail investors a research co-pilot that reasons through financial questions step by step, cites its sources, and presents findings alongside professional-grade visualizations.

---

## Target users and personas

### Primary persona: The self-directed retail investor

**"Alex" — 28–45, knowledge worker, $50K–500K investable assets.** Alex has moved beyond passive index funds and wants to pick individual stocks but lacks the time or expertise to read 10-K filings, analyze earnings calls, and track macroeconomic indicators. Alex currently uses a patchwork of TradingView for charts, Seeking Alpha articles for analysis, and ChatGPT for quick questions — but wants a single, integrated research experience. Alex is willing to pay **$15–30/month** for a tool that saves 5–10 hours per week of research time.

### Secondary persona: The aspiring serious investor

**"Jordan" — 22–35, learning-oriented, $5K–50K investable assets.** Jordan is earlier in their investing journey and wants to learn *how* to analyze companies, not just *which* stocks to buy. Jordan values educational context alongside analysis — understanding what a P/E ratio means in context, why a particular sector is rotating, or how interest rates affect growth stocks. Jordan starts on the free tier and upgrades when the platform proves its value.

### Tertiary persona: The finance-adjacent professional

**"Morgan" — 30–50, financial advisor, analyst, or consultant.** Morgan uses institutional tools at work but wants a personal research assistant for their own portfolio or for quick analyses outside their firm's compliance-restricted terminal. Morgan values depth, accuracy, and source citations above all else.

---

## Product vision and strategy

### Vision

Fintellection will become **the default AI research layer for retail investors** — the platform where individual investors go to understand any financial question deeply, backed by verified data and transparent reasoning.

### Strategic positioning

Fintellection occupies the white space between consumer-grade financial tools and institutional platforms. The competitive moat will be built on three pillars:

1. **Depth of reasoning:** Unlike Perplexity (general-purpose) or Seeking Alpha (opinion-based), Fintellection's agentic researcher conducts multi-step financial analysis — decomposing complex questions, querying multiple data sources, cross-referencing findings, and synthesizing results with citations. This is closer to what a junior analyst at a hedge fund does, not a chatbot answering a question.

2. **Data grounding:** Every financial claim is grounded in authoritative data sources (SEC EDGAR, licensed market data APIs, Federal Reserve FRED) and cited. The system implements multi-layer hallucination mitigation including RAG, source verification, confidence scoring, and explicit uncertainty communication.

3. **Integrated experience:** Research outputs flow directly into the Stock Dashboard, where users can visualize the data being discussed, overlay technical indicators, and build watchlists — all without leaving the platform. This tight coupling between AI research and visual analysis is unique in the market.

### Business model (MVP)

- **Free tier:** 5 research queries/day, basic charts, 1 watchlist, delayed data
- **Pro tier ($19–29/month):** Unlimited research queries, real-time data, unlimited watchlists, research history, priority processing
- **Future: Premium tier ($49–79/month):** Agentic Trader module, portfolio analytics, alerts, API access

---

## MVP feature specifications

### Module 1: Agentic Researcher

The Agentic Researcher is the core differentiator of Fintellection. It is a multi-step AI research agent that conducts comprehensive financial analysis, grounded in real data sources, and presents findings with full citations.

#### FR-1: Research query interface

**Description:** A conversational input where users submit natural-language financial research queries. The interface supports both simple questions ("What is Apple's current P/E ratio?") and complex research requests ("Analyze NVIDIA's competitive position in the data center GPU market considering AMD's MI300X launch, hyperscaler capex trends, and China export restrictions").

**Requirements:**
- Text input with auto-expanding textarea, supporting up to 2,000 characters
- Query history sidebar showing past research sessions, searchable and filterable
- Suggested starter queries for new users (e.g., "Analyze Tesla's Q4 earnings", "Compare FAANG valuations", "What's driving the semiconductor cycle?")
- Keyboard shortcut (Cmd/Ctrl+K) to open query input from any screen
- Real-time streaming of AI responses using Vercel AI SDK's `useChat` hook with typing indicators

#### FR-2: Multi-step agentic research execution

**Description:** The system decomposes complex queries into sub-tasks, executes them using specialized tools (web search, financial data APIs, SEC filing analysis, RAG retrieval), and synthesizes findings into a structured research report.

**Agent architecture:**

The research agent uses a **ReAct (Reasoning + Acting) pattern with a Planner-Executor hybrid**, built on Vercel AI SDK 6 and Mastra:

1. **Query decomposition:** The orchestrator agent (Minimax 2.5 via Fireworks or GPT-4.1) breaks the user's question into 2–7 sub-queries based on complexity
2. **Parallel tool execution:** Sub-queries are executed in parallel where possible, using these tools:
   - `web_search` — Real-time web search for news, analyst commentary, press releases
   - `financial_data_api` — Structured queries to financial data providers (Finnhub, Twelve Data, FMP) for prices, fundamentals, ratios, earnings
   - `sec_filing_reader` — Fetch and analyze SEC EDGAR filings (10-K, 10-Q, 8-K, proxy statements)
   - `rag_query` — Semantic search over previously indexed financial documents and research (Supabase pgvector)
   - `calculator` — Financial calculations (DCF models, ratio analysis, growth rate computations)
3. **Cross-referencing:** Financial data points are validated against multiple sources before inclusion
4. **Synthesis:** Findings are combined into a coherent research narrative with inline citations
5. **Follow-up generation:** The system generates 3–5 recommended follow-up questions based on gap analysis

**LLM configuration:**
- **Primary model:** Minimax 2.5 via Fireworks — primary orchestration model for multi-step financial research and synthesis
- **Cost-optimization model:** GPT-4.1 mini ($0.40/$1.60 per 1M tokens) — for data extraction sub-tasks and formatting
- **Embedding model:** OpenAI text-embedding-3-small ($0.02 per 1M tokens) — for RAG vector generation
- **Estimated cost per research session:** $0.05–0.15 (10K input, 3K output tokens, 3–5 tool calls)

**Requirements:**
- Streaming response display with visible reasoning steps (show "Searching for NVIDIA revenue data...", "Analyzing SEC filing...", etc.)
- Each factual claim must include an inline citation linking to its source
- Confidence indicators for data points where uncertainty exists
- Ability to interrupt/cancel a running research query
- Research session saved automatically to user's history
- Maximum research execution time: 60 seconds for simple queries, 120 seconds for complex multi-step queries

#### FR-3: Recommended follow-up questions

**Description:** After each research session, the system generates 3–5 intelligent follow-up questions that deepen understanding, explore risks, examine competitors, or connect findings to broader trends.

**Implementation:** LLM-based gap analysis using a structured prompt that evaluates: (a) what companies/competitors were not analyzed, (b) what time periods were not covered, (c) what financial metrics were mentioned but not explored in depth, (d) what risks or contrary evidence was not examined, (e) what macroeconomic connections were not made.

**Requirements:**
- 3–5 follow-up questions displayed as clickable cards below the research output
- Each question includes a brief rationale explaining why it would be valuable to explore
- Clicking a follow-up question starts a new research session with that query, maintaining context from the parent session
- Follow-up questions are generated within 5 seconds of the main research completing

#### FR-4: Research output format

**Description:** Research outputs are structured, scannable, and visually rich — not walls of text.

**Output structure:**
- **Executive summary:** 2–3 sentence bottom-line conclusion
- **Key findings:** 3–7 major data points or insights, each with source citation
- **Detailed analysis:** Narrative section with supporting data, charts references, and context
- **Risk factors:** Explicitly stated uncertainties, contrary evidence, and caveats
- **Sources:** Full list of all sources referenced, with links

**Requirements:**
- Markdown rendering with syntax highlighting for financial data
- Bold key figures and metrics for scannability
- Inline citations rendered as clickable footnotes/tooltips
- "Push to Dashboard" button that sends relevant tickers and metrics to the Stock Dashboard
- Export to PDF and copy-to-clipboard functionality
- AI disclaimer displayed on every research output: "⚠️ AI-Generated Analysis: This content was generated by AI for informational purposes only. It is not investment advice and may contain errors. Always verify information and consult a licensed financial professional before making investment decisions."

#### FR-5: Hallucination mitigation system

**Description:** A multi-layer system to minimize AI-generated errors in financial data.

**Layers:**
1. **RAG grounding:** All financial claims are generated using retrieved context from authoritative sources, not parametric LLM knowledge
2. **Source citation enforcement:** System prompt requires inline citations for every factual claim; uncited claims are flagged
3. **Confidence thresholds:** If vector similarity score for retrieved context falls below 0.75, the agent responds "I don't have sufficient data to answer this accurately" rather than guessing
4. **Numerical validation:** Financial figures (revenue, earnings, market cap) are cross-referenced against the structured financial data API response before inclusion
5. **Temporal awareness:** All financial data is tagged with its date; the agent explicitly states data freshness
6. **Audit logging:** Every tool call, input/output, and data source is logged for debugging and compliance

---

### Module 2: Stock Dashboard

The Stock Dashboard provides interactive, professional-grade charting integrated with AI research outputs, watchlist management, and real-time market data.

#### FD-1: Interactive stock charts

**Description:** Full-featured stock charting using TradingView's charting technology, supporting multiple timeframes, chart types, and technical indicators.

**Charting library decision:**

Two viable options exist, and the choice depends on licensing constraints:

| | TradingView Lightweight Charts | TradingView Advanced Charts |
|---|---|---|
| **License** | Apache 2.0 (free, open source) | Free license available (strict conditions) |
| **Size** | ~45 KB | Full library |
| **Indicators** | Must implement custom | 100+ built-in |
| **Drawing tools** | None built-in | 80+ built-in |
| **Multi-pane** | No | Yes |
| **Data model** | Push data to chart | Library requests from your datafeed |
| **Best for** | MVP launch speed, simplicity | Professional-grade experience |

**Recommendation for MVP:** Start with **TradingView Lightweight Charts** for speed of implementation. Apply for **TradingView Advanced Charts free license** in parallel (requires free public-access product, TradingView attribution, blog post announcing partnership). Upgrade when license is granted.

**Lightweight Charts implementation:**
```
npm install lightweight-charts
```
- React component with `useRef` + `useEffect`, wrapped in Next.js `dynamic()` with `{ ssr: false }`
- Chart types: Candlestick (default), Line, Area
- Attribution required: TradingView credit + link on page

**Advanced Charts datafeed integration (when licensed):**
- Implement the Datafeed API JavaScript object with methods: `onReady()`, `searchSymbols()`, `resolveSymbol()`, `getBars()`, `subscribeBars()`, `unsubscribeBars()`
- Backend UDF (Universal Datafeed) adapter proxies requests to financial data APIs
- Library files served from `public/static/charting_library/`
- Next.js dynamic import with SSR disabled

**Requirements:**
- Default chart: 1-year candlestick with volume overlay
- Time range selectors: 1D, 1W, 1M, 3M, 6M, 1Y, 5Y, ALL
- Hover/touch interaction shows exact OHLCV values at that timestamp
- Responsive layout: full-width on desktop, full-screen on mobile
- Dark mode as default theme (standard for financial applications)
- Loading: skeleton placeholder while chart data loads

#### FD-2: AI insights panel

**Description:** Research outputs from the Agentic Researcher are displayed alongside the stock chart, creating an integrated analysis view.

**Requirements:**
- Split-pane layout: chart (60% width) + insights panel (40% width) on desktop; stacked on mobile
- AI insights panel shows the most recent research output for the currently viewed ticker
- "Analyze this stock" button triggers the Agentic Researcher with the current ticker pre-filled
- Key metrics highlighted from research (e.g., fair value estimate, growth rate, risk rating) are displayed as summary cards above the insights text
- Visual distinction from raw data: AI insights are rendered in a card with an AI badge icon and subtle background differentiation
- Streaming display: insights load progressively with typing animation

#### FD-3: Watchlist management

**Description:** Users can create and manage multiple watchlists to track stocks of interest.

**Requirements:**
- Default "My Watchlist" created on account setup
- Add/remove tickers via search or from any stock detail view
- Watchlist displays: ticker, company name, current price, daily change (%), sparkline mini-chart
- Sortable by any column
- Maximum 5 watchlists on free tier, unlimited on Pro
- Maximum 50 tickers per watchlist on free tier, 200 on Pro
- Real-time price updates via Supabase Realtime (WebSocket subscription to price changes)
- Watchlist data persisted in Supabase with RLS (user can only access their own watchlists)

#### FD-4: Stock detail page

**Description:** Comprehensive single-stock view combining chart, AI insights, fundamentals, and news.

**Layout:**
- **Hero section:** Ticker, company name, current price, daily change, after-hours price
- **Chart section:** Full interactive chart (FD-1)
- **Key metrics row:** Market cap, P/E ratio, 52-week range, volume, dividend yield, EPS
- **AI insights panel:** Latest research output (FD-2)
- **Fundamentals tab:** Income statement, balance sheet, cash flow (quarterly and annual)
- **News tab:** Recent news articles from financial data API news feeds
- **Add to watchlist** button

#### FD-5: Symbol search

**Description:** Fast, predictive search for stocks by ticker or company name.

**Requirements:**
- Debounced search (300ms) querying financial data API search endpoint
- Results show: ticker, company name, exchange, asset type
- Keyboard navigation (arrow keys + Enter)
- Recent searches persisted locally
- Search accessible from any screen via Cmd/Ctrl+K

#### FD-6: Dashboard home

**Description:** The landing page after authentication, providing a market overview and personalized view.

**Layout:**
- **Portfolio value / welcome section:** If connected, show portfolio summary; otherwise, market summary
- **Watchlist widget:** Primary watchlist with sparklines and price changes
- **Recent research:** Last 3 research sessions with quick-resume links
- **Market overview:** Major indices (S&P 500, NASDAQ, Dow), top gainers/losers
- **Trending research:** Popular queries across the platform (anonymized)

---

## System architecture and tech stack

### Architecture overview

```
┌─────────────────────── CLIENT ───────────────────────┐
│  Next.js App Router (React 19)                       │
│  ├── Server Components (data fetching, layouts)      │
│  ├── Client Components (charts, real-time, forms)    │
│  ├── TradingView Charts (dynamic, ssr: false)        │
│  └── Vercel AI SDK UI hooks (useChat, streaming)     │
└────────────────────────┬─────────────────────────────┘
                         │ HTTPS
┌────────────────────── SERVER ────────────────────────┐
│  Next.js Server (Vercel / self-hosted)               │
│  ├── Server Actions (mutations, CRUD)                │
│  ├── Route Handlers (webhooks, external APIs)        │
│  ├── Middleware (auth token refresh, route guards)    │
│  └── Mastra Agent Server                             │
│       ├── Research Orchestrator Agent                 │
│       ├── Tools: web_search, financial_api,           │
│       │         sec_filings, rag_query, calculator   │
│       ├── RAG Pipeline (.chunk → .embed → .query)    │
│       └── Memory (conversation + semantic recall)    │
└────────────────────────┬─────────────────────────────┘
                         │ PostgreSQL + WebSocket
┌──────────────────── DATA LAYER ─────────────────────┐
│  Supabase                                            │
│  ├── PostgreSQL (application data, RLS)              │
│  ├── pgvector (embeddings, RAG storage)              │
│  ├── Auth (email/password, OAuth, MFA)               │
│  ├── Realtime (live price subscriptions)             │
│  ├── Edge Functions (API proxying, scheduled tasks)  │
│  ├── Storage (research exports, file uploads)        │
│  └── pg_cron (scheduled data fetches)                │
└──────────────────────────────────────────────────────┘
                         │
┌─────────────── EXTERNAL SERVICES ───────────────────┐
│  Financial Data: Finnhub + Twelve Data + FMP         │
│  LLM APIs: Anthropic Claude + OpenAI GPT-4.1        │
│  Web Search: Built-in tool or Serper API             │
│  SEC EDGAR: Direct REST API (free, public)           │
│  Deployment: Vercel (Pro, $20/mo)                    │
└──────────────────────────────────────────────────────┘
```

### Tech stack details

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend framework** | Next.js 15+ (App Router) | React 19 Server Components, streaming, Suspense, native Supabase/Vercel integration |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid development, dark mode support, accessible components |
| **Charting** | TradingView Lightweight Charts (→ Advanced Charts) | Industry-standard financial charting, tiny bundle, free |
| **AI orchestration** | Vercel AI SDK 6 + Mastra | TypeScript-native, streaming, tool calling, RAG pipeline, evals, agent memory |
| **Primary LLM** | Minimax 2.5 (Fireworks) | Primary orchestration model for financial analysis and tool-use workflows |
| **Secondary LLM** | GPT-4.1 / GPT-4.1 mini (OpenAI) | Cost-efficient sub-tasks, superior structured output |
| **Embeddings** | OpenAI text-embedding-3-small | 1536 dimensions, $0.02/1M tokens, excellent quality/cost ratio |
| **Database** | Supabase PostgreSQL + pgvector | Single-store for relational + vector data, RLS, realtime, ACID transactions |
| **Auth** | Supabase Auth | Email/password, Google OAuth, MFA (TOTP), JWT-based, RLS integration |
| **Realtime** | Supabase Realtime (WebSocket) | Live price updates, watchlist syncing, notification delivery |
| **Serverless** | Supabase Edge Functions (Deno) | API proxying, webhook processing, scheduled tasks |
| **Scheduled jobs** | pg_cron + pg_net | Scheduled data fetches, cache warming, data cleanup |
| **Deployment** | Vercel Pro ($20/month) | Native Next.js optimization, edge functions, Fluid Compute (800s timeout) |
| **Monitoring** | Langfuse (open-source) | LLM observability, cost tracking, quality evaluation |

### Server Components vs Client Components strategy

**Server Components** (default, zero client JS): Dashboard layout, stock detail page shell, data tables, portfolio summary, research history list, settings pages.

**Client Components** (`'use client'`): TradingView charts, real-time price tickers, search input, AI chat interface, watchlist drag/sort, form interactions, WebSocket subscriptions.

**Pattern:** Server Components fetch data and pass it as props to Client Component leaves. Use `<Suspense>` boundaries with skeleton fallbacks around data-heavy sections.

### Server Actions vs Route Handlers

**Server Actions** (~90% of mutations): Watchlist CRUD, user preference updates, research query submission, portfolio updates, feedback submission.

**Route Handlers** (specific use cases): Stripe webhook endpoint, financial data provider webhooks, UDF datafeed adapter for TradingView Advanced Charts, health check endpoint, any future mobile API.

---

## Data sources and API integrations

### Recommended financial data API stack

After evaluating seven major financial data providers, the recommended approach uses a **multi-provider strategy** for cost efficiency, data coverage, and redundancy.

| Provider | Role | Tier | Cost | Why |
|---|---|---|---|---|
| **Finnhub** | Primary real-time data | Free → Paid | Free: 60 calls/min | Best free tier; WebSocket streaming; real-time news; alternative data (sentiment, insider trades, congressional trading) |
| **Twelve Data** | Global market data + technical indicators | Free → Grow ($29/mo) | Free: 800 calls/day | 100,000+ symbols across 90+ exchanges; 100+ technical indicators; WebSocket streaming; excellent documentation |
| **Financial Modeling Prep** | Fundamental data + SEC filings | Free → Starter ($22/mo) | Free: 250 calls/day | Strongest fundamental data at the price point; 30+ years of financials; DCF models; earnings transcripts; SEC EDGAR integration |
| **SEC EDGAR** | Official SEC filings | Direct API | Free (public) | Authoritative source for 10-K, 10-Q, 8-K, proxy statements; XBRL structured data |
| **Federal Reserve FRED** | Economic data | Direct API | Free | Macroeconomic indicators, interest rates, employment data, GDP |

**MVP data flow:**
1. Finnhub WebSocket delivers real-time prices to the Stock Dashboard via Supabase Realtime relay
2. Twelve Data provides historical OHLCV for chart rendering and technical indicators for the Agentic Researcher
3. FMP provides fundamental data (financial statements, ratios, earnings) for research queries
4. SEC EDGAR provides raw filings for document analysis
5. FRED provides macroeconomic context for sector and market analysis

**Providers explicitly avoided:**
- **Yahoo Finance/yfinance:** Unofficial, unreliable, breaks frequently (Feb 2025 major outage), violates Yahoo ToS, not suitable for production fintech
- **Alpha Vantage:** Severely restrictive free tier (25 calls/day); steep jump to $49.99/month; no WebSocket
- **IEX Cloud:** Discontinued as of August 2024

### API comparison table

| Feature | Finnhub (Free) | Twelve Data (Free) | FMP (Free) | Polygon (Free) |
|---|---|---|---|---|
| **Rate limit** | 60/min | 800/day | 250/day | 5/min |
| **Real-time** | 15-min delay | Paid only | Paid only | EOD only |
| **WebSocket** | ✅ | Paid only | Paid only | Paid only |
| **Fundamentals** | Limited | Limited | ✅ Strong | Paid only |
| **Global coverage** | ✅ | ✅ 90+ exchanges | 60+ exchanges | US only |
| **News feed** | ✅ Real-time | ✅ | ✅ | ❌ |
| **Sentiment data** | ✅ | ❌ | ❌ | ❌ |
| **Technical indicators** | ✅ | ✅ 100+ | ✅ | ✅ |
| **SEC filings** | ✅ | ❌ | ✅ | ❌ |

### Data caching strategy

Financial data has distinct freshness requirements:

| Data type | Caching approach | TTL |
|---|---|---|
| Real-time prices | WebSocket → Supabase Realtime, no caching | 0 (live) |
| Intraday OHLCV | In-memory cache (Redis or pg) | 1 minute |
| Daily historical data | Supabase table + ISR page | 1 hour during market; 24 hours after close |
| Fundamentals (quarterly) | Supabase table | Refresh on earnings release |
| Company profiles | Supabase table | 7 days |
| News articles | Supabase table + text index | 15 minutes |
| AI research outputs | Supabase table + pgvector | Permanent (user's history) |
| Embeddings | pgvector with HNSW index | Refresh with new data |

---

## User flows and key screens

### Flow 1: New user onboarding

1. **Landing page** → Click "Get Started Free"
2. **Sign up** → Email/password or Google OAuth via Supabase Auth → Email verification
3. **Onboarding wizard** (3 steps):
   - Step 1: "What's your investing experience?" (Beginner / Intermediate / Advanced) — tailors default dashboard complexity
   - Step 2: "What are you interested in?" — select 3–5 sectors or themes → seeds initial watchlist
   - Step 3: "Try your first research query" — pre-filled example query with guided walkthrough
4. **Dashboard home** → Watchlist populated, sample research visible

### Flow 2: Conducting a research query

1. **Dashboard** → Click search bar or press Cmd/Ctrl+K
2. **Type query** → e.g., "Analyze NVIDIA's data center revenue growth and competitive threats from AMD"
3. **Research executes** → Progress indicators show agent steps ("Searching for NVIDIA financials...", "Analyzing AMD MI300X benchmarks...", "Comparing market share data...")
4. **Results stream** → Executive summary appears first, followed by detailed analysis, risk factors, and sources
5. **Follow-up questions** → 3–5 suggested next queries appear below results
6. **Actions** → "View NVDA Chart" button opens Stock Dashboard; "Push to Watchlist" adds NVDA; "Export PDF" downloads report

### Flow 3: Exploring a stock on the dashboard

1. **Search for ticker** → Symbol search returns results
2. **Stock detail page** loads → Chart renders with 1Y candlestick default; key metrics populate from API
3. **User adjusts timeframe** → Click 3M button; chart redraws
4. **Click "Analyze"** → Agentic Researcher opens in side panel with ticker pre-filled
5. **AI insight streams** → Research appears alongside chart; key metrics from research populate summary cards
6. **Add to watchlist** → Click ⭐; ticker appears in watchlist sidebar

### Flow 4: Managing watchlists

1. **Sidebar** shows watchlist with real-time prices
2. **Click "+"** → Create new watchlist with custom name
3. **Drag tickers** to reorder
4. **Click ticker** → Navigates to stock detail page
5. **Swipe left** (mobile) or hover-delete (desktop) → Remove from watchlist

### Key screens (wireframe descriptions)

**Screen 1 — Dashboard Home:** Top bar with logo, search (center), user avatar (right). Left sidebar with navigation (Dashboard, Research, Watchlists, Settings) and watchlist widget. Main area shows portfolio/market summary hero, recent research cards, market overview tiles.

**Screen 2 — Research Interface:** Full-width conversational view. Left sidebar collapses to icons. Chat input at bottom with send button. Messages stream above with agent reasoning steps, research output blocks, and follow-up question cards. Right mini-panel shows related tickers mentioned in research.

**Screen 3 — Stock Detail:** Full-width chart spanning top 60% of viewport. Below chart: tabbed interface (Overview | Fundamentals | News | AI Insights). Sticky header with ticker, price, change. Floating "Analyze" FAB button.

---

## Non-functional requirements

### Performance

| Metric | Target | Rationale |
|---|---|---|
| **Time to First Byte (TTFB)** | < 200ms | Vercel edge deployment |
| **Largest Contentful Paint (LCP)** | < 2.5s | Core Web Vital; chart is heaviest element |
| **Chart render time** | < 1s after data received | TradingView Lightweight Charts is 45KB |
| **AI response first token** | < 2s | Streaming response should begin quickly |
| **AI full research completion** | < 60s (simple) / < 120s (complex) | User patience threshold |
| **Real-time price latency** | < 500ms from source | WebSocket relay via Supabase Realtime |
| **Search results** | < 300ms | Debounced, cached API responses |
| **API uptime** | 99.5% | Supabase Pro SLA; Vercel Pro SLA |

### Security

- **Authentication:** Supabase Auth with email/password + Google OAuth; MFA (TOTP) encouraged for all accounts, required for any future trading features
- **Authorization:** Row-Level Security (RLS) on every Supabase table; `auth.uid()` policies ensure users only access their own data
- **Encryption in transit:** TLS 1.2+ enforced on all connections (Supabase default + Vercel HTTPS)
- **Encryption at rest:** AES-256 for all Supabase data at rest; API keys encrypted with `pgcrypto` (`pgp_sym_encrypt`)
- **Session management:** Short-lived JWTs (1 hour), refresh tokens, automatic renewal via Next.js middleware, 30-minute inactivity timeout
- **API key security:** Financial data API keys stored in environment variables (Vercel encrypted), never exposed to client; user's own API keys (future) encrypted server-side
- **Rate limiting:** Implement rate limiting on research queries (free tier: 5/day; pro: 100/day) and API endpoints
- **Content Security Policy:** Strict CSP headers; sanitize all AI-generated HTML output before rendering

### Scalability

- **Database:** Supabase Pro handles most early-stage needs (8GB storage, 500 concurrent realtime connections). Scale to Team ($599/month) if concurrent users exceed 500. pgvector with HNSW indexes handles up to ~10M vectors efficiently.
- **Compute:** Vercel Pro provides 40 hours/month active CPU time. AI research queries are the primary consumer. At $0.10/query average, 10K monthly research queries cost ~$1,000 in LLM API fees — this is the scaling bottleneck, not infrastructure.
- **Caching:** Implement aggressive caching for financial data (ISR for public stock pages, in-memory for real-time); cache common research patterns to reduce LLM calls.
- **Cost projection at scale:**

| Monthly active users | Research queries/mo | Infra cost/mo | LLM cost/mo | Total |
|---|---|---|---|---|
| 100 (launch) | 2,000 | ~$70 | ~$200 | ~$270 |
| 1,000 | 20,000 | ~$150 | ~$2,000 | ~$2,150 |
| 10,000 | 150,000 | ~$600 | ~$15,000 | ~$15,600 |

---

## Regulatory and compliance considerations

### The critical legal boundary

Fintellection provides **financial information and educational content**, not investment advice. This distinction is legally significant and must be maintained throughout the product.

Under the **Investment Advisers Act of 1940**, a person is an "investment adviser" if they (1) provide advice about securities, (2) for compensation, (3) as part of a regular business. Fintellection falls under the **Publisher's Exclusion** (Section 202(a)(11)(D)) and the **DOL Interpretive Bulletin 96-1 safe harbors** for financial information and educational content, as long as:

- Research outputs are **impersonal** (not tailored to a specific individual's portfolio, risk tolerance, or financial situation)
- The platform provides **general financial information** (asset class characteristics, historical performance, company data, market analysis) — not personalized recommendations
- No specific "buy/sell/hold" recommendations are given for individual users' circumstances
- Content is clearly labeled as AI-generated and for informational purposes only

### Required disclaimers

**Global disclaimer** (footer/about page, terms of service):

> Fintellection is an AI-powered financial research and information tool designed for educational and informational purposes only. The content, data, analyses, and outputs generated by this platform do not constitute investment advice, financial advice, tax advice, or any form of professional financial guidance. They are not personalized recommendations to buy, sell, or hold any security. Fintellection, Inc. is not a registered investment adviser, broker-dealer, or financial planner and does not provide investment advisory services. No fiduciary relationship is created by your use of this platform. All investments involve risk, including the possible loss of principal. Past performance does not guarantee future results. Before making any investment decision, consult with a qualified, licensed financial professional.

**Per-output disclaimer** (displayed on every AI research result):

> ⚠️ AI-Generated Analysis — This content was generated by AI for informational purposes only. It is not investment advice and may contain errors. Always verify information and consult a licensed financial professional before making investment decisions.

### Key regulatory requirements

1. **No personalized recommendations:** The Agentic Researcher must not incorporate a user's specific portfolio holdings, risk tolerance, or financial situation into its analysis to generate personalized buy/sell recommendations. General analysis of a stock's fundamentals is acceptable; "You should buy NVDA given your portfolio" is not.

2. **No AI-washing:** SEC Press Release 2024-36 charged two investment advisers for false AI claims. All marketing and product descriptions must accurately represent the AI's capabilities without exaggeration.

3. **FINRA Rule 2210 compliance:** Even though Fintellection is not a broker-dealer, AI-generated content must be fair, balanced, and not misleading. Implement content quality monitoring.

4. **Data privacy:** Comply with GDPR (EU users), CCPA/CPRA (California users), and Gramm-Leach-Bliley Act considerations. Implement: privacy policy, consent management, data export functionality, data deletion mechanism, "Do Not Sell" toggle.

5. **Terms of service must include:** Explicit non-advisory statement, limitation of liability, no warranty on AI accuracy, assumption of risk by user, indemnification clause, mandatory arbitration clause, no fiduciary relationship statement.

6. **Audit trail:** Log all AI tool calls, data sources used, and outputs generated for potential regulatory review.

7. **Future Agentic Trader:** If/when the trading module launches, it will likely trigger RIA registration requirements. Consult a securities attorney before development begins.

---

## Competitive analysis

### Market positioning map

Fintellection occupies the **"AI-native research"** quadrant — high AI sophistication, moderate data depth, retail-accessible pricing.

| Platform | Annual cost | AI depth | Data depth | Target |
|---|---|---|---|---|
| Bloomberg Terminal | $31,980 | Low (limited AI) | Deepest | Institutional |
| AlphaSense | $10,000+ | High (NLP) | Deep | Enterprise |
| Seeking Alpha PRO | $2,400 | Medium (AI assistant) | Medium | Serious retail |
| Koyfin Pro | $948 | None | Deep (Capital IQ) | Data-savvy retail |
| Morningstar Investor | $249 | Low | Deep (funds) | Long-term retail |
| **Fiscal.ai Pro** | **$576** | **High (AI Copilot)** | **Deep (S&P MI)** | **Active retail** |
| Motley Fool SA | $199 | Low | Low (picks only) | Beginner retail |
| **Fintellection Pro** | **$228–348** | **High (Agentic)** | **Medium** | **Self-directed retail** |
| TradingView Plus | $310 | Low (patterns) | Medium | Active traders |
| Simply Wall St | $120–240 | Low | Medium | Visual learners |
| Perplexity Pro | $200 | Medium (general AI) | Low (unverified) | General users |

### Competitive differentiation against the closest competitor

**Fiscal.ai (formerly FinChat)** is the most direct competitor — an AI-powered financial research platform with 350,000+ users, $10M Series A funding, SOC 2 Type II certification, and S&P Market Intelligence data. Fintellection must differentiate on:

1. **Agentic depth over single-turn answers.** Fiscal.ai's Copilot answers questions; Fintellection's Agentic Researcher conducts multi-step research with visible reasoning, tool use transparency, and iterative investigation. Users see *how* the analysis was performed, not just the result.

2. **Integrated charting experience.** Fiscal.ai offers charting, but Fintellection's deep integration between TradingView-powered charts and AI research outputs — where research findings automatically highlight relevant chart patterns and time periods — creates a unified analytical workflow.

3. **Follow-up research paths.** The recommended follow-up questions system creates a guided research experience that helps investors think more deeply, not just get answers. This appeals to the "learning investor" persona that Fiscal.ai doesn't specifically serve.

4. **Future: Agentic Trader.** No competitor in the retail AI research space offers a direct path to AI-assisted trade execution with HITL approval. This creates a unique long-term moat.

---

## Future roadmap

### Phase 2: Agentic Trader (Q3–Q4 2026)

The Agentic Trader will transform research insights into actionable trade recommendations with human-in-the-loop approval, making Fintellection a complete research-to-execution platform.

**Core capabilities (planned):**
- **Active recommendation system:** The agent monitors the user's watchlist and research history, proactively surfacing opportunities (e.g., "NVDA just dropped 8% — your research from last week identified $115 as an attractive entry point based on DCF analysis. Want to explore this?")
- **Trade proposal generation:** Based on research outputs, the agent generates specific trade proposals (entry price, position size based on portfolio %, stop-loss, take-profit levels) — presented as a structured card for human review
- **Human-in-the-loop (HITL) approval:** Every trade proposal requires explicit user confirmation. The user reviews the rationale, modifies parameters if desired, and approves or rejects. No autonomous execution without approval.
- **Broker integration:** Connect to brokerage accounts via Alpaca Markets API (commission-free trading API) or Plaid for read-only portfolio sync with traditional brokerages
- **Portfolio analytics:** Performance tracking, risk metrics (Sharpe ratio, max drawdown, beta), sector allocation visualization, tax-lot tracking
- **Alert system:** Price alerts, earnings date alerts, significant news alerts, portfolio drift alerts

**Regulatory note:** The Agentic Trader will likely constitute investment advisory activity under the Advisers Act. Prior to development, a securities attorney must evaluate whether RIA registration (state or SEC) is required. The "Internet adviser" exemption may apply for SEC registration without the $100M AUM threshold. Budget $10,000–25,000 for legal consultation and registration.

### Phase 3: Social and collaborative features (2027)

- Shared research: users publish and share research sessions
- Community leaderboard: track accuracy of shared research predictions
- Collaborative watchlists: shared watchlists for investment clubs
- Expert marketplace: verified analysts offer premium research channels

### Phase 4: Multi-asset expansion (2027)

- Cryptocurrency analysis with on-chain data integration
- Options flow analysis and strategy builder
- Fixed income and bond analysis
- International markets deep coverage
- Alternative data integration (satellite imagery, web traffic, app downloads)

---

## Success metrics and KPIs

### North Star metric

**Weekly active researchers** — unique users who complete at least one research query per week. This measures the core value loop: users come to Fintellection to do research, find it valuable, and return.

### Primary KPIs

| Metric | MVP target (Month 3) | Growth target (Month 12) | Measurement |
|---|---|---|---|
| **Registered users** | 500 | 5,000 | Supabase Auth count |
| **Weekly active researchers** | 100 | 1,500 | Research query events/week (unique users) |
| **Research queries/user/week** | 3.0 | 5.0 | Total queries / active researchers |
| **Free → Pro conversion** | 5% | 8% | Paying users / registered users |
| **Monthly recurring revenue** | $500 | $8,000 | Stripe MRR |
| **User retention (Day 30)** | 25% | 40% | Cohort analysis |
| **Research quality score** | 4.0/5.0 | 4.3/5.0 | User thumbs-up/down on research outputs |
| **Time to value** | < 5 min | < 3 min | Time from signup to first completed research |

### Secondary KPIs

- **Avg. research session duration:** 8–12 minutes (indicates depth of engagement)
- **Follow-up question click-through rate:** 30%+ (indicates research path feature works)
- **Watchlist creation rate:** 60% of users create a watchlist in first session
- **Chart interaction rate:** 70% of stock detail page visitors interact with the chart
- **AI accuracy score:** < 2% reported factual errors in research outputs (tracked via user feedback)
- **LLM cost per query:** < $0.15 average (monitor for cost optimization)
- **P95 research completion time:** < 45 seconds for standard queries

---

## Timeline and milestones

### Phase 1: Foundation (Weeks 1–3)

- Project scaffolding: Next.js + Supabase + Tailwind + shadcn/ui
- Supabase schema design and RLS policies
- Supabase Auth implementation (email/password + Google OAuth)
- Basic layout: navigation, responsive shell, dark mode theme
- User profile and settings pages

### Phase 2: Stock Dashboard (Weeks 3–6)

- Financial data API integration (Finnhub + Twelve Data)
- TradingView Lightweight Charts integration with data feed adapter
- Symbol search with debounced API queries
- Stock detail page (chart + key metrics + fundamentals)
- Watchlist CRUD with Supabase RLS
- Real-time price updates via Supabase Realtime relay
- Dashboard home with market overview

### Phase 3: Agentic Researcher (Weeks 6–10)

- Vercel AI SDK + Mastra setup and configuration
- Research agent implementation with ReAct pattern
- Tool integration: web search, financial data API, SEC EDGAR
- RAG pipeline: pgvector setup, document chunking, embedding, retrieval
- Streaming response UI with reasoning step indicators
- Follow-up question generation
- Research history storage and retrieval
- Citation system and source display

### Phase 4: Integration and polish (Weeks 10–12)

- AI insights panel integration with Stock Dashboard
- "Push to Dashboard" flow from research to chart
- Export functionality (PDF, clipboard)
- Onboarding wizard
- Disclaimer and compliance implementation
- Performance optimization (caching, lazy loading, code splitting)
- Error handling and edge cases
- Mobile responsive testing and refinement

### Phase 5: Launch prep (Weeks 12–14)

- Stripe integration for Pro tier billing
- Rate limiting implementation (free vs Pro tiers)
- Analytics instrumentation (Vercel Analytics + PostHog)
- Langfuse setup for LLM observability
- Security audit (RLS testing, penetration testing basics)
- Terms of Service, Privacy Policy, Disclaimers finalization
- Landing page and marketing site
- Beta launch to 50–100 users
- Iterate based on feedback
- **Public launch**

**Total estimated MVP timeline: 14 weeks (3.5 months) for solo developer**

---

## Risks and mitigations

### High-severity risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **AI hallucination of financial data** | High | Critical — users make real financial decisions based on outputs | Multi-layer mitigation: RAG grounding, source citation enforcement, confidence thresholds, numerical cross-validation, explicit uncertainty communication, per-output disclaimers |
| **Regulatory action** | Low | Critical — cease-and-desist or fines | Maintain strict "information not advice" boundary; comprehensive disclaimers; no personalized recommendations; consult securities attorney before Agentic Trader development; audit trail for all AI outputs |
| **Financial data API reliability** | Medium | High — dashboard and research break if APIs go down | Multi-provider strategy (Finnhub + Twelve Data + FMP); graceful degradation showing cached data with "delayed" indicator; fallback between providers |
| **LLM API cost escalation** | Medium | High — unit economics break at scale | Model routing (expensive models for complex queries only); prompt caching (50–75% cost reduction on repeated patterns); response caching for identical queries; cost monitoring with Langfuse alerts |

### Medium-severity risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **TradingView license application rejected** | Medium | Medium — stuck with Lightweight Charts (less feature-rich) | Lightweight Charts is viable for MVP; alternatives exist (DXcharts Lite, React-Financial-Charts); build abstraction layer to swap charting library |
| **Solo developer velocity** | High | Medium — timeline slips | Ruthless MVP scoping; use shadcn/ui and Mastra to accelerate; deploy each phase incrementally; get user feedback early to avoid building wrong features |
| **User trust in AI financial tools** | Medium | Medium — low adoption | Transparent reasoning (show agent's work); source citations; accuracy feedback loop; disclaimer visibility; comparison reports users can verify themselves |
| **Competitor launches similar product** | Medium | Medium — differentiation erodes | Move fast; build unique agentic depth + charting integration moat; focus on community and user experience rather than pure data |
| **Supabase free tier limits hit during development** | Low | Low — manageable cost increase | Supabase Pro at $25/month is affordable; monitor usage dashboard; upgrade early in Phase 2 |

---

## Appendices

### Appendix A: Financial data API detailed comparison

| | Finnhub | Twelve Data | FMP | Polygon | Alpha Vantage |
|---|---|---|---|---|---|
| **Free rate limit** | 60/min | 800/day | 250/day | 5/min | 25/day |
| **Paid from** | License-based | $29/mo | $22/mo | $29/mo | $49.99/mo |
| **Real-time data** | 15-min delay (free) | Paid only | Paid only | $199/mo | Premium only |
| **WebSocket** | ✅ | Paid | Paid | Paid | ❌ |
| **US equities** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Global equities** | ✅ | ✅ (90+ exchanges) | ✅ (60+ exchanges) | ❌ (US only) | ✅ (20+ exchanges) |
| **Fundamentals** | Basic | Basic | ✅ Deep (30yr+) | Paid | ✅ |
| **SEC filings** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **News** | ✅ Real-time | ✅ | ✅ | ❌ | ❌ |
| **Sentiment/Alt data** | ✅ (insider, congress) | ❌ | ✅ (ESG, insider) | ❌ | ✅ (sentiment) |
| **Technical indicators** | ✅ | ✅ 100+ | ✅ | ✅ | ✅ 50+ |
| **JavaScript SDK** | ✅ | ✅ | Community | ✅ | Community |

**MVP recommendation:** Finnhub (free tier, real-time news + sentiment) + FMP (free tier, deep fundamentals + SEC filings). Add Twelve Data ($29/mo) when scaling for global coverage and advanced technical indicators.

### Appendix B: TradingView integration technical notes

**Lightweight Charts (MVP):**
```typescript
// Install: npm install lightweight-charts
// Next.js component (must be client-side only)

'use client';
import dynamic from 'next/dynamic';

const ChartComponent = dynamic(() => import('./ChartComponent'), { 
  ssr: false 
});

// ChartComponent.tsx
import { createChart, CandlestickSeries } from 'lightweight-charts';
import { useRef, useEffect } from 'react';

export default function ChartComponent({ data }) {
  const chartContainerRef = useRef(null);
  
  useEffect(() => {
    const chart = createChart(chartContainerRef.current, {
      layout: { 
        background: { color: '#1a1a2e' }, 
        textColor: '#d1d4dc' 
      },
      grid: { 
        vertLines: { color: '#2B2B43' }, 
        horzLines: { color: '#363C4E' } 
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });
    
    const candleSeries = chart.addSeries(CandlestickSeries);
    candleSeries.setData(data); // [{time, open, high, low, close}]
    chart.timeScale().fitContent();
    
    return () => chart.remove();
  }, [data]);
  
  return <div ref={chartContainerRef} />;
}
```

**Attribution requirement:** Include on any page using the chart:
```html
<a href="https://www.tradingview.com/" target="_blank">
  Charts by TradingView
</a>
```

**Advanced Charts upgrade path:**
1. Apply at https://www.tradingview.com/advanced-charts/ (fill business use-case form)
2. Once approved, clone private GitHub repo
3. Copy `charting_library/` and `datafeeds/` to `public/static/`
4. Implement Datafeed API adapter connecting to your financial data backend
5. Free license requires: product is free and publicly accessible, TradingView attribution with link (no nofollow), published blog post announcing partnership ≥14 days before launch, library code not in any public repo

### Appendix C: Supabase database schema (core tables)

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- User profiles (extends Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  experience_level TEXT CHECK (experience_level IN ('beginner','intermediate','advanced')),
  preferred_sectors TEXT[],
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Watchlists
CREATE TABLE watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id UUID REFERENCES watchlists(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(watchlist_id, symbol)
);

-- Research sessions
CREATE TABLE research_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  query TEXT NOT NULL,
  response TEXT,
  response_summary TEXT,
  symbols_referenced TEXT[],
  sources JSONB DEFAULT '[]',
  follow_up_questions JSONB DEFAULT '[]',
  model_used TEXT,
  tokens_used INTEGER,
  cost_cents INTEGER,
  rating SMALLINT CHECK (rating IN (1, -1)),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RAG document store
CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  source_type TEXT NOT NULL, -- 'sec_filing', 'earnings_call', 'news', 'research'
  source_url TEXT,
  symbol TEXT,
  title TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_documents_embedding ON documents 
  USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_documents_symbol ON documents(symbol);
CREATE INDEX idx_documents_source ON documents(source_type);

-- Cached financial data
CREATE TABLE stock_quotes (
  symbol TEXT PRIMARY KEY,
  price NUMERIC,
  change_pct NUMERIC,
  volume BIGINT,
  market_cap NUMERIC,
  pe_ratio NUMERIC,
  week_52_high NUMERIC,
  week_52_low NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all user-facing tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users access own profile" ON profiles
  FOR ALL TO authenticated USING (id = auth.uid());
CREATE POLICY "Users access own watchlists" ON watchlists
  FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users access own watchlist items" ON watchlist_items
  FOR ALL TO authenticated USING (
    watchlist_id IN (SELECT id FROM watchlists WHERE user_id = auth.uid())
  );
CREATE POLICY "Users access own research" ON research_sessions
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- Indexes for RLS performance
CREATE INDEX idx_watchlists_user ON watchlists(user_id);
CREATE INDEX idx_research_user ON research_sessions(user_id);
CREATE INDEX idx_watchlist_items_wl ON watchlist_items(watchlist_id);
```

### Appendix D: Supabase pricing summary for Fintellection

| Phase | Plan | Monthly cost | Includes |
|---|---|---|---|
| **Development** | Free | $0 | 500MB DB, 1GB storage, 50K MAU, 2 projects |
| **Beta launch** | Pro | $25 | 8GB DB, 100GB storage, 100K MAU, daily backups |
| **Growth (1K+ users)** | Pro + overages | ~$50–75 | Overage rates: $0.125/GB DB, $0.00325/MAU |
| **Scale (10K+ users)** | Team | $599 | Priority support, SOC 2, advanced security |

### Appendix E: LLM cost projections

| Scenario | Model | Tokens/query | Cost/query | Queries/mo | Monthly LLM cost |
|---|---|---|---|---|---|
| **Simple lookup** | GPT-4.1 mini | 3K in / 1K out | ~$0.003 | — | — |
| **Standard research** | Minimax 2.5 (Fireworks) | 10K in / 3K out | TBD (provider pricing) | — | — |
| **Complex multi-step** | Minimax 2.5 (Fireworks) | 25K in / 5K out | TBD (provider pricing) | — | — |
| **Blended (MVP)** | Mixed | — | ~$0.08 avg | 2,000 | ~$160 |
| **Blended (Growth)** | Mixed | — | ~$0.06 avg* | 20,000 | ~$1,200 |

*Cost decreases with scale due to prompt caching (50–75% discount on repeated system prompts) and model routing optimization.

### Appendix F: Regulatory compliance checklist

- [ ] Comprehensive terms of service drafted (include non-advisory statement, limitation of liability, no warranty on AI, assumption of risk, indemnification, arbitration, no fiduciary relationship)
- [ ] Privacy policy drafted (GDPR + CCPA compliant)
- [ ] Global disclaimer placed on landing page, footer, and about page
- [ ] Per-output AI disclaimer displayed on every research result
- [ ] Data deletion mechanism implemented (GDPR right to erasure)
- [ ] Data export mechanism implemented (GDPR right to portability)
- [ ] "Do Not Sell" toggle implemented (CCPA)
- [ ] Consent management for cookies and data processing
- [ ] Audit logging for all AI tool calls and outputs
- [ ] Research outputs verified to not include personalized buy/sell/hold recommendations based on individual user circumstances
- [ ] Marketing materials reviewed for AI-washing (accurate AI capability descriptions)
- [ ] Securities attorney consulted before Agentic Trader development begins
- [ ] No user portfolio data is used to generate personalized investment recommendations (until/unless RIA registration obtained)

---

*This document is a living artifact. It should be updated as research validates assumptions, user feedback reshapes priorities, and technical discoveries inform architecture decisions. Sung — build the thing, ship it fast, and iterate based on what real users tell you.*
