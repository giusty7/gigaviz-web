/**
 * WhatsApp Contacts Utilities
 * Phone normalization, validation, and formatting helpers
 */

/**
 * Normalize phone number to WhatsApp ID format (digits only, no +)
 * Returns both wa_id and e164 format
 * 
 * Indonesia normalization rules:
 * - 0812... → 62812... (remove leading 0, add 62)
 * - 812... → 62812... (add 62 prefix)
 * - +62812... → 62812... (strip +)
 * - 62812... → 62812... (keep as-is)
 * 
 * Examples:
 * - "+62 812-3456-7890" → { wa_id: "6281234567890", e164: "+6281234567890" }
 * - "08123456789" → { wa_id: "628123456789", e164: "+628123456789" }
 * - "812345678" → { wa_id: "62812345678", e164: "+62812345678" }
 */
export function normalizePhone(input: string): string {
  // Strip all non-digit characters
  let digits = input.replace(/\D/g, "");

  // Handle Indonesian numbers
  if (digits.startsWith("0")) {
    // 0812... → 62812...
    digits = "62" + digits.substring(1);
  } else if (digits.startsWith("8") && !digits.startsWith("62")) {
    // 812... → 62812... (assume Indonesia if starts with 8 but not 62)
    digits = "62" + digits;
  }
  // else: already has country code or is international format

  return digits;
}

/**
 * Get WhatsApp ID and E.164 format from phone input
 */
export function getWhatsAppId(input: string): {
  wa_id: string;
  e164: string;
} {
  const digits = normalizePhone(input);
  return {
    wa_id: digits,
    e164: "+" + digits,
  };
}

/**
 * Validate phone number format and return wa_id
 * Must be 10-15 digits after normalization
 */
export function validatePhone(input: string): {
  valid: boolean;
  normalized?: string;
  wa_id?: string;
  e164?: string;
  error?: string;
} {
  if (!input || input.trim().length === 0) {
    return { valid: false, error: "Phone number is required" };
  }

  const normalized = normalizePhone(input);

  if (normalized.length < 10) {
    return { valid: false, error: "Phone number too short" };
  }

  if (normalized.length > 15) {
    return { valid: false, error: "Phone number too long" };
  }

  if (!/^\d+$/.test(normalized)) {
    return { valid: false, error: "Invalid phone format" };
  }

  const { wa_id, e164 } = getWhatsAppId(input);

  return { valid: true, normalized, wa_id, e164 };
}

/**
 * Format phone number for display
 * Example: "6281234567890" → "+62 812-3456-7890"
 */
export function formatPhoneDisplay(normalized: string): string {
  if (!normalized) return "";

  // Add + prefix
  let formatted = "+" + normalized;

  // Add spacing for readability (country code + groups)
  if (normalized.startsWith("62") && normalized.length >= 11) {
    // Indonesian format: +62 812-3456-7890
    formatted = `+62 ${normalized.substring(2, 5)}-${normalized.substring(
      5,
      9
    )}-${normalized.substring(9)}`;
  } else if (normalized.length >= 11) {
    // Generic format: +XX XXX-XXX-XXXX
    formatted = `+${normalized.substring(0, 2)} ${normalized.substring(
      2,
      5
    )}-${normalized.substring(5, 8)}-${normalized.substring(8)}`;
  }

  return formatted;
}

/**
 * Mask phone number for privacy
 * Example: "6281234567890" → "+62 812-****-7890"
 */
export function maskPhone(normalized: string): string {
  const formatted = formatPhoneDisplay(normalized);
  // Replace middle digits with asterisks
  return formatted.replace(/(\d{3})-(\d{4})-(\d{4})/, "$1-****-$3");
}

/**
 * Parse bulk paste input (one phone per line, optionally with name)
 * Formats supported:
 * - "6281234567890"
 * - "+62 812-3456-7890"
 * - "6281234567890,John Doe"
 * - "+62 812-3456-7890, John Doe"
 */
export function parseBulkPaste(input: string): Array<{
  phone: string;
  name?: string;
  line: string;
}> {
  const lines = input
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return lines.map((line) => {
    const parts = line.split(",").map((p) => p.trim());
    const phone = parts[0];
    const name = parts.length > 1 ? parts.slice(1).join(",").trim() : undefined;

    return { phone, name, line };
  });
}

/**
 * Parse CSV data into rows
 */
export function parseCSV(csvData: string): Array<Record<string, string>> {
  const lines = csvData
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // Parse header
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

  // Parse rows
  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};

    headers.forEach((header, idx) => {
      row[header] = values[idx] || "";
    });

    rows.push(row);
  }

  return rows;
}

/**
 * Extract phone number from various CSV column formats
 */
export function extractPhoneFromRow(
  row: Record<string, string>,
  phoneColumn: string
): string | null {
  const value = row[phoneColumn];
  if (!value) return null;

  const validation = validatePhone(value);
  return validation.valid ? validation.normalized! : null;
}

/**
 * Validate tag name
 */
export function validateTag(tag: string): { valid: boolean; error?: string } {
  if (!tag || tag.trim().length === 0) {
    return { valid: false, error: "Tag cannot be empty" };
  }

  if (tag.length > 50) {
    return { valid: false, error: "Tag too long (max 50 characters)" };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(tag)) {
    return {
      valid: false,
      error: "Tag can only contain letters, numbers, hyphens, and underscores",
    };
  }

  return { valid: true };
}

/**
 * Sanitize tags array
 */
export function sanitizeTags(tags: string[]): string[] {
  return tags
    .map((t) => t.trim().toLowerCase())
    .filter((t) => validateTag(t).valid)
    .filter((t, idx, arr) => arr.indexOf(t) === idx); // dedupe
}
