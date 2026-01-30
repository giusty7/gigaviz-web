import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireWorkspaceMember } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateEmbedding, chunkText, estimateTokenCount } from "@/lib/helper/embeddings";

export const runtime = "nodejs";

type IndexRequest = {
  workspaceId: string;
  sourceType: string;
  sourceId: string;
  title?: string;
  content: string;
  metadata?: Record<string, unknown>;
};

/**
 * POST /api/helper/knowledge/index
 * Index content into knowledge base
 */
export async function POST(req: NextRequest) {
  const userRes = await requireUser(req);
  if (!userRes.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user } = userRes;

  const body = (await req.json()) as IndexRequest;
  const { workspaceId, sourceType, sourceId, title, content, metadata } = body;

  if (!workspaceId || !sourceType || !sourceId || !content) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Verify workspace access
  const membership = await requireWorkspaceMember(user.id, workspaceId);
  if (!membership.ok) {
    return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
  }

  const db = supabaseAdmin();

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

      return NextResponse.json({
        ok: true,
        sourceId: data.id,
        chunks: 0,
        message: "Indexed successfully",
      });
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

    return NextResponse.json({
      ok: true,
      sourceId: source.id,
      chunks: chunks.length,
      message: "Indexed with chunks",
    });
  } catch (error) {
    console.error("Indexing failed:", error);
    return NextResponse.json(
      { error: "Failed to index content" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/helper/knowledge/index
 * Remove content from knowledge base
 */
export async function DELETE(req: NextRequest) {
  const userRes = await requireUser(req);
  if (!userRes.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user } = userRes;

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  const sourceType = searchParams.get("sourceType");
  const sourceId = searchParams.get("sourceId");

  if (!workspaceId || !sourceType || !sourceId) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  // Verify workspace access
  const membership = await requireWorkspaceMember(user.id, workspaceId);
  if (!membership.ok) {
    return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
  }

  const db = supabaseAdmin();

  try {
    const { error } = await db
      .from("helper_knowledge_sources")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("source_type", sourceType)
      .eq("source_id", sourceId);

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      message: "Removed from knowledge base",
    });
  } catch (error) {
    console.error("Deletion failed:", error);
    return NextResponse.json(
      { error: "Failed to remove content" },
      { status: 500 }
    );
  }
}
