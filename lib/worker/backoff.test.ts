import { nextBackoffMs } from "@/lib/worker/backoff";

function assertEqual<T>(label: string, actual: T, expected: T) {
  if (actual !== expected) {
    throw new Error(`${label} expected=${String(expected)} actual=${String(actual)}`);
  }
}

const options = { baseMinutes: 2, maxMinutes: 30, jitterRatio: 0.3, randomFn: () => 0 };
assertEqual("attempt 1", nextBackoffMs(1, options), 120000);
assertEqual("attempt 2", nextBackoffMs(2, options), 240000);
assertEqual("attempt 3", nextBackoffMs(3, options), 480000);
assertEqual("attempt 4", nextBackoffMs(4, options), 960000);
