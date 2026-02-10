import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireWorkspaceMember } from "@/lib/auth/guard";
import { generateEmbedding, generateEmbeddings } from "@/lib/helper/embeddings";

export const runtime = "nodejs";

const embeddingSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId required"),
  text: z.string().min(1).optional(),
  texts: z.array(z.string().min(1)).min(1).optional(),
}).refine((d) => d.text || d.texts, {
  message: "Either 'text' or 'texts' required",
});

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

  const raw = await req.json().catch(() => ({}));
  const parsed = embeddingSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { workspaceId, text, texts } = parsed.data;

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

    // Unreachable due to Zod refine, but TypeScript safety
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
