import { anthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { wrapLanguageModel, type LanguageModel } from "ai";

const DEFAULT_GOOGLE_MODEL = "gemini-3-flash-preview";
const DEFAULT_ANTHROPIC_FALLBACK_MODEL = "claude-sonnet-4-6";

export function getChatModel(): LanguageModel {
  const fallbackModel = getAnthropicFallbackModel();

  try {
    const primaryModel = getGooglePrimaryModel();
    return fallbackModel
      ? wrapWithFallback(primaryModel, fallbackModel)
      : primaryModel;
  } catch (error) {
    if (fallbackModel) {
      console.warn(
        `[AI] Google primary model unavailable. Using Anthropic fallback (${DEFAULT_ANTHROPIC_FALLBACK_MODEL}).`,
        error
      );
      return fallbackModel;
    }
    throw error;
  }
}

function getGooglePrimaryModel() {
  const googleApiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_API_KEY;

  if (!googleApiKey) {
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY (or GOOGLE_API_KEY) is required for the primary Gemini model."
    );
  }

  const google = createGoogleGenerativeAI({
    apiKey: googleApiKey,
  });

  return google.chat(
    process.env.GOOGLE_MODEL ?? process.env.GEMINI_MODEL ?? DEFAULT_GOOGLE_MODEL
  );
}

function getAnthropicFallbackModel() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }

  return anthropic(
    process.env.ANTHROPIC_MODEL ?? DEFAULT_ANTHROPIC_FALLBACK_MODEL
  );
}

function wrapWithFallback(
  primaryModel: ReturnType<typeof getGooglePrimaryModel>,
  fallbackModel: ReturnType<typeof anthropic>
): LanguageModel {
  return wrapLanguageModel({
    model: primaryModel,
    middleware: {
      specificationVersion: "v3",
      wrapGenerate: async ({ doGenerate, params }) => {
        try {
          return await doGenerate();
        } catch (error) {
          console.warn(
            `[AI] Primary Gemini generate failed. Falling back to Anthropic (${DEFAULT_ANTHROPIC_FALLBACK_MODEL}).`,
            error
          );
          return fallbackModel.doGenerate(params);
        }
      },
      wrapStream: async ({ doStream, params }) => {
        try {
          return await doStream();
        } catch (error) {
          console.warn(
            `[AI] Primary Gemini stream failed. Falling back to Anthropic (${DEFAULT_ANTHROPIC_FALLBACK_MODEL}).`,
            error
          );
          return fallbackModel.doStream(params);
        }
      },
    },
  });
}
