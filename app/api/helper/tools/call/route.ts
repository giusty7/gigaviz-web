import { logger } from "@/lib/logging";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireWorkspaceMember } from "@/lib/auth/guard";
import { createFunctionCall, getFunctionCall, updateFunctionCallStatus } from "@/lib/helper/functions";
import { executeFunction } from "@/lib/helper/executor";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

const callRequestSchema = z.object({
  workspaceId: z.string().uuid(),
  functionName: z.string().min(1).max(200),
  parameters: z.record(z.string(), z.unknown()),
  conversationId: z.string().uuid().optional(),
  messageId: z.string().uuid().optional(),
  autoExecute: z.boolean().optional(),
});

const callUpdateSchema = z.object({
  callId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  action: z.enum(["confirm", "cancel"]),
});

/**
 * POST /api/helper/tools/call
 * Create and optionally execute a function call
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const userRes = await requireUser(req);
  if (!userRes.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user } = userRes;

  const body = await req.json();
  const { workspaceId, functionName, parameters, conversationId, messageId, autoExecute } = callRequestSchema.parse(body);

  // Verify workspace access
  const membership = await requireWorkspaceMember(user.id, workspaceId);
  if (!membership.ok) {
    return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
  }

  try {
    // Create function call record
    const call = await createFunctionCall(workspaceId, functionName, parameters, {
      conversationId,
      messageId,
      initiatedBy: user.id,
    });

    if (!call) {
      return NextResponse.json(
        { error: "Failed to create function call" },
        { status: 500 }
      );
    }

    // Auto-execute if confirmed or autoExecute is true
    if (call.status === "confirmed" || autoExecute) {
      const result = await executeFunction(call.id, workspaceId);
      
      return NextResponse.json({
        ok: true,
        callId: call.id,
        status: result.success ? "completed" : "failed",
        result: result.result,
        error: result.error,
      });
    }

    // Return pending call (needs confirmation)
    return NextResponse.json({
      ok: true,
      callId: call.id,
      status: "pending",
      requiresConfirmation: true,
    });
  } catch (error) {
    logger.error("Function call failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Call failed" },
      { status: 500 }
    );
  }
});

/**
 * GET /api/helper/tools/call
 * Get function call status
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const userRes = await requireUser(req);
  if (!userRes.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user } = userRes;

  const { searchParams } = new URL(req.url);
  const callId = searchParams.get("callId");
  const workspaceId = searchParams.get("workspaceId");

  if (!callId || !workspaceId) {
    return NextResponse.json(
      { error: "callId and workspaceId required" },
      { status: 400 }
    );
  }

  // Verify workspace access
  const membership = await requireWorkspaceMember(user.id, workspaceId);
  if (!membership.ok) {
    return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
  }

  try {
    const call = await getFunctionCall(callId);
    if (!call || call.workspaceId !== workspaceId) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      call,
    });
  } catch (error) {
    logger.error("Failed to get call status:", error);
    return NextResponse.json(
      { error: "Failed to retrieve call status" },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/helper/tools/call
 * Confirm or cancel a pending function call
 */
export const PUT = withErrorHandler(async (req: NextRequest) => {
  const userRes = await requireUser(req);
  if (!userRes.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user } = userRes;

  const body = await req.json();
  const { callId, workspaceId, action } = callUpdateSchema.parse(body);

  // Verify workspace access
  const membership = await requireWorkspaceMember(user.id, workspaceId);
  if (!membership.ok) {
    return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
  }

  try {
    const call = await getFunctionCall(callId);
    if (!call || call.workspaceId !== workspaceId) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    if (action === "confirm") {
      // Mark as confirmed and execute
      await updateFunctionCallStatus(callId, "confirmed");
      const result = await executeFunction(callId, workspaceId);
      
      return NextResponse.json({
        ok: true,
        status: result.success ? "completed" : "failed",
        result: result.result,
        error: result.error,
      });
    } else if (action === "cancel") {
      await updateFunctionCallStatus(callId, "cancelled");
      return NextResponse.json({
        ok: true,
        status: "cancelled",
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    logger.error("Failed to update call:", error);
    return NextResponse.json(
      { error: "Failed to update call" },
      { status: 500 }
    );
  }
});
