import "server-only";

import { streamOpenAI } from "./openai-stream";
import { streamAnthropic } from "./anthropic-stream";
import { streamGemini } from "./gemini-stream";
import { streamLocal } from "./local-stream";
import type { HelperMode, ProviderName, StreamChunk, StreamInput } from "./types";

/** Build system prompt based on mode */
function buildPrompt(mode: HelperMode, content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return "Please provide content to process.";

  switch (mode) {
    case "copy":
      return `Rewrite this text to be clear, concise, and professional:\n\n${trimmed}`;
    case "summary":
      return `Summarize the following content in clear bullet points:\n\n${trimmed}`;
    default:
      return trimmed;
  }
}

/** Check which providers are available based on environment variables */
function availableProviders(): Exclude<ProviderName, "auto">[] {
  const list: Exclude<ProviderName, "auto">[] = [];
  if (process.env.OPENAI_API_KEY) list.push("openai");
  if (process.env.ANTHROPIC_API_KEY) list.push("anthropic");
  if (process.env.GEMINI_API_KEY) list.push("gemini");
  list.push("local"); // Always available as fallback
  return list;
}

/** Get the streaming adapter for a specific provider */
function getStreamingAdapter(provider: Exclude<ProviderName, "auto">) {
  switch (provider) {
    case "openai":
      return streamOpenAI;
    case "anthropic":
      return streamAnthropic;
    case "gemini":
      return streamGemini;
    case "local":
      return streamLocal;
  }
}

export type StreamHelperInput = {
  content: string;
  mode: HelperMode;
  provider: ProviderName;
  signal?: AbortSignal;
  maxTokens?: number;
};

/**
 * Stream helper model response.
 * Handles auto-selection and fallback between providers.
 */
export async function* streamHelperModel(
  args: StreamHelperInput
): AsyncGenerator<StreamChunk, void, unknown> {
  const prompt = buildPrompt(args.mode, args.content);
  const candidates = args.provider === "auto" ? availableProviders() : [args.provider];

  // Filter out providers that aren't configured
  const available = availableProviders();
  const validCandidates = candidates.filter((p) => available.includes(p));

  if (validCandidates.length === 0) {
    yield {
      error: "No AI provider is configured. Please set up API keys.",
      done: true,
    };
    return;
  }

  let lastError: string | undefined;

  for (const provider of validCandidates) {
    const adapter = getStreamingAdapter(provider);
    const input: StreamInput = {
      prompt,
      mode: args.mode,
      signal: args.signal,
      maxTokens: args.maxTokens,
    };

    let hasYieldedContent = false;

    try {
      for await (const chunk of adapter(input)) {
        // If we got an error and haven't yielded content yet, try next provider
        if (chunk.error && !hasYieldedContent) {
          lastError = chunk.error;
          break;
        }

        if (chunk.delta) {
          hasYieldedContent = true;
        }

        yield chunk;

        // If done, we're finished
        if (chunk.done) {
          return;
        }
      }

      // If we yielded content successfully, we're done
      if (hasYieldedContent) {
        return;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Unknown streaming error";
      continue;
    }
  }

  // All providers failed
  yield {
    error: lastError ?? "All providers failed",
    done: true,
  };
}

/** Export available providers for UI */
export { availableProviders };
