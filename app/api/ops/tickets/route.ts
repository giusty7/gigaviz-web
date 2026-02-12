import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { assertOpsEnabled } from "@/lib/ops/guard";
import { createTicket, listTickets, getTicketStats } from "@/lib/ops/tickets";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
  subject: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

/**
 * GET /api/ops/tickets - List tickets with filters
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  assertOpsEnabled();

  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const assignedTo = searchParams.get("assignedTo") || undefined;
    const workspaceId = searchParams.get("workspaceId") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const tickets = await listTickets({
      status,
      priority,
      assignedTo,
      workspaceId,
      userId,
      limit,
      offset,
    });

    const stats = await getTicketStats();

    return NextResponse.json({ tickets, stats });
  } catch (err) {
    logger.error("[ops] List tickets error:", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "internal_error" },
      { status: 500 }
    );
  }
});

/**
 * POST /api/ops/tickets - Create ticket
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  assertOpsEnabled();

  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const ticket = await createTicket(parsed.data);

    return NextResponse.json({ ticket });
  } catch (err) {
    logger.error("[ops] Create ticket error:", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "internal_error" },
      { status: 500 }
    );
  }
});
