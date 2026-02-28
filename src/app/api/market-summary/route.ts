import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { cached, TTL } from "@/lib/api/cache";

interface SummaryInput {
  indices: { name: string; value: number; changePct: number }[];
  gainers: { symbol: string; changePct: number }[];
  losers: { symbol: string; changePct: number }[];
  sectors: { sector: string; changesPercentage: number }[];
  news: { title: string }[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SummaryInput;

    if (!body.indices?.length) {
      return NextResponse.json({
        summary: null,
        sentiment: "neutral",
        generatedAt: new Date().toISOString(),
      });
    }

    const summary = await cached("market-summary", TTL.MARKET_SUMMARY, async () => {
      const indexSummary = body.indices
        .map((i) => `${i.name}: ${i.value.toLocaleString()} (${i.changePct >= 0 ? "+" : ""}${i.changePct.toFixed(2)}%)`)
        .join(", ");

      const topGainers = body.gainers
        .slice(0, 3)
        .map((g) => `${g.symbol} +${g.changePct.toFixed(1)}%`)
        .join(", ");

      const topLosers = body.losers
        .slice(0, 3)
        .map((l) => `${l.symbol} ${l.changePct.toFixed(1)}%`)
        .join(", ");

      const sectorSummary = body.sectors
        .slice(0, 5)
        .map((s) => `${s.sector}: ${s.changesPercentage >= 0 ? "+" : ""}${s.changesPercentage.toFixed(2)}%`)
        .join(", ");

      const newsHeadlines = body.news
        ?.slice(0, 5)
        .map((n) => n.title)
        .join("; ") || "No headlines available";

      const { text } = await generateText({
        model: anthropic("claude-sonnet-4-6"),
        system: "You are a financial market analyst. You respond ONLY with a JSON object. No markdown, no explanation, no analysis steps.",
        prompt: `Write a 2 sentence market summary from this data. Be concise and direct. Respond with ONLY this JSON format, nothing else:
{"summary":"your 2 sentence summary here","sentiment":"bullish or bearish or neutral"}

Rules:
- Maximum 2 sentences, under 150 words
- Do NOT mention individual stock tickers or company names
- Focus on the dominant market theme and overall sentiment

Indices: ${indexSummary}
Sectors: ${sectorSummary}
Headlines: ${newsHeadlines}`,
        maxOutputTokens: 200,
      });

      // Extract JSON even if model wraps it in markdown or extra text
      const jsonMatch = text.match(/\{[\s\S]*"summary"[\s\S]*"sentiment"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          const sentiment = ["bullish", "bearish", "neutral"].includes(parsed.sentiment)
            ? parsed.sentiment
            : "neutral";
          return {
            summary: String(parsed.summary).slice(0, 1000),
            sentiment: sentiment as "bullish" | "bearish" | "neutral",
            generatedAt: new Date().toISOString(),
          };
        } catch { /* fall through */ }
      }

      // Fallback: use the raw text as summary, strip any JSON artifacts
      const cleanText = text.replace(/[{}"\n]/g, "").replace(/summary:|sentiment:\w+/gi, "").trim();
      return {
        summary: cleanText.slice(0, 1000) || "Market summary unavailable.",
        sentiment: "neutral" as const,
        generatedAt: new Date().toISOString(),
      };
    });

    return NextResponse.json(summary);
  } catch (err) {
    console.error("[market-summary] Error:", err);
    return NextResponse.json({
      summary: "Unable to generate market summary at this time.",
      sentiment: "neutral",
      generatedAt: new Date().toISOString(),
    });
  }
}
