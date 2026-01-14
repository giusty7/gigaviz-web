import "server-only";

import { ProviderResponse } from "@/lib/helper/providers/types";

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

export async function callLocalProvider(prompt: string): Promise<ProviderResponse> {
  const response = `Draft (local): ${prompt.slice(0, 600)}`;
  return {
    text: response,
    tokensIn: estimateTokens(prompt),
    tokensOut: estimateTokens(response),
    provider: "local",
  };
}
