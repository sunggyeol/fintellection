import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { agentTools } from "@/lib/ai/tools";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { getChatModel } from "@/lib/ai/model";
import { headers } from "next/headers";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") ?? "127.0.0.1";

    const { allowed, remaining, resetIn } = checkRateLimit(ip);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded", resetIn }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const messages = body.messages;

    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: messages array required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const modelMessages = await convertToModelMessages(messages, {
      tools: agentTools,
      ignoreIncompleteToolCalls: true,
    });

    const result = streamText({
      model: getChatModel(),
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      maxOutputTokens: 24576,
      temperature: 0.6,
      topP: 1,
      presencePenalty: 0,
      frequencyPenalty: 0,
      tools: agentTools,
      stopWhen: stepCountIs(10),
    });

    return result.toUIMessageStreamResponse({
      headers: {
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  } catch (error) {
    console.error("[Chat API Error]", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
