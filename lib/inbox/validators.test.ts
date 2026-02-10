import { describe, it, expect } from "vitest";
import { parsePriority, parseTicketStatus } from "@/lib/inbox/validators";

describe("parseTicketStatus", () => {
  it("returns valid status for 'open'", () => {
    expect(parseTicketStatus("open")).toBe("open");
  });

  it("returns null for invalid status 'closed'", () => {
    expect(parseTicketStatus("closed")).toBeNull();
  });
});

describe("parsePriority", () => {
  it("returns valid priority for 'urgent'", () => {
    expect(parsePriority("urgent")).toBe("urgent");
  });

  it("returns null for invalid priority 'lowest'", () => {
    expect(parsePriority("lowest")).toBeNull();
  });
});
