import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import {
  getFeatureFlags,
  upsertFeatureFlag,
  getWorkspaceFeatureFlags,
  setWorkspaceFeatureFlag,
  deleteWorkspaceFeatureFlag,
} from "@/lib/ops/feature-flags";

/**
 * GET /api/ops/feature-flags
 * List all feature flags or workspace overrides
 */
export async function GET(request: Request) {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const { data: adminRow } = await supabase
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRow) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
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
    console.error("[ops] feature-flags GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "internal_error" },
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
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const { data: adminRow } = await supabase
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRow) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
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
        setBy: user.id,
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
    console.error("[ops] feature-flags POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "internal_error" },
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
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const { data: adminRow } = await supabase
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRow) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
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
    console.error("[ops] feature-flags DELETE error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "internal_error" },
      { status: 500 }
    );
  }
}
