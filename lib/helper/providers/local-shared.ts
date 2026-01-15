import "server-only";

import { GV_SYSTEM_PROMPT } from "../persona";

const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "gemma3:4b";
const DEFAULT_OLLAMA_URL = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";

export function getOllamaEndpoint(): string {
  return `${DEFAULT_OLLAMA_URL.replace(/\/$/, "")}/api/chat`;
}

export function buildOllamaChatBody(prompt: string, stream = true) {
  return {
    model: DEFAULT_OLLAMA_MODEL,
    stream,
    messages: [
      { role: "system" as const, content: GV_SYSTEM_PROMPT },
      { role: "user" as const, content: prompt },
    ],
  };
}

export const LOCAL_OFFLINE_ERROR =
  "Gigaviz AI (Local) is offline. Start Ollama at http://127.0.0.1:11434.";
