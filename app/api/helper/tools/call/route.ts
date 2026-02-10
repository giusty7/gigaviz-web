import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireWorkspaceMember } from "@/lib/auth/guard";
import { createFunctionCall, getFunctionCall, updateFunctionCallStatus } from "@/lib/helper/functions";
import { executeFunction } from "@/lib/helper/executor";

export const runtime = "nodejs";

type CallRequest = {
  workspaceId: string;
  functionName: string;
  parameters: Record<string, unknown>;
  conversationId?: string;
  messageId?: string;
  autoExecute?: boolean;
};

/**
 * POST /api/helper/tools/call
 * Create and optionally execute a function call
 */
export async function POST(req: NextRequest) {
  const userRes = await requireUser(req);
  if (!userRes.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user } = userRes;

  const body = (await req.json()) as CallRequest;
  const { workspaceId, functionName, parameters, conversationId, messageId, autoExecute } = body;

  if (!workspaceId || !functionName || !parameters) {
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
}

/**
 * GET /api/helper/tools/call
 * Get function call status
 */
export async function GET(req: NextRequest) {
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
}

/**
 * PUT /api/helper/tools/call
 * Confirm or cancel a pending function call
 */
export async function PUT(req: NextRequest) {
  const userRes = await requireUser(req);
  if (!userRes.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user } = userRes;

  const body = await req.json();
  const { callId, workspaceId, action } = body;

  if (!callId || !workspaceId || !action) {
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
}
