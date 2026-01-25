import { createHash } from "crypto";

/**
 * WhatsApp Templates Helper Functions
 * Utilities for template parameter extraction, validation, and rendering
 */

/**
 * Extract the maximum variable index from template text
 * Example: "Hello {{1}}, your code is {{2}}" => 2
 */
export function extractVariableCount(text: string): number {
  if (!text) return 0;
  const matches = Array.from(text.matchAll(/\{\{(\d+)\}\}/g));
  if (matches.length === 0) return 0;
  const nums = matches.map((match) => parseInt(match[1], 10));
  return Math.max(0, ...nums);
}

/**
 * Extract variable count from multiple text fields (header, body, footer, buttons)
 */
export function extractVariableCountFromTemplate(
  body?: string | null,
  header?: string | null,
  footer?: string | null,
  buttonTexts?: string[]
): number {
  const texts = [body, header, footer, ...(buttonTexts ?? [])].filter(Boolean) as string[];
  return extractVariableCount(texts.join(" "));
}

/**
 * Render template body by replacing {{1}}, {{2}}, ... with values
 * Example: renderTemplateBody("Hi {{1}}, code {{2}}", ["John", "1234"]) => "Hi John, code 1234"
 */
export function renderTemplateBody(template: string, values: string[]): string {
  let result = template;
  for (let i = 0; i < values.length; i++) {
    const placeholder = `{{${i + 1}}}`;
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), values[i] || "");
  }
  return result;
}

/**
 * Validate that all required parameters are provided
 */
export function validateTemplateParams(
  requiredCount: number,
  providedParams: string[]
): { valid: boolean; missing: number[] } {
  const missing: number[] = [];
  for (let i = 1; i <= requiredCount; i++) {
    if (!providedParams[i - 1] || providedParams[i - 1].trim() === "") {
      missing.push(i);
    }
  }
  return { valid: missing.length === 0, missing };
}

/**
 * Parse Meta template components to extract structured data
 */
export function parseTemplateComponents(components: unknown): {
  header?: { type: string; text?: string };
  body?: { text: string };
  footer?: { text?: string };
  buttons?: Array<{ type: string; text: string }>;
} {
  if (!Array.isArray(components)) return {};

  const result: ReturnType<typeof parseTemplateComponents> = {};

  for (const comp of components) {
    if (typeof comp !== "object" || !comp) continue;
    const c = comp as Record<string, unknown>;

    if (c.type === "HEADER") {
      result.header = {
        type: (c.format as string) ?? "TEXT",
        text: (c.text as string) ?? undefined,
      };
    } else if (c.type === "BODY") {
      result.body = { text: (c.text as string) ?? "" };
    } else if (c.type === "FOOTER") {
      result.footer = { text: (c.text as string) ?? undefined };
    } else if (c.type === "BUTTONS" && Array.isArray(c.buttons)) {
      result.buttons = c.buttons
        .filter((b): b is Record<string, unknown> => typeof b === "object" && b !== null)
        .map((b) => ({
          type: (b.type as string) ?? "QUICK_REPLY",
          text: (b.text as string) ?? "",
        }));
    }
  }

  return result;
}

/**
 * Build Meta API template payload from parameters
 */
export function buildTemplatePayload(
  templateName: string,
  language: string,
  params: string[]
): {
  messaging_product: string;
  to?: string;
  type: string;
  template: {
    name: string;
    language: { code: string };
    components: Array<{
      type: string;
      parameters: Array<{ type: string; text: string }>;
    }>;
  };
} {
  return {
    messaging_product: "whatsapp",
    type: "template",
    template: {
      name: templateName,
      language: { code: language },
      components: [
        {
          type: "body",
          parameters: params.map((text) => ({ type: "text", text })),
        },
      ],
    },
  };
}

/**
 * Hash phone number for privacy in logs (SHA-256)
 */
export function hashPhone(phone: string): string {
  return createHash("sha256").update(phone).digest("hex");
}

/**
 * Normalize phone number for WhatsApp (remove + and spaces)
 */
export function normalizePhoneForWhatsApp(phone: string): string {
  return phone.replace(/[\s+()-]/g, "");
}

/**
 * Compute parameters for a contact using param definitions
 */
export function computeContactParams(
  contact: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    wa_id?: string | null;
    data?: Record<string, unknown> | null;
  },
  variableCount: number,
  paramDefs: Array<{
    paramIndex: number;
    sourceType: "manual" | "contact_field" | "expression";
    sourceValue?: string;
    defaultValue?: string;
  }> | undefined,
  globalValues?: Record<string, string>
): string[] {
  const params: string[] = [];

  for (let i = 1; i <= variableCount; i++) {
    const def = paramDefs?.find((d) => d.paramIndex === i);
    let value = "";

    if (def) {
      if (def.sourceType === "manual") {
        value = globalValues?.[i.toString()] ?? def.defaultValue ?? "";
      } else if (def.sourceType === "contact_field") {
        const fieldName = def.sourceValue ?? "";
        // Check standard fields
        if (fieldName === "name") value = contact.name ?? "";
        else if (fieldName === "phone") value = contact.phone ?? "";
        else if (fieldName === "email") value = contact.email ?? "";
        else if (fieldName === "wa_id") value = contact.wa_id ?? "";
        // Check custom data fields
        else if (contact.data && typeof contact.data === "object") {
          const customValue = contact.data[fieldName];
          value = typeof customValue === "string" ? customValue : "";
        }
        if (!value) value = def.defaultValue ?? "";
      } else if (def.sourceType === "expression") {
        // Simple mustache-style replacement: {{contact.name}}, {{global.promo}}
        let expr = def.sourceValue ?? "";
        // Replace {{contact.field}}
        expr = expr.replace(/\{\{contact\.(\w+)\}\}/g, (_, field) => {
          if (field === "name") return contact.name ?? "";
          if (field === "phone") return contact.phone ?? "";
          if (field === "email") return contact.email ?? "";
          if (field === "wa_id") return contact.wa_id ?? "";
          if (contact.data && typeof contact.data === "object") {
            const val = contact.data[field];
            return typeof val === "string" ? val : "";
          }
          return "";
        });
        // Replace {{global.key}}
        expr = expr.replace(/\{\{global\.(\w+)\}\}/g, (_, key) => {
          return globalValues?.[key] ?? "";
        });
        value = expr || def.defaultValue || "";
      }
    } else {
      // No mapping defined, use global value or empty
      value = globalValues?.[i.toString()] ?? "";
    }

    params.push(value);
  }

  return params;
}
