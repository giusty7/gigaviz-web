import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { logger } from "@/lib/logging";

const SearchSchema = z.object({
  query: z.string().min(1).max(1000),
  limit: z.number().int().min(1).max(20).optional().default(5),
});

// POST - Search platform knowledge using vector similarity
export async function POST(req: NextRequest) {
  try {
    const admin = await requirePlatformAdmin();
    if (!admin.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { query, limit } = SearchSchema.parse(body);

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    const db = supabaseAdmin();

    // Search using vector similarity
    const { data: chunks, error } = await db.rpc("search_platform_knowledge", {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: limit,
    });

    if (error) {
      // If function doesn't exist, fallback to basic search
      logger.warn("Platform KB search RPC failed, using fallback", { error });
      
      const { data: fallbackChunks } = await db
        .from("platform_knowledge_chunks")
        .select(`
          id,
          content,
          source_id,
          platform_knowledge_sources!inner (
            id,
            title
          )
        `)
        .limit(limit);

      const results = (fallbackChunks ?? []).map((chunk) => {
        const source = chunk.platform_knowledge_sources as unknown as { title: string } | null;
        return {
          title: source?.title ?? "Unknown",
          content: chunk.content,
          similarity: 0.8, // Dummy similarity for fallback
        };
      });

      return NextResponse.json({ results });
    }

    const results = (chunks ?? []).map((chunk: { title: string; content: string; similarity: number }) => ({
      title: chunk.title,
      content: chunk.content,
      similarity: chunk.similarity,
    }));

    return NextResponse.json({ results });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.issues }, { status: 400 });
    }
    logger.error("Platform KB search error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Generate embedding using OpenAI
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-ada-002",
      input: text,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI embedding error: ${err}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}
