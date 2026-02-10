import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireWorkspaceMember } from "@/lib/auth/guard";
import { searchKnowledge } from "@/lib/helper/rag";

export const runtime = "nodejs";

/**
 * GET /api/helper/knowledge/search
 * Semantic search across workspace knowledge base
 */
export async function GET(req: NextRequest) {
  const userRes = await requireUser(req);
  if (!userRes.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user } = userRes;

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  const query = searchParams.get("query");
  const maxResults = parseInt(searchParams.get("maxResults") ?? "5");
  const threshold = parseFloat(searchParams.get("threshold") ?? "0.7");

  if (!workspaceId || !query) {
    return NextResponse.json(
      { error: "workspaceId and query required" },
      { status: 400 }
    );
  }

  // Verify workspace access
  const membership = await requireWorkspaceMember(user.id, workspaceId);
  if (!membership.ok) {
    return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
  }

  try {
    const results = await searchKnowledge(workspaceId, query, {
      maxResults,
      similarityThreshold: threshold,
    });

    return NextResponse.json({
      ok: true,
      results,
      count: results.length,
    });
  } catch (error) {
    logger.error("Search failed:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
