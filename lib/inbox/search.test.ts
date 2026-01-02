import { buildMessageSearchQuery, mergeConversationIds } from "@/lib/inbox/search";

function assertEqual<T>(label: string, actual: T, expected: T) {
  if (actual !== expected) {
    throw new Error(`${label} expected=${String(expected)} actual=${String(actual)}`);
  }
}

function assertArrayEqual(label: string, actual: string[], expected: string[]) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) {
    throw new Error(`${label} expected=${b} actual=${a}`);
  }
}

assertEqual("trimmed query", buildMessageSearchQuery("  hello   world "), "hello world");
assertEqual("empty query", buildMessageSearchQuery("   "), null);

const merged = mergeConversationIds(["c1", "c2"], ["c2", "c3"], null, ["c3", "c4"]);
assertArrayEqual("merge ids", merged, ["c1", "c2", "c3", "c4"]);
