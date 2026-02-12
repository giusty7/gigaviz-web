import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { ensureProfile } from "@/lib/profiles";
import { getUserWorkspaces } from "@/lib/workspaces";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { planMeta, type PlanId } from "@/lib/entitlements";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const isProd =
    process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  if (isProd || process.env.ENABLE_BILLING_TEST_MODE !== "true") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userErr || !user) {
    return withCookies(
      NextResponse.json({ error: "unauthorized" }, { status: 401 })
    );
  }

  const profile = await ensureProfile(user);
  if (!profile.is_admin) {
    return withCookies(
      NextResponse.json({ error: "forbidden" }, { status: 403 })
    );
  }

  const body = await req.json().catch(() => null);
  const workspaceId =
    typeof body?.workspace_id === "string" ? body.workspace_id : null;
  const planId = typeof body?.plan_id === "string" ? body.plan_id : null;

  if (!workspaceId || !planId) {
    return withCookies(
      NextResponse.json({ error: "invalid_request" }, { status: 400 })
    );
  }

  const plan = planMeta.find((p) => p.plan_id === planId) as
    | (typeof planMeta)[number]
    | undefined;

  if (!plan) {
    return withCookies(
      NextResponse.json({ error: "invalid_plan" }, { status: 400 })
    );
  }

  const workspaces = await getUserWorkspaces(user.id);
  const allowed = workspaces.some((ws) => ws.id === workspaceId);
  if (!allowed) {
    return withCookies(
      NextResponse.json({ error: "forbidden" }, { status: 403 })
    );
  }

  const db = supabaseAdmin();
  await db
    .from("subscriptions")
    .upsert(
      {
        workspace_id: workspaceId,
        plan_id: plan.plan_id as PlanId,
        billing_mode: plan.billing_mode,
        seat_limit: plan.seat_limit,
        status: "active",
      },
      { onConflict: "workspace_id" }
    );

  return withCookies(NextResponse.json({ ok: true }));
});
