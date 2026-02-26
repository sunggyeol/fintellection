# Fintellection — Frontend Requirements

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 15+ (App Router) | Full-stack React framework with Server Components and Server Actions |
| **Language** | TypeScript | Type safety across all code |
| **Styling** | Tailwind CSS 4 + shadcn/ui | Utility-first styling with accessible component primitives |
| **Icons** | Lucide React | Icon library (consistent with shadcn/ui) |
| **Charting** | TradingView Lightweight Charts v4 | Stock price charts (candlestick, line, area, volume). Must be dynamically imported with SSR disabled since it requires DOM access. |
| **AI Streaming** | Vercel AI SDK (`ai` package) | `useChat` hook for streaming LLM responses to the research interface |
| **Markdown Rendering** | react-markdown + remark-gfm | Render AI research outputs as rich markdown (tables, links, bold, code) |
| **URL State** | nuqs | Type-safe URL search params for filters, active tabs, selected tickers |
| **Animations** | Framer Motion | Micro-animations for page transitions, panel slides, loading states |
| **Forms** | React Hook Form + Zod | Form state management and schema validation (shared with server) |

---

## Session & Persistence

There is no user authentication. The app is session-based.

- Use **browser-side persistence** (IndexedDB via a library like Dexie.js, or localStorage for simple key-value data) to store: watchlists, research history, user preferences (theme, experience level, sector interests), and any other user-generated state.
- The session is tied to the browser. If the user clears browser data, their session is lost. This is acceptable for MVP.
- No login, signup, or account management pages.
- No auth middleware, no JWT, no cookies for auth purposes.

---

## Page Structure

All pages use the Next.js App Router. No auth guards needed.

### Pages

| Route | Page | Description |
|---|---|---|
| `/` | **Dashboard Home** | Market overview, watchlist widget, recent research sessions, trending queries. This is the landing page. |
| `/research` | **Research Interface** | Conversational AI research — query input, streaming output, follow-up questions |
| `/research/[id]` | **Research Session** | View a saved research session by ID (loaded from local storage) |
| `/stock/[symbol]` | **Stock Detail** | TradingView chart + key metrics + fundamentals tabs + AI insights panel |
| `/watchlists` | **Watchlist Manager** | Create, edit, delete watchlists; reorder tickers |
| `/settings` | **Settings** | Theme preference, default watchlist, clear data |
| `/trader` | **Agentic Trader (Coming Soon)** | Static placeholder page with "Coming Soon" messaging |

---

## Layout Architecture

### App Layout (wraps all pages)

- **Left sidebar** (collapsible):
  - Navigation links: Dashboard, Research, Watchlists, Settings
  - Primary watchlist widget showing live prices and sparklines
- **Top bar**: Logo (left), global symbol search with Cmd/Ctrl+K shortcut (center), theme toggle (right)
- **Main content area**: The active page content

### Component Rendering Strategy

- **Server Components** (default, no `'use client'`): Use for layouts, data-fetching wrappers, static content, fundamentals tables, market overview tiles. These ship zero client JavaScript.
- **Client Components** (`'use client'`): Use for anything interactive — TradingView charts, real-time price tickers, search input, AI chat interface, watchlist drag/sort, theme toggle, form interactions. TradingView charts specifically must use `next/dynamic` with `{ ssr: false }`.
- **Composition pattern**: Server Components fetch data and pass it as props to Client Component children. Wrap data-dependent sections in `<Suspense>` with skeleton fallbacks.

---

## Design System

### Design Reference: TradingView Markets Page

The visual design should closely follow the design language of **https://www.tradingview.com/markets/**. Study this page and replicate its design patterns:

**Layout patterns from TradingView to replicate:**
- Dense, data-rich card grid layout — multiple content sections tiled across the page (indices, stocks, movers, losers, earnings calendar, etc.)
- Cards with subtle borders and slightly elevated surface colors against the page background
- Compact data rows inside cards — each row shows a symbol logo/icon, ticker, company name, price, and change percentage in a tight horizontal layout
- Section headers with "See all →" links for drill-down
- Horizontal pill/tab selectors for filtering within sections (e.g., "Regular hours / Pre-market / After-hours")
- Sparkline mini-charts inline with data rows
- Color-coded price changes: green for positive, red for negative — used everywhere consistently

**Typography patterns:**
- Clean sans-serif font (Inter or similar)
- Monospace or tabular-number font for all financial figures to ensure digit alignment
- Small, dense text — TradingView uses 12-14px for most data, larger only for section headers
- Minimal font weight variation — regular weight for data, semi-bold for headers and tickers

**Color & theme patterns (dark mode default):**
- Very dark background (near-black, ~`#131722` or `#0a0a0f`)
- Slightly lighter card/surface color (~`#1e222d` or `#111118`)
- Subtle, low-contrast borders between elements (~`#2a2e39`)
- Bright blue for primary actions and links (~`#2962FF`)
- Green (`#22c55e`) for price up / positive change
- Red (`#ef4444`) for price down / negative change
- Muted gray for secondary text and labels
- High information density — minimal whitespace, compact spacing

**Component patterns:**
- Symbol search with dropdown results showing ticker, company name, exchange
- Horizontal scrollable sections on mobile
- Hover states that subtly highlight rows
- Sticky headers on scrollable data tables
- Loading: skeleton placeholders that match the exact dimensions of the final content

**Key principle:** TradingView's design is **information-dense, professional, and dark-mode-first**. Every pixel serves a purpose. Avoid decorative elements, large padding, or "startup-y" aesthetics. This should feel like a professional trading terminal, not a consumer app.

### Responsive Behavior

- **Desktop (>1024px):** Persistent sidebar; multi-column card grid; split-pane chart + insights on stock detail
- **Tablet (768-1024px):** Collapsible sidebar overlay; two-column grid
- **Mobile (<768px):** Bottom navigation instead of sidebar; single column; full-width chart; stacked panels

---

## Performance Guidance

- Use Server Components for all above-fold, non-interactive content
- Dynamically import heavy libraries (TradingView charts, react-markdown) — don't include them in the main bundle
- Use `next/font/google` for self-hosted fonts with `font-display: swap`
- Use `<Suspense>` with skeleton fallbacks everywhere data is being fetched
- Cache financial data API responses aggressively — ISR for public stock pages (revalidate 60s during market hours, 3600s after close)
- Prefetch visible `<Link>` targets (Next.js does this automatically)
- Target: LCP < 2.5s, chart render < 1s after data received, AI first token < 2s

---

## Error & Loading Patterns (General Guidance)

- Every data-dependent section should have a skeleton placeholder that matches the final layout dimensions
- If a financial data API fails, show the most recent cached data with a subtle "Data may be delayed" indicator — don't show an empty state or error page
- If an AI research query fails, show a simple retry prompt — "Research couldn't complete. Try again."
- If the user hits their local rate limit, inform them clearly
- Use toast notifications (shadcn/ui Sonner) for transient feedback: success (green), error (red), info (blue). Auto-dismiss after 5 seconds.
- Never show raw error messages or stack traces to the user