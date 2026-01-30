import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireWorkspaceMember } from "@/lib/auth/guard";
import { getAvailableFunctions } from "@/lib/helper/functions";

export const runtime = "nodejs";

/**
 * GET /api/helper/tools/list
 * List available functions for workspace
 */
export async function GET(req: NextRequest) {
  const userRes = await requireUser(req);
  if (!userRes.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user } = userRes;

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

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
    const functions = await getAvailableFunctions(workspaceId, membership.role ?? "member");

    return NextResponse.json({
      ok: true,
      functions,
      count: functions.length,
    });
  } catch (error) {
    console.error("Failed to get functions:", error);
    return NextResponse.json(
      { error: "Failed to retrieve functions" },
      { status: 500 }
    );
  }
}
