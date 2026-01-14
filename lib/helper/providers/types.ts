import "server-only";

export type ProviderName = "auto" | "openai" | "gemini" | "anthropic" | "local";
export type HelperMode = "chat" | "copy" | "summary";
export type MessageStatus = "streaming" | "done" | "error" | "cancelled";

export type ProviderResponse = {
  text: string;
  tokensIn: number;
  tokensOut: number;
  provider: Exclude<ProviderName, "auto">;
};

/** Streaming chunk yielded by provider adapters */
export type StreamChunk = {
  /** Text delta (partial content) */
  delta?: string;
  /** Whether stream is complete */
  done?: boolean;
  /** Usage stats (only on done) */
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  /** Provider that handled the request */
  provider?: Exclude<ProviderName, "auto">;
  /** Error message if something went wrong */
  error?: string;
};

/** Input for streaming adapters */
export type StreamInput = {
  prompt: string;
  mode: HelperMode;
  signal?: AbortSignal;
  maxTokens?: number;
};

/** Streaming adapter interface */
export type StreamingAdapter = (
  input: StreamInput
) => AsyncGenerator<StreamChunk, void, unknown>;
