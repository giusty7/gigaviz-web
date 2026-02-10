import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireWorkspaceMember } from "@/lib/auth/guard";
import { generateEmbedding, generateEmbeddings } from "@/lib/helper/embeddings";

export const runtime = "nodejs";

type EmbeddingRequest = {
  workspaceId: string;
  text?: string;
  texts?: string[];
};

/**
 * POST /api/helper/embeddings
 * Generate embeddings for text(s)
 */
export async function POST(req: NextRequest) {
  const userRes = await requireUser(req);
  if (!userRes.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user } = userRes;

  const body = (await req.json()) as EmbeddingRequest;
  const { workspaceId, text, texts } = body;

  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId required" },
      { status: 400 }
    );
  }

  // Verify workspace access
  const membership = await requireWorkspaceMember(user.id, workspaceId);
  if (!membership.ok) {
    return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
  }

  try {
    // Single text
    if (text) {
      const embedding = await generateEmbedding(text);
      return NextResponse.json({
        ok: true,
        embedding,
        dimensions: embedding.length,
      });
    }

    // Multiple texts
    if (texts && Array.isArray(texts)) {
      const embeddings = await generateEmbeddings(texts);
      return NextResponse.json({
        ok: true,
        embeddings,
        count: embeddings.length,
        dimensions: embeddings[0]?.length ?? 0,
      });
    }

    return NextResponse.json(
      { error: "Either 'text' or 'texts' required" },
      { status: 400 }
    );
  } catch (error) {
    logger.error("Embedding generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate embeddings" },
      { status: 500 }
    );
  }
}
