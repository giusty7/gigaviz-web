import "server-only";

import { identityFallback } from "../persona";
import { callAnthropic } from "@/lib/helper/providers/anthropic";
import { callGemini } from "@/lib/helper/providers/gemini";
import { callLocalProvider } from "@/lib/helper/providers/local";
import { callOpenAI } from "@/lib/helper/providers/openai";
import { HelperMode, ProviderName, ProviderResponse } from "@/lib/helper/providers/types";

function buildPrompt(mode: HelperMode, content: string) {
  const trimmed = content.trim();
  if (!trimmed) return "Please provide content to process.";
  switch (mode) {
    case "copy":
      return `Rewrite this text to be clear and concise:\n${trimmed}`;
    case "summary":
      return `Summarize the following content in bullet points:\n${trimmed}`;
    default:
      return trimmed;
  }
}

function availableProviders(): ProviderName[] {
  const list: ProviderName[] = [];
  if (process.env.OPENAI_API_KEY) list.push("openai");
  if (process.env.ANTHROPIC_API_KEY) list.push("anthropic");
  if (process.env.GEMINI_API_KEY) list.push("gemini");
  list.push("local");
  return list;
}

export async function runHelperModel(args: {
  content: string;
  mode: HelperMode;
  provider: ProviderName;
}): Promise<ProviderResponse> {
  const identityAnswer = identityFallback(args.content);
  if (identityAnswer) {
    return {
      text: identityAnswer,
      tokensIn: 0,
      tokensOut: 0,
      provider: "local",
    };
  }

  const prompt = buildPrompt(args.mode, args.content);
  const candidates = args.provider === "auto" ? availableProviders() : [args.provider];

  for (const provider of candidates) {
    try {
      if (provider === "openai") return await callOpenAI(prompt);
      if (provider === "anthropic") return await callAnthropic(prompt);
      if (provider === "gemini") return await callGemini(prompt);
      if (provider === "local") return await callLocalProvider(prompt);
    } catch {
      continue;
    }
  }

  // Final fallback
  return callLocalProvider(prompt);
}
