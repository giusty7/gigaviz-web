import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development","test","production"]).default("development"),
  // AI
  OPENAI_API_KEY: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  TOPMEDIAAI_API_KEY: z.string().min(1).optional(),
  // Email
  RESEND_API_KEY: z.string().min(1).optional(),
  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
  TELEGRAM_BOT_USERNAME: z.string().min(1).optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(1).optional(),
  TELEGRAM_CHAT_ID_DEFAULT: z.string().optional(),
  // WhatsApp Business
  META_WA_ACCESS_TOKEN: z.string().min(1).optional(),
  META_WA_PHONE_NUMBER_ID: z.string().min(1).optional(),
  META_WA_BUSINESS_ID: z.string().min(1).optional(),
  META_WA_VERIFY_TOKEN: z.string().min(1).optional(),
  META_WA_APP_SECRET: z.string().min(1).optional(),
  // HTTP security
  HTTP_OUTBOUND_ALLOWLIST: z.string().default(""),
  DRY_RUN_HTTP: z.string().default("1"),
});

export const env = EnvSchema.parse(process.env);