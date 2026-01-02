type BackoffOptions = {
  baseMinutes?: number;
  maxMinutes?: number;
  jitterRatio?: number;
  randomFn?: () => number;
};

export function nextBackoffMs(attempt: number, options: BackoffOptions = {}) {
  const baseMinutes = options.baseMinutes ?? 2;
  const maxMinutes = options.maxMinutes ?? 30;
  const jitterRatio = options.jitterRatio ?? 0.3;
  const randomFn = options.randomFn ?? Math.random;

  if (!Number.isFinite(attempt) || attempt <= 0) return baseMinutes * 60_000;
  const minutes = Math.min(maxMinutes, baseMinutes * Math.pow(2, attempt - 1));
  const jitter = minutes * jitterRatio * randomFn();
  return Math.round((minutes + jitter) * 60_000);
}
