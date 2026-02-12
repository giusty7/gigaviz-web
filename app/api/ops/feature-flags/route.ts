import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { assertOpsEnabled } from "@/lib/ops/guard";

const flagPostSchema = z.union([
  // Workspace override
  z.object({
    workspaceId: z.string().uuid(),
    flagKey: z.string().min(1).max(100),
    enabled: z.boolean(),
    reason: z.string().max(500).optional(),
  }),
  // Global flag create/update
  z.object({
    flagKey: z.string().min(1).max(100),
    flagName: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    defaultEnabled: z.boolean(),
  }),
]);
import {
  getFeatureFlags,
  upsertFeatureFlag,
  getWorkspaceFeatureFlags,
  setWorkspaceFeatureFlag,
  deleteWorkspaceFeatureFlag,
} from "@/lib/ops/feature-flags";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

/**
 * GET /api/ops/feature-flags
 * List all feature flags or workspace overrides
 */
export const GET = withErrorHandler(async (request: Request) => {
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
});

/**
 * POST /api/ops/feature-flags
 * Create or update feature flag
 */
export const POST = withErrorHandler(async (request: Request) => {
  try {
    assertOpsEnabled();
    const ctx = await requirePlatformAdmin();
    if (!ctx.ok) {
      return NextResponse.json({ error: ctx.reason }, { status: ctx.reason === "not_authenticated" ? 401 : 403 });
    }

    const body = await request.json();
    const validated = flagPostSchema.parse(body);

    // Set workspace override
    if ("workspaceId" in validated && "enabled" in validated) {
      const flag = await setWorkspaceFeatureFlag({
        workspaceId: validated.workspaceId,
        flagKey: validated.flagKey,
        enabled: validated.enabled,
        reason: "reason" in validated ? validated.reason : undefined,
        setBy: ctx.user.id,
      });
      return NextResponse.json({ flag });
    }

    const { flagKey, flagName, description, defaultEnabled } = validated as { flagKey: string; flagName: string; description?: string; defaultEnabled: boolean };

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
});

/**
 * DELETE /api/ops/feature-flags
 * Remove workspace feature flag override
 */
export const DELETE = withErrorHandler(async (request: Request) => {
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
});
