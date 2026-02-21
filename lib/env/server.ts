import { z } from "zod";

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_DB_URL: z.string().optional(),
  DEFAULT_WORKSPACE_ID: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().uuid().optional()
  ),
  META_APP_SECRET: z.string().optional(),
  META_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  WA_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  WA_ACCESS_TOKEN: z.string().optional(),
  WA_CLOUD_API_TOKEN: z.string().optional(),
  WA_CLOUD_API_SYSTEM_USER_TOKEN: z.string().optional(),
  WA_PHONE_NUMBER_ID: z.string().optional(),
  WA_GRAPH_VERSION: z.string().default("v22.0"),
  META_SYSTEM_USER_TOKEN: z.string().optional(),
  META_WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  RATE_CAP_PER_MIN: z.string().optional(),
  RATE_DELAY_MIN_MS: z.string().optional(),
  RATE_DELAY_MAX_MS: z.string().optional(),
  WORKER_BATCH_SIZE: z.string().optional(),
  WORKER_MAX_ATTEMPTS: z.string().optional(),
  WORKER_POLL_INTERVAL_MS: z.string().optional(),
});

type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function loadServerEnv(env: NodeJS.ProcessEnv = process.env): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid server env: ${issues}`);
  }
  const data = parsed.data;
  if (!data.APP_BASE_URL) {
    const fallback = env.NEXT_PUBLIC_APP_URL;
    if (fallback && z.string().url().safeParse(fallback).success) {
      data.APP_BASE_URL = fallback;
    } else {
      throw new Error("Invalid server env: APP_BASE_URL is required (or set NEXT_PUBLIC_APP_URL)");
    }
  }
  cached = data;
  return cached;
}

export const serverEnv = loadServerEnv();
