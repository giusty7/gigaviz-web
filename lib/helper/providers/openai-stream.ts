import "server-only";

import { GV_SYSTEM_PROMPT } from "../persona";
import type { StreamChunk, StreamInput } from "./types";

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

/**
 * OpenAI streaming adapter using native fetch with SSE parsing.
 */
export async function* streamOpenAI(input: StreamInput): AsyncGenerator<StreamChunk, void, unknown> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    yield { error: "OPENAI_API_KEY not configured", done: true };
    return;
  }

  const body = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system" as const, content: GV_SYSTEM_PROMPT },
      { role: "user" as const, content: input.prompt },
    ],
    max_tokens: input.maxTokens ?? 1024,
    temperature: 0.4,
    stream: true,
    stream_options: { include_usage: true },
  };

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: input.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      yield { done: true };
      return;
    }
    yield { error: "Failed to connect to OpenAI", done: true };
    return;
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    yield { error: `OpenAI error: ${response.status} - ${errorText.slice(0, 100)}`, done: true };
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    yield { error: "No response body", done: true };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (!trimmed.startsWith("data: ")) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            yield { delta, provider: "openai" };
          }
          // Capture usage from final chunk
          if (json.usage) {
            inputTokens = json.usage.prompt_tokens ?? 0;
            outputTokens = json.usage.completion_tokens ?? 0;
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      yield { done: true };
      return;
    }
    throw err;
  } finally {
    reader.releaseLock();
  }

  // Final usage estimation if not provided
  if (!inputTokens) inputTokens = estimateTokens(input.prompt);
  if (!outputTokens) outputTokens = estimateTokens(fullText);

  yield {
    done: true,
    provider: "openai",
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
    },
  };
}
