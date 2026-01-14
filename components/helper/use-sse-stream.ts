"use client";

export type SSEEvent = {
  event: string;
  data: unknown;
};

/**
 * Parse SSE stream from fetch response.
 * Yields parsed events as they arrive.
 */
export async function* parseSSEStream(
  response: Response
): AsyncGenerator<SSEEvent, void, unknown> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "message";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();

        // Empty line indicates end of event
        if (!trimmed) {
          currentEvent = "message";
          continue;
        }

        // Event type
        if (trimmed.startsWith("event:")) {
          currentEvent = trimmed.slice(6).trim();
          continue;
        }

        // Data
        if (trimmed.startsWith("data:")) {
          const dataStr = trimmed.slice(5).trim();
          try {
            const data = JSON.parse(dataStr);
            yield { event: currentEvent, data };
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export type StreamingState = {
  isStreaming: boolean;
  content: string;
  error: string | null;
  assistantMessageId: string | null;
};
