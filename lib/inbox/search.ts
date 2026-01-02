export function buildMessageSearchQuery(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\s+/g, " ");
}

export function mergeConversationIds(...lists: Array<string[] | null | undefined>) {
  const seen = new Set<string>();
  const merged: string[] = [];
  lists.forEach((list) => {
    (list ?? []).forEach((id) => {
      if (!id || seen.has(id)) return;
      seen.add(id);
      merged.push(id);
    });
  });
  return merged;
}
