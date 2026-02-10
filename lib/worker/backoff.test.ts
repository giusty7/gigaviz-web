import { describe, it, expect } from "vitest";
import { nextBackoffMs } from "@/lib/worker/backoff";

describe("nextBackoffMs", () => {
  const options = { baseMinutes: 2, maxMinutes: 30, jitterRatio: 0.3, randomFn: () => 0 };

  it("returns 120s for attempt 1", () => {
    expect(nextBackoffMs(1, options)).toBe(120000);
  });

  it("returns 240s for attempt 2", () => {
    expect(nextBackoffMs(2, options)).toBe(240000);
  });

  it("returns 480s for attempt 3", () => {
    expect(nextBackoffMs(3, options)).toBe(480000);
  });

  it("returns 960s for attempt 4", () => {
    expect(nextBackoffMs(4, options)).toBe(960000);
  });
});
