import { describe, it, expect } from "vitest";
import { computeFirstResponseAt, shouldSetFirstResponseAt } from "@/lib/inbox/first-response";

const ts = "2026-01-02T10:00:00.000Z";

describe("shouldSetFirstResponseAt", () => {
  it("returns true when firstResponseAt is missing", () => {
    expect(
      shouldSetFirstResponseAt({
        firstResponseAt: null,
        lastCustomerMessageAt: "2026-01-02T09:00:00.000Z",
      })
    ).toBe(true);
  });
});

describe("computeFirstResponseAt", () => {
  it("sets first response when missing", () => {
    expect(
      computeFirstResponseAt({
        firstResponseAt: null,
        lastCustomerMessageAt: "2026-01-02T09:00:00.000Z",
        messageTs: ts,
      })
    ).toBe(ts);
  });

  it("does not overwrite existing first response", () => {
    expect(
      computeFirstResponseAt({
        firstResponseAt: "2026-01-02T08:00:00.000Z",
        lastCustomerMessageAt: "2026-01-02T09:00:00.000Z",
        messageTs: ts,
      })
    ).toBe("2026-01-02T08:00:00.000Z");
  });

  it("returns null when no customer message exists", () => {
    expect(
      computeFirstResponseAt({
        firstResponseAt: null,
        lastCustomerMessageAt: null,
        messageTs: ts,
      })
    ).toBeNull();
  });
});
