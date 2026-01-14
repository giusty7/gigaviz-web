import "server-only";

export type ProviderName = "auto" | "openai" | "gemini" | "anthropic" | "local";
export type HelperMode = "chat" | "copy" | "summary";

export type ProviderResponse = {
  text: string;
  tokensIn: number;
  tokensOut: number;
  provider: Exclude<ProviderName, "auto">;
};
