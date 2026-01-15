import "server-only";

import { GV_SYSTEM_PROMPT } from "../persona";
import type { StreamChunk, StreamInput } from "./types";

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

/**
 * Gemini streaming adapter using native fetch with SSE parsing.
 */
export async function* streamGemini(input: StreamInput): AsyncGenerator<StreamChunk, void, unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    yield { error: "GEMINI_API_KEY not configured", done: true };
    return;
  }

  const body = {
    systemInstruction: {
      role: "system",
      parts: [{ text: GV_SYSTEM_PROMPT }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: input.prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: input.maxTokens ?? 1024,
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${apiKey}&alt=sse`;

  let response: Response;
  try {
    response = await fetch(url, {
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
    yield { error: "Failed to connect to Gemini", done: true };
    return;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown error");
    yield { error: `Gemini error: ${response.status} - ${text.slice(0, 100)}`, done: true };
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
          const parts = json.candidates?.[0]?.content?.parts;
          if (parts && Array.isArray(parts)) {
            for (const part of parts) {
              if (part.text) {
                fullText += part.text;
                yield { delta: part.text, provider: "gemini" };
              }
            }
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

  const inputTokens = estimateTokens(input.prompt);
  const outputTokens = estimateTokens(fullText);

  yield {
    done: true,
    provider: "gemini",
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
    },
  };
}
