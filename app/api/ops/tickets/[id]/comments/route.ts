import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { assertOpsEnabled } from "@/lib/ops/guard";
import { addTicketComment } from "@/lib/ops/tickets";
import { logger } from "@/lib/logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const commentSchema = z.object({
  comment: z.string().min(1).max(5000),
  isInternal: z.boolean().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/ops/tickets/[id]/comments - Add comment to ticket
 */
export async function POST(request: NextRequest, context: RouteContext) {
  assertOpsEnabled();

  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = commentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const comment = await addTicketComment(
      id,
      admin.user.id,
      admin.user.email ?? "unknown",
      parsed.data.comment,
      parsed.data.isInternal ?? false
    );

    return NextResponse.json({ comment });
  } catch (err) {
    logger.error("[ops] Add comment error:", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "internal_error" },
      { status: 500 }
    );
  }
}
