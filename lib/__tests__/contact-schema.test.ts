import { describe, it, expect } from "vitest";
import {
  contactSchema,
  contactTopics,
  budgetRanges,
} from "../validation/contact";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
describe("contactTopics", () => {
  it("has expected topics", () => {
    expect(contactTopics).toContain("Partnership");
    expect(contactTopics).toContain("Product Inquiry");
    expect(contactTopics).toContain("Support");
    expect(contactTopics).toContain("Other");
  });

  it("has 4 topics", () => {
    expect(contactTopics).toHaveLength(4);
  });
});

describe("budgetRanges", () => {
  it("has 5 ranges", () => {
    expect(budgetRanges).toHaveLength(5);
  });

  it("contains Indonesian Rupiah ranges", () => {
    expect(budgetRanges.some((r) => r.includes("Rp"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// contactSchema
// ---------------------------------------------------------------------------
describe("contactSchema", () => {
  const validContact = {
    name: "John Doe",
    email: "john@example.com",
    topic: "Partnership" as const,
    message: "I want to discuss a potential partnership opportunity.",
  };

  it("accepts valid contact form", () => {
    const data = contactSchema.parse(validContact);
    expect(data.name).toBe("John Doe");
    expect(data.email).toBe("john@example.com");
    expect(data.topic).toBe("Partnership");
  });

  it("accepts optional company field", () => {
    const data = contactSchema.parse({ ...validContact, company: "Acme Inc" });
    expect(data.company).toBe("Acme Inc");
  });

  it("accepts optional budgetRange", () => {
    const data = contactSchema.parse({
      ...validContact,
      budgetRange: "Rp 5-25 million",
    });
    expect(data.budgetRange).toBe("Rp 5-25 million");
  });

  it("rejects name too short (< 3 chars)", () => {
    expect(() =>
      contactSchema.parse({ ...validContact, name: "Ab" })
    ).toThrow("3 characters");
  });

  it("rejects name too long (> 100 chars)", () => {
    expect(() =>
      contactSchema.parse({ ...validContact, name: "A".repeat(101) })
    ).toThrow("too long");
  });

  it("rejects invalid email", () => {
    expect(() =>
      contactSchema.parse({ ...validContact, email: "not-an-email" })
    ).toThrow("invalid");
  });

  it("rejects invalid topic", () => {
    expect(() =>
      contactSchema.parse({ ...validContact, topic: "Invalid Topic" })
    ).toThrow();
  });

  it("rejects message too short (< 10 chars)", () => {
    expect(() =>
      contactSchema.parse({ ...validContact, message: "Hi" })
    ).toThrow("10 characters");
  });

  it("rejects message too long (> 2000 chars)", () => {
    expect(() =>
      contactSchema.parse({ ...validContact, message: "A".repeat(2001) })
    ).toThrow("too long");
  });

  it("rejects invalid budgetRange", () => {
    expect(() =>
      contactSchema.parse({ ...validContact, budgetRange: "1 million dollars" })
    ).toThrow("invalid");
  });

  it("accepts empty budgetRange", () => {
    const data = contactSchema.parse({ ...validContact, budgetRange: "" });
    expect(data.budgetRange).toBe("");
  });

  it("allows honeypot website field", () => {
    const data = contactSchema.parse({ ...validContact, website: "" });
    expect(data.website).toBe("");
  });
});
