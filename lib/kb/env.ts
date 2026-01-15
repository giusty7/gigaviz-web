import { z } from "zod";

const csv = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

export const indexerConfigSchema = z.object({
  supabaseUrl: z.string().url(),
  supabaseServiceRoleKey: z.string().min(1),
  allowedDomains: z.array(z.string()).min(1),
  sitemapUrls: z.array(z.string().url()),
  seedUrls: z.array(z.string().url()),
  maxPagesPerRun: z.number().int().positive().default(200),
  userAgent: z.string().min(1).default("GigavizBot/1.0 (+contact email optional)"),
  embedProvider: z.string().default("openai"),
  embedModel: z.string().default("text-embedding-3-small"),
  embedDim: z.number().int().positive().default(1536),
  chunkMaxChars: z.number().int().positive().default(2200),
  chunkOverlapChars: z.number().int().nonnegative().default(200),
  blockedPathPrefixes: z.array(z.string()),
  blockedQueryKeys: z.array(z.string()),
});

export type IndexerConfig = z.infer<typeof indexerConfigSchema>;

export function loadIndexerConfig(env = process.env): IndexerConfig {
  const parsed = indexerConfigSchema.safeParse({
    supabaseUrl: env.SUPABASE_URL,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    allowedDomains: csv(env.KB_ALLOWED_DOMAINS),
    sitemapUrls: csv(env.KB_SITEMAP_URLS),
    seedUrls: csv(env.KB_SEED_URLS),
    maxPagesPerRun: Number(env.KB_MAX_PAGES_PER_RUN ?? 200),
    userAgent: env.KB_USER_AGENT,
    embedProvider: env.KB_EMBED_PROVIDER,
    embedModel: env.KB_EMBED_MODEL,
    embedDim: Number(env.KB_EMBED_DIM ?? 1536),
    chunkMaxChars: Number(env.KB_CHUNK_MAX_CHARS ?? 2200),
    chunkOverlapChars: Number(env.KB_CHUNK_OVERLAP_CHARS ?? 200),
    blockedPathPrefixes: csv(env.KB_BLOCKED_PATH_PREFIXES),
    blockedQueryKeys: csv(env.KB_BLOCKED_QUERY_KEYS).map((k) => k.toLowerCase()),
  });

  if (!parsed.success) {
    throw new Error(`Invalid KB indexer config: ${parsed.error.message}`);
  }

  return parsed.data;
}
