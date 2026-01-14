// Helper types for conversations and messages

export type HelperConversation = {
  id: string;
  title: string;
  messages: HelperMessage[];
  createdAt: string;
  updatedAt: string;
  lastSnippet?: string;
};

export type MessageStatus = "streaming" | "done" | "error" | "cancelled";

export type HelperMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  mode?: HelperMode;
  provider?: Exclude<HelperProvider, "auto">;
  status?: MessageStatus;
};

export type HelperMode = "chat" | "copy" | "summary";
export type HelperProvider = "auto" | "openai" | "gemini" | "anthropic" | "local";

export type HelperSettings = {
  allowAutomation: boolean;
  monthlyCap: number;
  dailySpent: number;
};

// Helper for generating IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// Relative time formatting
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// localStorage helpers
const STORAGE_KEY_PREFIX = "gigaviz_helper_";

export function getStorageKey(workspaceSlug: string, key: string): string {
  return `${STORAGE_KEY_PREFIX}${workspaceSlug}_${key}`;
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable
  }
}
// Conversation-specific helpers
export function loadConversations(storageKey: string): HelperConversation[] {
  return loadFromStorage<HelperConversation[]>(storageKey, []);
}

export function saveConversations(storageKey: string, conversations: HelperConversation[]): void {
  saveToStorage(storageKey, conversations);
}