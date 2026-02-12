import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { ensureProfile } from "@/lib/profiles";
import { getUserWorkspaces } from "@/lib/workspaces";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { planMeta, type PlanId } from "@/lib/entitlements";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const testChangeSchema = z.object({
  workspace_id: z.string().uuid("workspace_id must be a valid UUID"),
  plan_id: z.string().min(1, "plan_id is required"),
});

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

  const raw = await req.json().catch(() => null);
  const parsed = testChangeSchema.safeParse(raw);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json({ error: "invalid_request", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    );
  }
  const { workspace_id: workspaceId, plan_id: planId } = parsed.data;

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
