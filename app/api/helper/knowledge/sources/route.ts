import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace } from "@/lib/auth/guard";
import { generateEmbedding } from "@/lib/helper/embeddings";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const AddSourceSchema = z.object({
  workspaceId: z.string().uuid(),
  sourceType: z.enum(["kb_article", "uploaded_document", "product_data", "contact"]),
  title: z.string().min(1).max(500),
  content: z.string().min(10).max(50000),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * GET /api/helper/knowledge/sources
 * List knowledge sources for a workspace
 */
export async function GET(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  const { data: sources, error } = await db
    .from("helper_knowledge_sources")
    .select("id, source_type, source_id, title, content_text, metadata, indexed_at, is_active, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    logger.error("Failed to load sources:", error);
    return withCookies(NextResponse.json({ error: "Failed to load sources" }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ ok: true, sources }));
}

/**
 * POST /api/helper/knowledge/sources
 * Add a new knowledge source with embedding
 */
export async function POST(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, user, withCookies, supabase: db } = guard;

  try {
    const body = guard.body ?? await req.json();
    const parsed = AddSourceSchema.safeParse(body);
    
    if (!parsed.success) {
      return withCookies(
        NextResponse.json(
          { error: "Invalid input", details: parsed.error.issues },
          { status: 400 }
        )
      );
    }

    const { sourceType, title, content, metadata } = parsed.data;

    // Generate embedding for the content
    const embedding = await generateEmbedding(content);

    const sourceId = randomUUID();

    // Insert the knowledge source
    const { data, error } = await db
      .from("helper_knowledge_sources")
      .insert({
        id: randomUUID(),
        workspace_id: workspaceId,
        source_type: sourceType,
        source_id: sourceId,
        title,
        content_text: content,
        embedding: `[${embedding.join(",")}]`,
        metadata: { ...(metadata || {}), created_by: user.id },
        indexed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      logger.error("Failed to add source:", error);
      return withCookies(NextResponse.json({ error: "Failed to add source" }, { status: 500 }));
    }

    return withCookies(NextResponse.json({ ok: true, id: data.id }));
  } catch (error) {
    logger.error("Add source error:", error);
    return withCookies(NextResponse.json({ error: "Internal server error" }, { status: 500 }));
  }
}

/**
 * DELETE /api/helper/knowledge/sources
 * Delete a knowledge source
 */
export async function DELETE(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return withCookies(NextResponse.json({ error: "id required" }, { status: 400 }));
  }

  const { error } = await db
    .from("helper_knowledge_sources")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) {
    logger.error("Failed to delete source:", error);
    return withCookies(NextResponse.json({ error: "Failed to delete source" }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ ok: true }));
}
