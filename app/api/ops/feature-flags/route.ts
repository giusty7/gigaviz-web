import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { assertOpsEnabled } from "@/lib/ops/guard";
import {
  getFeatureFlags,
  upsertFeatureFlag,
  getWorkspaceFeatureFlags,
  setWorkspaceFeatureFlag,
  deleteWorkspaceFeatureFlag,
} from "@/lib/ops/feature-flags";
import { logger } from "@/lib/logging";

/**
 * GET /api/ops/feature-flags
 * List all feature flags or workspace overrides
 */
export async function GET(request: Request) {
  try {
    assertOpsEnabled();
    const ctx = await requirePlatformAdmin();
    if (!ctx.ok) {
      return NextResponse.json({ error: ctx.reason }, { status: ctx.reason === "not_authenticated" ? 401 : 403 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (workspaceId) {
      const flags = await getWorkspaceFeatureFlags(workspaceId);
      return NextResponse.json({ flags });
    }

    const flags = await getFeatureFlags();
    return NextResponse.json({ flags });
  } catch (err) {
    logger.error("[ops] feature-flags GET error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ops/feature-flags
 * Create or update feature flag
 */
export async function POST(request: Request) {
  try {
    assertOpsEnabled();
    const ctx = await requirePlatformAdmin();
    if (!ctx.ok) {
      return NextResponse.json({ error: ctx.reason }, { status: ctx.reason === "not_authenticated" ? 401 : 403 });
    }

    const body = await request.json();
    const { flagKey, flagName, description, defaultEnabled, workspaceId, enabled, reason } = body;

    // Set workspace override
    if (workspaceId && flagKey && enabled !== undefined) {
      const flag = await setWorkspaceFeatureFlag({
        workspaceId,
        flagKey,
        enabled,
        reason,
        setBy: ctx.user.id,
      });
      return NextResponse.json({ flag });
    }

    // Create/update global flag
    if (!flagKey || !flagName || defaultEnabled === undefined) {
      return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
    }

    const flag = await upsertFeatureFlag({
      flagKey,
      flagName,
      description,
      defaultEnabled,
    });

    return NextResponse.json({ flag });
  } catch (err) {
    logger.error("[ops] feature-flags POST error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ops/feature-flags
 * Remove workspace feature flag override
 */
export async function DELETE(request: Request) {
  try {
    assertOpsEnabled();
    const ctx = await requirePlatformAdmin();
    if (!ctx.ok) {
      return NextResponse.json({ error: ctx.reason }, { status: ctx.reason === "not_authenticated" ? 401 : 403 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const flagKey = searchParams.get("flagKey");

    if (!workspaceId || !flagKey) {
      return NextResponse.json({ error: "missing_parameters" }, { status: 400 });
    }

    await deleteWorkspaceFeatureFlag(workspaceId, flagKey);

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("[ops] feature-flags DELETE error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 }
    );
  }
}
