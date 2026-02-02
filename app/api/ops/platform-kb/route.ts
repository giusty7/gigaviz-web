import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { logger } from "@/lib/logging";

const CreateSourceSchema = z.object({
  source_type: z.enum(["document", "article", "faq", "guide", "api_docs", "tutorial", "changelog"]),
  title: z.string().min(1).max(500),
  content_text: z.string().min(1).max(100000),
  url: z.string().url().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// GET - List all platform knowledge sources
export async function GET() {
  try {
    const admin = await requirePlatformAdmin();
    if (!admin.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = supabaseAdmin();

    const { data: sources, error } = await db
      .from("platform_knowledge_sources")
      .select("id, source_type, title, content_text, url, metadata, status, indexed_at, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      logger.error("Failed to fetch platform KB sources", { error });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Get stats
    const { count: totalSources } = await db
      .from("platform_knowledge_sources")
      .select("id", { count: "exact", head: true });

    const { count: indexedSources } = await db
      .from("platform_knowledge_sources")
      .select("id", { count: "exact", head: true })
      .eq("status", "indexed");

    const { count: totalChunks } = await db
      .from("platform_knowledge_chunks")
      .select("id", { count: "exact", head: true });

    return NextResponse.json({
      data: sources,
      stats: {
        totalSources: totalSources ?? 0,
        indexedSources: indexedSources ?? 0,
        totalChunks: totalChunks ?? 0,
      },
    });
  } catch (err) {
    logger.error("Platform KB GET error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Add new knowledge source
export async function POST(req: NextRequest) {
  try {
    const admin = await requirePlatformAdmin();
    if (!admin.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = CreateSourceSchema.parse(body);

    const db = supabaseAdmin();

    // Insert source
    const { data: source, error: insertError } = await db
      .from("platform_knowledge_sources")
      .insert({
        source_type: validated.source_type,
        title: validated.title,
        content_text: validated.content_text,
        url: validated.url ?? null,
        metadata: validated.metadata ?? {},
        status: "pending",
        created_by: admin.user.id,
      })
      .select()
      .single();

    if (insertError || !source) {
      logger.error("Failed to insert platform KB source", { error: insertError });
      return NextResponse.json({ error: "Failed to add knowledge" }, { status: 500 });
    }

    // Generate embeddings and index (async - don't block response)
    indexSourceAsync(source.id, validated.content_text).catch((err) => {
      logger.error("Failed to index platform KB source", { error: err, sourceId: source.id });
    });

    logger.info("Platform KB source created", { 
      sourceId: source.id, 
      title: validated.title,
      actor: admin.actorEmail,
    });

    return NextResponse.json({ data: source });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.issues }, { status: 400 });
    }
    logger.error("Platform KB POST error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove knowledge source
export async function DELETE(req: NextRequest) {
  try {
    const admin = await requirePlatformAdmin();
    if (!admin.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Source ID required" }, { status: 400 });
    }

    const db = supabaseAdmin();

    // Delete chunks first (cascade should handle but be explicit)
    await db.from("platform_knowledge_chunks").delete().eq("source_id", id);

    // Delete source
    const { error } = await db.from("platform_knowledge_sources").delete().eq("id", id);

    if (error) {
      logger.error("Failed to delete platform KB source", { error, id });
      return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }

    logger.info("Platform KB source deleted", { sourceId: id, actor: admin.actorEmail });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Platform KB DELETE error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper: Index source content asynchronously
async function indexSourceAsync(sourceId: string, content: string) {
  const db = supabaseAdmin();

  try {
    // Simple chunking: split by paragraphs, max 1000 chars per chunk
    const chunks = chunkContent(content, 1000);

    // Generate embeddings for each chunk
    const chunkRecords = [];
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);
      chunkRecords.push({
        source_id: sourceId,
        content: chunks[i],
        chunk_index: i,
        embedding,
      });
    }

    // Insert chunks
    if (chunkRecords.length > 0) {
      const { error: chunkError } = await db
        .from("platform_knowledge_chunks")
        .insert(chunkRecords);

      if (chunkError) {
        throw chunkError;
      }
    }

    // Update source status
    await db
      .from("platform_knowledge_sources")
      .update({ status: "indexed", indexed_at: new Date().toISOString() })
      .eq("id", sourceId);

    logger.info("Platform KB source indexed", { sourceId, chunks: chunks.length });
  } catch (err) {
    // Mark as failed
    await db
      .from("platform_knowledge_sources")
      .update({ status: "failed" })
      .eq("id", sourceId);
    throw err;
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
