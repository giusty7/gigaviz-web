import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatRelativeTime, maskId } from "../time";

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-08T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it('returns "Not available yet" for null', () => {
    expect(formatRelativeTime(null)).toBe("Not available yet");
  });

  it('returns "Not available yet" for undefined', () => {
    expect(formatRelativeTime(undefined)).toBe("Not available yet");
  });

  it('returns "Not available yet" for invalid date string', () => {
    expect(formatRelativeTime("not-a-date")).toBe("Not available yet");
  });

  it('returns "Just now" for future dates', () => {
    expect(formatRelativeTime("2026-02-09T12:00:00Z")).toBe("Just now");
  });

  it('returns "Just now" for < 60 seconds ago', () => {
    const thirtySecAgo = new Date("2026-02-08T11:59:30Z").toISOString();
    expect(formatRelativeTime(thirtySecAgo)).toBe("Just now");
  });

  it("returns minutes for < 60 min ago", () => {
    const fiveMinAgo = new Date("2026-02-08T11:55:00Z").toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe("5 min ago");
  });

  it("returns hours for < 24h ago", () => {
    const threeHrAgo = new Date("2026-02-08T09:00:00Z").toISOString();
    expect(formatRelativeTime(threeHrAgo)).toBe("3 hr ago");
  });

  it("returns singular day for exactly 1 day ago", () => {
    const oneDayAgo = new Date("2026-02-07T12:00:00Z").toISOString();
    expect(formatRelativeTime(oneDayAgo)).toBe("1 day ago");
  });

  it("returns plural days for > 1 day", () => {
    const sevenDaysAgo = new Date("2026-02-01T12:00:00Z").toISOString();
    expect(formatRelativeTime(sevenDaysAgo)).toBe("7 days ago");
  });

  it("accepts Date object input", () => {
    const date = new Date("2026-02-08T11:55:00Z");
    expect(formatRelativeTime(date)).toBe("5 min ago");
  });
});

describe("maskId", () => {
  it('returns "Not set yet" for null', () => {
    expect(maskId(null)).toBe("Not set yet");
  });

  it('returns "Not set yet" for undefined', () => {
    expect(maskId(undefined)).toBe("Not set yet");
  });

  it("returns full string if <= 6 characters", () => {
    expect(maskId("abc")).toBe("abc");
    expect(maskId("123456")).toBe("123456");
  });

  it("masks longer strings to last 6 chars", () => {
    expect(maskId("abcdefghijk")).toBe("...fghijk");
  });

  it("trims whitespace before measuring", () => {
    // "  abc  " gets trimmed to "abc" (3 chars ≤ 6), so returns trimmed value
    expect(maskId("  abc  ")).toBe("abc");
  });
});
