import { anthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

const DEFAULT_FIREWORKS_BASE_URL = "https://api.fireworks.ai/inference/v1";
const DEFAULT_FIREWORKS_MODEL = "accounts/fireworks/models/minimax-m2p5";
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

type LlmProvider = "fireworks" | "anthropic";

function parseProvider(): LlmProvider {
  const provider = process.env.LLM_PROVIDER?.toLowerCase() ?? "fireworks";

  if (provider === "fireworks" || provider === "anthropic") {
    return provider;
  }

  throw new Error(
    `Invalid LLM_PROVIDER "${provider}". Expected "fireworks" or "anthropic".`
  );
}

export function getChatModel(): LanguageModel {
  const provider = parseProvider();

  if (provider === "anthropic") {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic."
      );
    }
    return anthropic(DEFAULT_ANTHROPIC_MODEL);
  }

  if (!process.env.FIREWORKS_API_KEY) {
    throw new Error(
      "FIREWORKS_API_KEY is required when LLM_PROVIDER=fireworks."
    );
  }

  const fireworks = createOpenAI({
    name: "fireworks",
    apiKey: process.env.FIREWORKS_API_KEY,
    baseURL: process.env.FIREWORKS_BASE_URL ?? DEFAULT_FIREWORKS_BASE_URL,
  });

  return fireworks.chat(process.env.FIREWORKS_MODEL ?? DEFAULT_FIREWORKS_MODEL);
}
