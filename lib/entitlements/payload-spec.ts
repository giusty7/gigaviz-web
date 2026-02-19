import { z } from "zod";

export const ENTITLEMENT_KEYS = [
  "core_os",
  "meta_hub",
  "studio",
  "helper",
  "links",
  "office",
  "marketplace",
  "apps",
] as const;

export type EntitlementKey = (typeof ENTITLEMENT_KEYS)[number];

const planSchema = z.enum(["free", "starter", "pro", "business", "enterprise"]);
const featureValueSchema = z.union([
  z.boolean(),
  z.string(),
  z.number(),
  z.array(z.string()),
]);

export const BasePayloadSchema = z
  .object({
    version: z.literal(1).optional(),
    plan: planSchema.optional(),
    limits: z.record(z.string(), z.number().min(0)).optional(),
    features: z.record(z.string(), featureValueSchema).optional(),
    meta: z
      .object({
        note: z.string().optional(),
        tags: z.array(z.string()).optional(),
        source: z.enum(["owner_console", "billing", "support", "migration"]).optional(),
        effective_at: z.string().datetime().optional(),
        expires_at: z.string().datetime().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type EntitlementPayload = z.infer<typeof BasePayloadSchema>;

const payloadSchemas: Record<EntitlementKey, typeof BasePayloadSchema> = {
  core_os: BasePayloadSchema,
  meta_hub: BasePayloadSchema,
  studio: BasePayloadSchema,
  helper: BasePayloadSchema,
  links: BasePayloadSchema,
  office: BasePayloadSchema,
  marketplace: BasePayloadSchema,
  apps: BasePayloadSchema,
};

function getPayloadSchema(key: string) {
  return payloadSchemas[key as EntitlementKey] ?? BasePayloadSchema;
}

export function normalizePayload(input: unknown) {
  return input === null || input === undefined ? {} : input;
}

export function validatePayload(key: string, payload: unknown) {
  return getPayloadSchema(key).parse(normalizePayload(payload));
}

export function safeValidatePayload(key: string, payload: unknown) {
  return getPayloadSchema(key).safeParse(normalizePayload(payload));
}
