import "server-only";

import { GV_SYSTEM_PROMPT } from "../persona";
import { ProviderResponse } from "@/lib/helper/providers/types";

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

export async function callOpenAI(prompt: string): Promise<ProviderResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not set");
  }

  const body = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system" as const, content: GV_SYSTEM_PROMPT },
      { role: "user" as const, content: prompt },
    ],
    max_tokens: 320,
    temperature: 0.4,
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error: ${text}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const text = json.choices?.[0]?.message?.content?.trim() || "";
  return {
    text,
    tokensIn: json.usage?.prompt_tokens ?? estimateTokens(prompt),
    tokensOut: json.usage?.completion_tokens ?? estimateTokens(text),
    provider: "openai",
  };
}
