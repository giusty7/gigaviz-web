import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getWorkspaceUsageSummary } from "@/lib/usage/server";

export const runtime = "nodejs";

type Ctx =
  | { params: { workspaceId: string } }
  | { params: Promise<{ workspaceId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const params = await Promise.resolve(ctx.params);
  const workspaceId = params?.workspaceId;
  if (!workspaceId) {
    return NextResponse.json({ error: "workspace_required" }, { status: 400 });
  }

  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userErr || !user) {
    return withCookies(NextResponse.json({ error: "unauthorized" }, { status: 401 }));
  }

  const db = supabaseAdmin();
  const { data: membership } = await db
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return withCookies(NextResponse.json({ error: "forbidden" }, { status: 403 }));
  }

  const summary = await getWorkspaceUsageSummary(workspaceId);
  return withCookies(NextResponse.json(summary));
}
