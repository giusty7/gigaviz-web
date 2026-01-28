import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_META_APP_ID: z.string().optional(),
  NEXT_PUBLIC_META_CONFIG_ID: z.string().optional(),
  NEXT_PUBLIC_META_SOLUTION_ID: z.string().optional(),
  NEXT_PUBLIC_INBOX_SLA_HOURS: z.string().optional(),
  NEXT_PUBLIC_DEMO_UI: z.string().optional(),
});

type PublicEnv = z.infer<typeof publicSchema>;

let cached: PublicEnv | null = null;

export function loadPublicEnv(env: NodeJS.ProcessEnv = process.env): PublicEnv {
  if (cached) return cached;
  const parsed = publicSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid public env: ${issues}`);
  }
  const data = parsed.data;
  if (!data.NEXT_PUBLIC_APP_URL) {
    const fallback = env.APP_BASE_URL;
    if (fallback && z.string().url().safeParse(fallback).success) {
      data.NEXT_PUBLIC_APP_URL = fallback;
    } else {
      throw new Error("Invalid public env: NEXT_PUBLIC_APP_URL is required (or set APP_BASE_URL)");
    }
  }
  cached = data;
  return cached;
}

export const publicEnv = loadPublicEnv();
