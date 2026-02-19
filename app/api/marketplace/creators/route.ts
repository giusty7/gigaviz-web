import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const dynamic = "force-dynamic";

const creatorProfileSchema = z.object({
  display_name: z.string().min(1).max(200),
  bio: z.string().max(2000).optional(),
  website_url: z.string().url().max(500).optional().or(z.literal("")),
  payout_email: z.string().email().max(200).optional().or(z.literal("")),
});

/**
 * GET /api/marketplace/creators
 * Get creator profile for current workspace
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await supabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = request.cookies.get("gv_workspace_id")?.value;
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace selected" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("marketplace_creators")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  return NextResponse.json({ profile: profile || null });
});

/**
 * POST /api/marketplace/creators
 * Create or update creator profile (upsert)
 *
 * SECURITY: workspace_id from auth context, not client body.
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await supabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = request.cookies.get("gv_workspace_id")?.value;
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace selected" }, { status: 400 });
  }

  // Verify workspace membership
  const { data: membership } = await supabase
    .from("workspace_memberships")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = creatorProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "invalid_input" },
      { status: 400 }
    );
  }

  const db = supabaseAdmin();

  const { data: profile, error: upsertError } = await db
    .from("marketplace_creators")
    .upsert({
      workspace_id: workspaceId,
      display_name: parsed.data.display_name,
      bio: parsed.data.bio || null,
      website_url: parsed.data.website_url || null,
      payout_email: parsed.data.payout_email || null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "workspace_id",
    })
    .select()
    .single();

  if (upsertError) {
    logger.error("Creator profile upsert failed", { error: upsertError, workspaceId });
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }

  logger.info("Creator profile updated", { workspaceId });
  return NextResponse.json({ success: true, profile });
});
