import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace } from "@/lib/auth/guard";
import { generateEmbedding, chunkText, estimateTokenCount } from "@/lib/helper/embeddings";

export const runtime = "nodejs";

const indexPostSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId required"),
  sourceType: z.string().min(1, "sourceType required"),
  sourceId: z.string().min(1, "sourceId required"),
  title: z.string().optional(),
  content: z.string().min(1, "content required"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const indexDeleteSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId required"),
  sourceType: z.string().min(1, "sourceType required"),
  sourceId: z.string().min(1, "sourceId required"),
});

/**
 * POST /api/helper/knowledge/index
 * Index content into knowledge base
 */
export async function POST(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  const raw = guard.body ?? await req.json().catch(() => ({}));
  const parsed = indexPostSchema.safeParse(raw);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "validation_error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    );
  }
  const { sourceType, sourceId, title, content, metadata } = parsed.data;

  try {
    // If content is short, index as single source
    const contentLength = content.length;
    if (contentLength < 2000) {
      const embedding = await generateEmbedding(content);

      const { data, error } = await db
        .from("helper_knowledge_sources")
        .upsert({
          workspace_id: workspaceId,
          source_type: sourceType,
          source_id: sourceId,
          title: title ?? null,
          content_text: content,
          metadata: metadata ?? {},
          embedding: `[${embedding.join(",")}]`,
          indexed_at: new Date().toISOString(),
          is_active: true,
        })
        .select("id")
        .single();

      if (error) throw error;

      return withCookies(NextResponse.json({
        ok: true,
        sourceId: data.id,
        chunks: 0,
        message: "Indexed successfully",
      }));
    }

    // Long content: chunk and index
    const chunks = chunkText(content, 1000, 100);
    
    // Create main source record
    const mainEmbedding = await generateEmbedding(chunks[0]);
    const { data: source, error: sourceError } = await db
      .from("helper_knowledge_sources")
      .upsert({
        workspace_id: workspaceId,
        source_type: sourceType,
        source_id: sourceId,
        title: title ?? null,
        content_text: content.slice(0, 2000), // Store preview
        metadata: metadata ?? {},
        embedding: `[${mainEmbedding.join(",")}]`,
        indexed_at: new Date().toISOString(),
        is_active: true,
      })
      .select("id")
      .single();

    if (sourceError) throw sourceError;

    // Generate embeddings for all chunks
    const chunkEmbeddings = await Promise.all(
      chunks.map((chunk) => generateEmbedding(chunk))
    );

    // Insert chunks
    const chunkRecords = chunks.map((chunk, index) => ({
      source_id: source.id,
      workspace_id: workspaceId,
      chunk_index: index,
      chunk_text: chunk,
      token_count: estimateTokenCount(chunk),
      embedding: `[${chunkEmbeddings[index].join(",")}]`,
    }));

    const { error: chunksError } = await db
      .from("helper_knowledge_chunks")
      .upsert(chunkRecords);

    if (chunksError) throw chunksError;

    return withCookies(NextResponse.json({
      ok: true,
      sourceId: source.id,
      chunks: chunks.length,
      message: "Indexed with chunks",
    }));
  } catch (error) {
    logger.error("Indexing failed:", error);
    return withCookies(
      NextResponse.json(
        { error: "Failed to index content" },
        { status: 500 }
      )
    );
  }
}

/**
 * DELETE /api/helper/knowledge/index
 * Remove content from knowledge base
 */
export async function DELETE(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  const { searchParams } = new URL(req.url);
  const parsed = indexDeleteSchema.safeParse({
    workspaceId: workspaceId,
    sourceType: searchParams.get("sourceType"),
    sourceId: searchParams.get("sourceId"),
  });
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "validation_error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    );
  }
  const { sourceType, sourceId } = parsed.data;

  try {
    const { error } = await db
      .from("helper_knowledge_sources")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("source_type", sourceType)
      .eq("source_id", sourceId);

    if (error) throw error;

    return withCookies(NextResponse.json({
      ok: true,
      message: "Removed from knowledge base",
    }));
  } catch (error) {
    logger.error("Deletion failed:", error);
    return withCookies(
      NextResponse.json(
        { error: "Failed to remove content" },
        { status: 500 }
      )
    );
  }
}
