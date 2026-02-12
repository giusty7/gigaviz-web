/**
 * Dashboard preferences API
 * GET: Fetch user's pinned modules
 * PATCH: Update user's pinned modules
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getDashboardPreferences,
  updatePinnedModules,
  type ModuleKey,
} from "@/lib/dashboard/preferences";
import { modulesCatalog } from "@/lib/modules/catalog";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const patchSchema = z.object({
  workspace_id: z.string().min(1, "workspace_id is required"),
  pinned_modules: z.array(z.string()).min(0),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await supabaseServer();
  
  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get workspace_id from query params
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspace_id");

  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspace_id is required" },
      { status: 400 }
    );
  }

  // Verify user has access to this workspace
  // Use admin to bypass RLS recursion (pattern from lib/supabase/route.ts)
  const db = supabaseAdmin();
  const { data: membership } = await db
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: "Access denied to this workspace" },
      { status: 403 }
    );
  }

  // Get preferences
  const pinnedModules = await getDashboardPreferences(user.id, workspaceId);

  return NextResponse.json({ pinnedModules });
});

export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const supabase = await supabaseServer();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse and validate request body
  const raw = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { workspace_id: workspaceId, pinned_modules: pinnedModules } = parsed.data;

  // Verify user has access to this workspace
  // Use admin to bypass RLS recursion (pattern from lib/supabase/route.ts)
  const db = supabaseAdmin();
  const { data: membership } = await db
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: "Access denied to this workspace" },
      { status: 403 }
    );
  }

  // Validate that all module keys exist in catalog
  const validModuleKeys = modulesCatalog.map((m) => m.key);
  const invalidKeys = pinnedModules.filter(
    (key: string) => !validModuleKeys.includes(key as ModuleKey)
  );

  if (invalidKeys.length > 0) {
    return NextResponse.json(
      { error: `Invalid module keys: ${invalidKeys.join(", ")}` },
      { status: 400 }
    );
  }

  // Update preferences
  const result = await updatePinnedModules(
    user.id,
    workspaceId,
    pinnedModules as ModuleKey[]
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Failed to update preferences" },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, pinnedModules });
});
