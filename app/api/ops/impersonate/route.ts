import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { assertOpsEnabled } from "@/lib/ops/guard";
import { logImpersonationStart, logImpersonationEnd } from "@/lib/ops/audit";
import { logger } from "@/lib/logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const startSchema = z.object({
  targetUserId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  reason: z.string().min(10).max(500),
  durationMinutes: z.number().int().min(5).max(480).default(60),
});

const endSchema = z.object({
  impersonationId: z.string().uuid(),
});

/**
 * POST /api/ops/impersonate/start
 * Start impersonation session
 */
export async function POST(request: NextRequest) {
  assertOpsEnabled();

  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = startSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { targetUserId, workspaceId, reason, durationMinutes } = parsed.data;
    const durationInterval = `${durationMinutes} minutes`;

    const supabase = await supabaseServer();
    const { data, error } = await supabase.rpc("ops_start_impersonation", {
      p_target_user_id: targetUserId,
      p_workspace_id: workspaceId,
      p_reason: reason,
      p_duration: durationInterval,
    });

    if (error) {
      logger.error("[ops] Start impersonation error:", { error: error.message || "impersonation_failed" });
      return NextResponse.json(
        { error: error.message || "impersonation_failed" },
        { status: 500 }
      );
    }

    const result = data?.[0];
    if (!result) {
      return NextResponse.json(
        { error: "impersonation_failed" },
        { status: 500 }
      );
    }

    // Log to audit trail
    await logImpersonationStart({
      actorUserId: admin.user.id,
      targetUserId,
      workspaceId,
      impersonationId: result.impersonation_id,
      reason,
      durationMinutes,
    });

    return NextResponse.json({
      impersonationId: result.impersonation_id,
      expiresAt: result.expires_at,
    });
  } catch (err) {
    logger.error("[ops] Start impersonation exception:", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "internal_error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ops/impersonate
 * End impersonation session
 */
export async function DELETE(request: NextRequest) {
  assertOpsEnabled();

  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = endSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { impersonationId } = parsed.data;

    // Get impersonation details for audit
    const db = supabaseAdmin();
    const { data: impersonation } = await db
      .from("ops_impersonations")
      .select("target_user_id, workspace_id")
      .eq("id", impersonationId)
      .single();

    const supabase = await supabaseServer();
    const { data, error } = await supabase.rpc("ops_end_impersonation", {
      p_impersonation_id: impersonationId,
    });

    if (error) {
      logger.error("[ops] End impersonation error:", { error: error.message || "end_impersonation_failed" });
      return NextResponse.json(
        { error: error.message || "end_impersonation_failed" },
        { status: 500 }
      );
    }

    // Log to audit trail
    if (impersonation) {
      await logImpersonationEnd({
        actorUserId: admin.user.id,
        targetUserId: impersonation.target_user_id,
        workspaceId: impersonation.workspace_id,
        impersonationId,
      });
    }

    return NextResponse.json({ ended: data === true });
  } catch (err) {
    logger.error("[ops] End impersonation exception:", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "internal_error" },
      { status: 500 }
    );
  }
}
