import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { ensureProfile } from "@/lib/profiles";
import { getUserWorkspaces } from "@/lib/workspaces";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { canAccess } from "@/lib/entitlements";
import { tokenRates } from "@/lib/tokenRates";
import {
  consumeTokens,
  tokenActionFeatureMap,
} from "@/lib/tokens";
import { rateLimit } from "@/lib/rate-limit";
import { enforceUsageCap, recordUsage } from "@/lib/usage/server";

export async function POST(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userErr || !user) {
    return withCookies(
      NextResponse.json({ error: "unauthorized" }, { status: 401 })
    );
  }

  const profile = await ensureProfile(user);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`token-consume:${user.id}:${ip}`, {
    windowMs: 60_000,
    max: 30,
  });

  if (!limit.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limit.resetAt }, { status: 429 })
    );
  }

  const body = await req.json().catch(() => null);
  const workspaceId =
    typeof body?.workspace_id === "string" ? body.workspace_id : null;
  const action = typeof body?.action === "string" ? body.action : null;
  const refType = typeof body?.ref_type === "string" ? body.ref_type : null;
  const refId = typeof body?.ref_id === "string" ? body.ref_id : null;

  if (!workspaceId || !action || !(action in tokenRates)) {
    return withCookies(
      NextResponse.json({ error: "invalid_request" }, { status: 400 })
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
  const { data: subscription } = await db
    .from("subscriptions")
    .select("workspace_id, plan_id, billing_mode, seat_limit, status")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  const planId = subscription?.plan_id ?? "free_locked";
  const featureKey = tokenActionFeatureMap[action as keyof typeof tokenActionFeatureMap];

  if (!canAccess({ plan_id: planId, is_admin: profile.is_admin }, featureKey)) {
    return withCookies(
      NextResponse.json({ error: "plan_locked" }, { status: 403 })
    );
  }

  const cost = tokenRates[action as keyof typeof tokenRates].tokens;
  const capCheck = await enforceUsageCap(workspaceId, "usage_cap_tokens", cost, "tokens");
  if (!capCheck.allowed) {
    return withCookies(
      NextResponse.json(
        {
          error: "usage_limit_reached",
          cap: capCheck.cap,
          used: capCheck.used,
          attempted: capCheck.attempted,
        },
        { status: 402 }
      )
    );
  }

  try {
    const balance = await consumeTokens(workspaceId, cost, {
      feature_key: featureKey,
      ref_type: refType,
      ref_id: refId,
      created_by: user.id,
    });

    await recordUsage({
      workspaceId,
      eventType: "tokens",
      amount: cost,
      metadata: {
        route: "/api/tokens/consume",
        action,
        feature: featureKey,
        ref_type: refType,
        ref_id: refId,
        user_id: user.id,
      },
    });

    return withCookies(NextResponse.json({ balance }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "token_error";
    const status = message.includes("insufficient_tokens") ? 402 : 400;
    return withCookies(NextResponse.json({ error: message }, { status }));
  }
}
