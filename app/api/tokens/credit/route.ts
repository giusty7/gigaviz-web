import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { ensureProfile } from "@/lib/profiles";
import { getUserWorkspaces } from "@/lib/workspaces";
import { creditTokens } from "@/lib/tokens";
import { rateLimit } from "@/lib/rate-limit";

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
  if (!profile.is_admin) {
    return withCookies(
      NextResponse.json({ error: "forbidden" }, { status: 403 })
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`token-credit:${user.id}:${ip}`, {
    windowMs: 60_000,
    max: 10,
  });

  if (!limit.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limit.resetAt }, { status: 429 })
    );
  }

  const body = await req.json().catch(() => null);
  const workspaceId =
    typeof body?.workspace_id === "string" ? body.workspace_id : null;
  const amount = Number(body?.amount || 0);
  const note = typeof body?.note === "string" ? body.note : null;

  if (!workspaceId || !Number.isFinite(amount) || amount <= 0) {
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

  try {
    const balance = await creditTokens(
      workspaceId,
      amount,
      "admin_credit",
      note,
      user.id
    );
    return withCookies(NextResponse.json({ balance }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "token_error";
    return withCookies(
      NextResponse.json({ error: message }, { status: 400 })
    );
  }
}
