import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import {
  grantEntitlement,
  revokeEntitlement,
  grantAllEntitlements,
  revokeAllEntitlements,
  getWorkspaceWithEntitlements,
  searchWorkspaces,
  getAllEntitlementKeys,
} from "@/lib/ops/entitlement-grants";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const GrantSchema = z.object({
  workspaceId: z.string().uuid(),
  entitlementKey: z.string().min(1),
  reason: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

const RevokeSchema = z.object({
  workspaceId: z.string().uuid(),
  entitlementKey: z.string().min(1),
  reason: z.string().optional(),
});

const BulkActionSchema = z.object({
  workspaceId: z.string().uuid(),
  action: z.enum(["grant_all", "revoke_all"]),
  reason: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

/**
 * GET /api/ops/entitlement-grants
 * Query params:
 *   - workspaceId: Get entitlements for specific workspace
 *   - search: Search workspaces by name/slug
 *   - keys: Get all available entitlement keys
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const searchQuery = searchParams.get("search");
  const getKeys = searchParams.get("keys");

  // Return all entitlement keys
  if (getKeys === "true") {
    return NextResponse.json({ keys: getAllEntitlementKeys() });
  }

  // Search workspaces
  if (searchQuery !== null) {
    const workspaces = await searchWorkspaces(searchQuery);
    return NextResponse.json({ workspaces });
  }

  // Get workspace with entitlements
  if (workspaceId) {
    const workspace = await getWorkspaceWithEntitlements(workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }
    return NextResponse.json({ workspace });
  }

  return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
});

/**
 * POST /api/ops/entitlement-grants
 * Actions: grant, revoke, grant_all, revoke_all
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const action = body.action;

    // Bulk actions
    if (action === "grant_all" || action === "revoke_all") {
      const parsed = BulkActionSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid request", details: parsed.error.issues },
          { status: 400 }
        );
      }

      if (action === "grant_all") {
        const result = await grantAllEntitlements({
          workspaceId: parsed.data.workspaceId,
          grantedBy: admin.user.id,
          grantedByEmail: admin.actorEmail ?? "unknown@system",
          reason: parsed.data.reason,
          expiresAt: parsed.data.expiresAt,
        });
        return NextResponse.json(result);
      } else {
        const result = await revokeAllEntitlements({
          workspaceId: parsed.data.workspaceId,
          revokedBy: admin.user.id,
          revokedByEmail: admin.actorEmail ?? "unknown@system",
          reason: parsed.data.reason,
        });
        return NextResponse.json(result);
      }
    }

    // Single grant
    if (action === "grant") {
      const parsed = GrantSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid request", details: parsed.error.issues },
          { status: 400 }
        );
      }

      const result = await grantEntitlement({
        workspaceId: parsed.data.workspaceId,
        entitlementKey: parsed.data.entitlementKey,
        grantedBy: admin.user.id,
        grantedByEmail: admin.actorEmail ?? "unknown@system",
        reason: parsed.data.reason,
        expiresAt: parsed.data.expiresAt,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, entitlementKey: parsed.data.entitlementKey });
    }

    // Single revoke
    if (action === "revoke") {
      const parsed = RevokeSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid request", details: parsed.error.issues },
          { status: 400 }
        );
      }

      const result = await revokeEntitlement({
        workspaceId: parsed.data.workspaceId,
        entitlementKey: parsed.data.entitlementKey,
        revokedBy: admin.user.id,
        revokedByEmail: admin.actorEmail ?? "unknown@system",
        reason: parsed.data.reason,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, entitlementKey: parsed.data.entitlementKey });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    logger.error("[EntitlementGrants API] Error:", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
