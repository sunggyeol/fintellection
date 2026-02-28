import { tool, type ToolSet } from "ai";
import { z } from "zod";
import {
  getStockQuote,
  getStockNews,
  getCompanyProfile,
  getKeyMetrics,
  getFredSeries,
  getFredSeriesInfo,
} from "@/lib/api/provider-chain";
import { cached, TTL } from "@/lib/api/cache";

export const agentTools: ToolSet = {
  financial_data: tool({
    description:
      "Fetch structured financial data: stock quotes, fundamentals, key metrics, historical prices, and company news. Use for any specific financial data lookup.",
    inputSchema: z.object({
      symbol: z.string().describe("Stock ticker symbol, e.g. AAPL, NVDA"),
      dataType: z
        .enum(["quote", "fundamentals", "metrics", "news", "profile"])
        .describe("Type of financial data to retrieve"),
    }),
    execute: async ({ symbol, dataType }) => {
      try {
        switch (dataType) {
          case "quote": {
            const quote = await getStockQuote(symbol);
            return quote
              ? { success: true, data: quote, dataDate: new Date().toISOString() }
              : { success: false, error: "Quote not available" };
          }
          case "fundamentals":
          case "metrics": {
            const metrics = await getKeyMetrics(symbol);
            return { success: true, data: metrics, dataDate: new Date().toISOString() };
          }
          case "news": {
            const news = await getStockNews(symbol);
            return { success: true, data: news.slice(0, 5), dataDate: new Date().toISOString() };
          }
          case "profile": {
            const profile = await getCompanyProfile(symbol);
            return { success: true, data: profile, dataDate: new Date().toISOString() };
          }
          default:
            return { success: false, error: "Unknown data type" };
        }
      } catch (e) {
        return { success: false, error: String(e) };
      }
    },
  }),

  web_search: tool({
    description:
      "Search the web for real-time financial news, analyst commentary, press releases, and recent developments. Use for current events and opinions.",
    inputSchema: z.object({
      query: z.string().describe("Search query, e.g. 'NVIDIA AI chip competition 2026'"),
      numResults: z.number().optional().default(5).describe("Number of results to return"),
    }),
    execute: async ({ query, numResults }) => {
      const apiKey = process.env.SERPER_API_KEY;
      if (!apiKey) {
        return { success: false, error: "Web search not configured" };
      }

      const cacheKey = `serper:${query.toLowerCase().trim()}:${numResults}`;
      return cached(cacheKey, TTL.SERPER, async () => {
        try {
          const res = await fetch("https://google.serper.dev/search", {
            method: "POST",
            headers: {
              "X-API-KEY": apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ q: query, num: numResults }),
          });

          if (!res.ok) throw new Error(`Serper API error: ${res.status}`);
          const data = await res.json();

          const results = (data.organic ?? []).slice(0, numResults).map(
            (r: { title: string; link: string; snippet: string; date?: string }) => ({
              title: r.title,
              url: r.link,
              snippet: r.snippet,
              date: r.date ?? null,
            })
          );

          return { success: true, results, searchDate: new Date().toISOString() };
        } catch (e) {
          return { success: false as const, error: String(e) };
        }
      });
    },
  }),

  rag_query: tool({
    description:
      "Search the knowledge base for previously indexed financial documents, SEC filings, earnings transcripts, and past research. Use for historical context and document retrieval.",
    inputSchema: z.object({
      query: z.string().describe("Semantic search query"),
      symbol: z.string().optional().describe("Filter by stock symbol"),
    }),
    execute: async ({ query, symbol }) => {
      return {
        success: true,
        results: [],
        message: "Knowledge base search available after Supabase pgvector is configured",
      };
    },
  }),

  calculator: tool({
    description:
      "Perform financial calculations: DCF valuation, CAGR, ratio analysis, compound interest, and custom formulas. Returns the result, formula used, and explanation.",
    inputSchema: z.object({
      calculationType: z
        .enum(["dcf", "cagr", "ratio", "compound_interest", "custom"])
        .describe("Type of calculation"),
      inputs: z
        .record(z.string(), z.number())
        .describe("Named numeric inputs for the calculation, e.g. {beginValue: 100, endValue: 150, years: 5}"),
    }),
    execute: async ({ calculationType, inputs }) => {
      try {
        const get = (key: string) => inputs[key] as number | undefined;
        switch (calculationType) {
          case "cagr": {
            const beginValue = get("beginValue");
            const endValue = get("endValue");
            const years = get("years");
            if (!beginValue || !endValue || !years) {
              return { success: false, error: "CAGR requires beginValue, endValue, years" };
            }
            const cagr = (Math.pow(endValue / beginValue, 1 / years) - 1) * 100;
            return {
              success: true,
              result: cagr,
              formula: `CAGR = (${endValue}/${beginValue})^(1/${years}) - 1`,
              explanation: `${cagr.toFixed(2)}% compound annual growth rate`,
            };
          }
          case "dcf": {
            const cashFlow = get("cashFlow");
            const growthRate = get("growthRate");
            const discountRate = get("discountRate");
            const terminalGrowth = get("terminalGrowth");
            const years = get("years");
            if (!cashFlow || !growthRate || !discountRate || !years) {
              return { success: false, error: "DCF requires cashFlow, growthRate, discountRate, years" };
            }
            let totalPV = 0;
            for (let i = 1; i <= years; i++) {
              const cf = cashFlow * Math.pow(1 + growthRate / 100, i);
              totalPV += cf / Math.pow(1 + discountRate / 100, i);
            }
            const lastCF = cashFlow * Math.pow(1 + growthRate / 100, years);
            const terminalValue =
              (lastCF * (1 + (terminalGrowth ?? 2) / 100)) /
              (discountRate / 100 - (terminalGrowth ?? 2) / 100);
            const pvTerminal = terminalValue / Math.pow(1 + discountRate / 100, years);
            return {
              success: true,
              result: totalPV + pvTerminal,
              formula: "Sum of discounted future cash flows + terminal value",
              explanation: `Intrinsic value: $${(totalPV + pvTerminal).toFixed(2)}`,
            };
          }
          case "ratio": {
            const keys = Object.keys(inputs);
            if (keys.length === 2) {
              const vals = Object.values(inputs);
              return {
                success: true,
                result: vals[0] / vals[1],
                formula: `${keys[0]} / ${keys[1]}`,
                explanation: `Ratio: ${(vals[0] / vals[1]).toFixed(4)}`,
              };
            }
            return { success: false, error: "Ratio requires exactly 2 inputs" };
          }
          default:
            return { success: false, error: "Calculation type not supported" };
        }
      } catch (e) {
        return { success: false, error: String(e) };
      }
    },
  }),

  sec_filing: tool({
    description:
      "Search and retrieve SEC EDGAR filings (10-K annual reports, 10-Q quarterly, 8-K current events). Use for official regulatory disclosures and financial statements.",
    inputSchema: z.object({
      query: z.string().describe("Company name or filing keyword"),
      formTypes: z
        .array(z.string())
        .optional()
        .default(["10-K", "10-Q"])
        .describe("SEC form types to search"),
    }),
    execute: async ({ query, formTypes }) => {
      const cacheKey = `sec:${query.toLowerCase()}:${formTypes.join(",")}`;
      return cached(cacheKey, TTL.SEC_FILING, async () => {
        try {
          const { searchFilings } = await import("@/lib/api/sec-edgar");
          const result = await searchFilings(query, formTypes, 5);
          const filings = result.hits.hits.map((hit) => ({
            id: hit._id,
            formType: hit._source.form_type ?? "Unknown",
            entityName: hit._source.entity_name ?? "Unknown",
            fileDate: hit._source.file_date ?? hit._source.display_date_filed ?? "Unknown",
            description: hit._source.file_description ?? "",
          }));
          return { success: true, filings, searchDate: new Date().toISOString() };
        } catch (e) {
          return { success: false as const, error: String(e) };
        }
      });
    },
  }),

  fred_data: tool({
    description:
      "Fetch macroeconomic data from the Federal Reserve (FRED). Covers interest rates, inflation, GDP, unemployment, yield curve, and volatility. Use for macro analysis and economic context.",
    inputSchema: z.object({
      seriesId: z
        .string()
        .describe(
          "FRED series ID. Common: FEDFUNDS (fed funds rate), CPIAUCSL (CPI), GDP, UNRATE (unemployment), DGS10 (10yr yield), DGS2 (2yr yield), T10Y2Y (yield curve), VIXCLS (VIX)"
        ),
      observationStart: z
        .string()
        .optional()
        .describe("Start date YYYY-MM-DD. Defaults to 1 year ago."),
      observationEnd: z
        .string()
        .optional()
        .describe("End date YYYY-MM-DD. Defaults to today."),
      frequency: z
        .enum(["d", "w", "bw", "m", "q", "sa", "a"])
        .optional()
        .describe("Data frequency: d=daily, w=weekly, m=monthly, q=quarterly, a=annual"),
      limit: z
        .number()
        .optional()
        .describe("Max observations to return. Default 100."),
    }),
    execute: async ({ seriesId, observationStart, observationEnd, frequency, limit }) => {
      try {
        const defaultStart = new Date(Date.now() - 365 * 86_400_000)
          .toISOString()
          .split("T")[0];

        const [observations, info] = await Promise.allSettled([
          getFredSeries(seriesId.toUpperCase(), {
            observationStart: observationStart ?? defaultStart,
            observationEnd,
            frequency,
            limit: limit ?? 100,
            sortOrder: "desc",
          }),
          getFredSeriesInfo(seriesId.toUpperCase()),
        ]);

        const data = observations.status === "fulfilled" ? observations.value : null;
        const meta = info.status === "fulfilled" ? info.value : null;

        if (!data) {
          return { success: false, error: `No data for FRED series ${seriesId}` };
        }

        return {
          success: true,
          series: {
            id: seriesId.toUpperCase(),
            title: meta?.title ?? seriesId,
            units: meta?.units ?? "Unknown",
            frequency: meta?.frequency ?? "Unknown",
            lastUpdated: meta?.last_updated ?? null,
          },
          observations: data.filter((d) => d.value !== null).slice(0, limit ?? 100),
          dataDate: new Date().toISOString(),
        };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    },
  }),
};
