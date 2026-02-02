import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { logger } from "@/lib/logging";

const ReindexSchema = z.object({
  id: z.string().uuid(),
});

// POST - Reindex a knowledge source
export async function POST(req: NextRequest) {
  try {
    const admin = await requirePlatformAdmin();
    if (!admin.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id } = ReindexSchema.parse(body);

    const db = supabaseAdmin();

    // Get source content
    const { data: source, error: fetchError } = await db
      .from("platform_knowledge_sources")
      .select("id, content_text")
      .eq("id", id)
      .single();

    if (fetchError || !source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    if (!source.content_text) {
      return NextResponse.json({ error: "No content to index" }, { status: 400 });
    }

    // Delete existing chunks
    await db.from("platform_knowledge_chunks").delete().eq("source_id", id);

    // Regenerate chunks and embeddings
    const chunks = chunkContent(source.content_text, 1000);
    const chunkRecords = [];

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);
      chunkRecords.push({
        source_id: id,
        content: chunks[i],
        chunk_index: i,
        embedding,
      });
    }

    // Insert new chunks
    if (chunkRecords.length > 0) {
      const { error: insertError } = await db
        .from("platform_knowledge_chunks")
        .insert(chunkRecords);

      if (insertError) {
        throw insertError;
      }
    }

    // Update source status
    await db
      .from("platform_knowledge_sources")
      .update({ status: "indexed", indexed_at: new Date().toISOString() })
      .eq("id", id);

    logger.info("Platform KB source reindexed", { 
      sourceId: id, 
      chunks: chunks.length,
      actor: admin.actorEmail,
    });

    return NextResponse.json({ success: true, chunks: chunks.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.issues }, { status: 400 });
    }
    logger.error("Platform KB reindex error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Chunk content into smaller pieces
function chunkContent(content: string, maxChunkSize: number): string[] {
  const paragraphs = content.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
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
