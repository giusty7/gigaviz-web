import "server-only";

import { GV_SYSTEM_PROMPT } from "../persona";
import type { StreamChunk, StreamInput } from "./types";

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

/**
 * Anthropic streaming adapter using native fetch with SSE parsing.
 */
export async function* streamAnthropic(input: StreamInput): AsyncGenerator<StreamChunk, void, unknown> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    yield { error: "ANTHROPIC_API_KEY not configured", done: true };
    return;
  }

  const body = {
    model: "claude-3-5-sonnet-20241022",
    max_tokens: input.maxTokens ?? 1024,
    system: GV_SYSTEM_PROMPT,
    messages: [{ role: "user" as const, content: input.prompt }],
    stream: true,
  };

  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: input.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      yield { done: true };
      return;
    }
    yield { error: "Failed to connect to Anthropic", done: true };
    return;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown error");
    yield { error: `Anthropic error: ${response.status} - ${text.slice(0, 100)}`, done: true };
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
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          
          // Handle different event types
          if (json.type === "content_block_delta") {
            const delta = json.delta?.text;
            if (delta) {
              fullText += delta;
              yield { delta, provider: "anthropic" };
            }
          } else if (json.type === "message_start") {
            inputTokens = json.message?.usage?.input_tokens ?? 0;
          } else if (json.type === "message_delta") {
            outputTokens = json.usage?.output_tokens ?? 0;
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
    provider: "anthropic",
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
    },
  };
}
