import { describe, it, expect } from "vitest";
import {
  normalizePhone,
  getWhatsAppId,
  validatePhone,
  formatPhoneDisplay,
  maskPhone,
  parseBulkPaste,
  parseCSV,
  extractPhoneFromRow,
  validateTag,
  sanitizeTags,
} from "../meta/wa-contacts-utils";

// ---------------------------------------------------------------------------
// normalizePhone
// ---------------------------------------------------------------------------
describe("normalizePhone", () => {
  it("strips non-digit characters", () => {
    expect(normalizePhone("+62 812-3456-7890")).toBe("6281234567890");
  });

  it("converts 0-prefix Indonesian to 62", () => {
    expect(normalizePhone("08123456789")).toBe("628123456789");
  });

  it("adds 62 prefix if starts with 8", () => {
    expect(normalizePhone("812345678")).toBe("62812345678");
  });

  it("keeps numbers already starting with 62", () => {
    expect(normalizePhone("6281234567890")).toBe("6281234567890");
  });

  it("handles international non-Indonesian numbers", () => {
    // US number — starts with 1, should pass through
    expect(normalizePhone("+1 555-123-4567")).toBe("15551234567");
  });

  it("handles empty string", () => {
    expect(normalizePhone("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// getWhatsAppId
// ---------------------------------------------------------------------------
describe("getWhatsAppId", () => {
  it("returns wa_id and e164 for Indonesian number", () => {
    const result = getWhatsAppId("+62 812-3456-7890");
    expect(result.wa_id).toBe("6281234567890");
    expect(result.e164).toBe("+6281234567890");
  });

  it("normalizes 0-prefix before returning", () => {
    const result = getWhatsAppId("08123456789");
    expect(result.wa_id).toBe("628123456789");
    expect(result.e164).toBe("+628123456789");
  });
});

// ---------------------------------------------------------------------------
// validatePhone
// ---------------------------------------------------------------------------
describe("validatePhone", () => {
  it("accepts valid Indonesian number", () => {
    const result = validatePhone("+62 812-3456-7890");
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe("6281234567890");
    expect(result.wa_id).toBe("6281234567890");
    expect(result.e164).toBe("+6281234567890");
  });

  it("rejects empty input", () => {
    const result = validatePhone("");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Phone number is required");
  });

  it("rejects whitespace-only input", () => {
    const result = validatePhone("   ");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Phone number is required");
  });

  it("rejects too-short number", () => {
    const result = validatePhone("123");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Phone number too short");
  });

  it("rejects too-long number", () => {
    const result = validatePhone("1234567890123456789");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Phone number too long");
  });

  it("validates 0-prefix Indonesian number", () => {
    const result = validatePhone("081234567890");
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe("6281234567890");
  });
});

// ---------------------------------------------------------------------------
// formatPhoneDisplay
// ---------------------------------------------------------------------------
describe("formatPhoneDisplay", () => {
  it("formats Indonesian number", () => {
    expect(formatPhoneDisplay("6281234567890")).toBe("+62 812-3456-7890");
  });

  it("returns empty string for empty input", () => {
    expect(formatPhoneDisplay("")).toBe("");
  });

  it("formats generic international number", () => {
    const formatted = formatPhoneDisplay("15551234567");
    expect(formatted).toContain("+");
    expect(formatted).toContain("1");
  });
});

// ---------------------------------------------------------------------------
// maskPhone
// ---------------------------------------------------------------------------
describe("maskPhone", () => {
  it("masks middle digits of Indonesian number", () => {
    const masked = maskPhone("6281234567890");
    expect(masked).toContain("****");
    expect(masked).toContain("+62");
    expect(masked).toContain("7890");
  });
});

// ---------------------------------------------------------------------------
// parseBulkPaste
// ---------------------------------------------------------------------------
describe("parseBulkPaste", () => {
  it("parses single phone per line", () => {
    const result = parseBulkPaste("6281234567890\n6289876543210");
    expect(result).toHaveLength(2);
    expect(result[0].phone).toBe("6281234567890");
    expect(result[1].phone).toBe("6289876543210");
  });

  it("parses phone with name (comma-separated)", () => {
    const result = parseBulkPaste("6281234567890,John Doe");
    expect(result).toHaveLength(1);
    expect(result[0].phone).toBe("6281234567890");
    expect(result[0].name).toBe("John Doe");
  });

  it("skips empty lines", () => {
    const result = parseBulkPaste("6281234567890\n\n\n6289876543210");
    expect(result).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    const result = parseBulkPaste("");
    expect(result).toHaveLength(0);
  });

  it("preserves original line", () => {
    const result = parseBulkPaste("+62 812-3456-7890, Jane");
    expect(result[0].line).toBe("+62 812-3456-7890, Jane");
  });
});

// ---------------------------------------------------------------------------
// parseCSV
// ---------------------------------------------------------------------------
describe("parseCSV", () => {
  it("parses CSV with header row", () => {
    const csv = "phone,name\n6281234567890,John\n6289876543210,Jane";
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].phone).toBe("6281234567890");
    expect(rows[0].name).toBe("John");
    expect(rows[1].phone).toBe("6289876543210");
    expect(rows[1].name).toBe("Jane");
  });

  it("returns empty array for empty input", () => {
    expect(parseCSV("")).toHaveLength(0);
  });

  it("handles quoted values", () => {
    const csv = '"phone","name"\n"6281234567890","John Doe"';
    const rows = parseCSV(csv);
    expect(rows[0].phone).toBe("6281234567890");
    expect(rows[0].name).toBe("John Doe");
  });

  it("handles missing trailing values", () => {
    const csv = "phone,name,email\n6281234567890,John";
    const rows = parseCSV(csv);
    expect(rows[0].phone).toBe("6281234567890");
    expect(rows[0].name).toBe("John");
    expect(rows[0].email).toBe("");
  });
});

// ---------------------------------------------------------------------------
// extractPhoneFromRow
// ---------------------------------------------------------------------------
describe("extractPhoneFromRow", () => {
  it("extracts and validates phone from row", () => {
    const row = { phone: "+62 812-3456-7890", name: "John" };
    const result = extractPhoneFromRow(row, "phone");
    expect(result).toBe("6281234567890");
  });

  it("returns null for missing column", () => {
    const row = { name: "John" };
    const result = extractPhoneFromRow(row, "phone");
    expect(result).toBeNull();
  });

  it("returns null for invalid phone", () => {
    const row = { phone: "abc" };
    const result = extractPhoneFromRow(row, "phone");
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// validateTag
// ---------------------------------------------------------------------------
describe("validateTag", () => {
  it("accepts valid alphanumeric tag", () => {
    expect(validateTag("my-tag_1").valid).toBe(true);
  });

  it("rejects empty tag", () => {
    const result = validateTag("");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Tag cannot be empty");
  });

  it("rejects tag longer than 50 chars", () => {
    const result = validateTag("a".repeat(51));
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too long");
  });

  it("rejects tag with spaces", () => {
    const result = validateTag("my tag");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("letters, numbers");
  });

  it("rejects tag with special chars", () => {
    const result = validateTag("tag@#!");
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sanitizeTags
// ---------------------------------------------------------------------------
describe("sanitizeTags", () => {
  it("lowercases and deduplicates tags", () => {
    const result = sanitizeTags(["VIP", "vip", "Premium"]);
    expect(result).toEqual(["vip", "premium"]);
  });

  it("filters out invalid tags", () => {
    const result = sanitizeTags(["valid-tag", "invalid tag", "ok_tag"]);
    expect(result).toEqual(["valid-tag", "ok_tag"]);
  });

  it("trims whitespace", () => {
    const result = sanitizeTags(["  vip  ", "premium "]);
    expect(result).toEqual(["vip", "premium"]);
  });

  it("returns empty array for empty input", () => {
    expect(sanitizeTags([])).toEqual([]);
  });
});
