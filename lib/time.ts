export function formatRelativeTime(input?: string | Date | null): string {
  if (!input) return "Belum ada";
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "Belum ada";
  const now = new Date().getTime();
  const diffMs = now - date.getTime();
  if (diffMs < 0) return "Baru saja";
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Baru saja";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} jam lalu`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} hari lalu`;
}

export function maskId(value?: string | null): string {
  if (!value) return "Belum diatur";
  const trimmed = value.trim();
  if (trimmed.length <= 6) return trimmed;
  return `...${trimmed.slice(-6)}`;
}
