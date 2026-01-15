import "server-only";

import { buildOllamaChatBody, getOllamaEndpoint, LOCAL_OFFLINE_ERROR } from "./local-shared";
import type { StreamChunk, StreamInput } from "./types";

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

type OllamaStreamChunk = {
  message?: { content?: string };
  done?: boolean;
  error?: string;
  eval_count?: number;
  prompt_eval_count?: number;
};

const OLLAMA_ENDPOINT = getOllamaEndpoint();

/**
 * Gigaviz AI (local) streaming adapter using Ollama.
 */
export async function* streamLocal(input: StreamInput): AsyncGenerator<StreamChunk, void, unknown> {
  const body = buildOllamaChatBody(input.prompt, true);

  let response: Response;
  try {
    response = await fetch(OLLAMA_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: input.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      yield { done: true };
      return;
    }

    yield { error: LOCAL_OFFLINE_ERROR, provider: "local", done: true };
    return;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    yield {
      error: `Ollama error: ${response.status} - ${text.slice(0, 120) || "Unknown error"}`,
      provider: "local",
      done: true,
    };
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    yield { error: "No response body from Ollama", provider: "local", done: true };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let promptTokens: number | null = null;
  let completionTokens: number | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const json = JSON.parse(trimmed) as OllamaStreamChunk;

          if (json.error) {
            yield { error: json.error, provider: "local", done: true };
            return;
          }

          const delta = json.message?.content;
          if (delta) {
            fullText += delta;
            yield { delta, provider: "local" };
          }

          if (json.done) {
            promptTokens = json.prompt_eval_count ?? promptTokens;
            completionTokens = json.eval_count ?? completionTokens;
          }
        } catch {
          // Skip malformed lines
        }
      }
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      yield { done: true };
      return;
    }
    yield { error: "Failed to read Ollama stream", provider: "local", done: true };
    return;
  } finally {
    reader.releaseLock();
  }

  const inputTokens = promptTokens ?? estimateTokens(input.prompt);
  const outputTokens = completionTokens ?? estimateTokens(fullText);

  yield {
    done: true,
    provider: "local",
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
    },
  };
}
