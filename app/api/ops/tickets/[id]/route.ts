import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { assertOpsEnabled } from "@/lib/ops/guard";
import { getTicket, updateTicket, getTicketComments } from "@/lib/ops/tickets";
import { logger } from "@/lib/logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/ops/tickets/[id] - Get ticket details with comments
 */
export async function GET(request: NextRequest, context: RouteContext) {
  assertOpsEnabled();

  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const ticket = await getTicket(id);
    if (!ticket) {
      return NextResponse.json({ error: "ticket_not_found" }, { status: 404 });
    }

    const comments = await getTicketComments(id);

    return NextResponse.json({ ticket, comments });
  } catch (err) {
    logger.error("[ops] Get ticket error:", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "internal_error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ops/tickets/[id] - Update ticket
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  assertOpsEnabled();

  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const ticket = await updateTicket(id, parsed.data);

    return NextResponse.json({ ticket });
  } catch (err) {
    logger.error("[ops] Update ticket error:", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "internal_error" },
      { status: 500 }
    );
  }
}
