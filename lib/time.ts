export function formatRelativeTime(input?: string | Date | null): string {
  if (!input) return "Not available yet";
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "Not available yet";
  const now = new Date().getTime();
  const diffMs = now - date.getTime();
  if (diffMs < 0) return "Just now";
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
}

export function maskId(value?: string | null): string {
  if (!value) return "Not set yet";
  const trimmed = value.trim();
  if (trimmed.length <= 6) return trimmed;
  return `...${trimmed.slice(-6)}`;
}
