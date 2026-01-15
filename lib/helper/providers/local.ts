import "server-only";

import { buildOllamaChatBody, getOllamaEndpoint, LOCAL_OFFLINE_ERROR } from "./local-shared";
import { ProviderResponse } from "./types";

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

type OllamaChatResponse = {
  message?: { content?: string };
  error?: string;
  eval_count?: number;
  prompt_eval_count?: number;
};

const OLLAMA_ENDPOINT = getOllamaEndpoint();

export async function callLocalProvider(prompt: string): Promise<ProviderResponse> {
  const body = buildOllamaChatBody(prompt, false);

  let response: Response;
  try {
    response = await fetch(OLLAMA_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw err;
    }
    throw new Error(LOCAL_OFFLINE_ERROR);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Ollama error: ${response.status} - ${text.slice(0, 120) || "Unknown error"}`);
  }

  const json = (await response.json().catch(() => ({}))) as OllamaChatResponse;

  if (json.error) {
    throw new Error(json.error);
  }

  const text = json.message?.content?.trim() ?? "";
  const tokensIn = json.prompt_eval_count ?? estimateTokens(prompt);
  const tokensOut = json.eval_count ?? estimateTokens(text);

  return {
    text,
    tokensIn,
    tokensOut,
    provider: "local",
  };
}
