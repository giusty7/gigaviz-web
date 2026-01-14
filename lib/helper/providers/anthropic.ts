import "server-only";

import { ProviderResponse } from "@/lib/helper/providers/types";

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

export async function callAnthropic(prompt: string): Promise<ProviderResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const body = {
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 320,
    messages: [{ role: "user", content: prompt }],
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic error: ${text}`);
  }

  const json = (await res.json()) as {
    content?: Array<{ text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const text = json.content?.[0]?.text?.trim() || "";
  return {
    text,
    tokensIn: json.usage?.input_tokens ?? estimateTokens(prompt),
    tokensOut: json.usage?.output_tokens ?? estimateTokens(text),
    provider: "anthropic",
  };
}
