import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { guardWorkspace, forbiddenResponse } from "@/lib/auth/guard";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ workspaceId: string }> };

function parseCap(input: unknown) {
  if (input === null) return null;
  const num = Number(input);
  if (!Number.isInteger(num)) return undefined;
  if (num < 0 || num > 1_000_000_000) return undefined;
  return num;
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const params = await ctx.params;
  const guard = await guardWorkspace(req, params);
  if (!guard.ok) return guard.response;
  const { withCookies, user, workspaceId } = guard;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limiter = rateLimit(`usage-cap:${workspaceId}:${user.id}:${ip}`, { windowMs: 60_000, max: 10 });
  if (!limiter.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 })
    );
  }

  const adminDb = supabaseAdmin();
  const { data: membership } = await adminDb
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  const role = membership?.role;
  if (!(role === "owner" || role === "admin")) {
    return forbiddenResponse(withCookies);
  }

  const body = await req.json().catch(() => null);
  const cap = parseCap(body?.cap);
  if (cap === undefined) {
    return withCookies(NextResponse.json({ error: "invalid_cap" }, { status: 400 }));
  }

  if (cap === null) {
    await adminDb
      .from("workspace_entitlements")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("key", "usage_cap_tokens");

    return withCookies(NextResponse.json({ workspaceId, cap: null }));
  }

  await adminDb
    .from("workspace_entitlements")
    .upsert(
      {
        workspace_id: workspaceId,
        key: "usage_cap_tokens",
        value: cap,
        payload: {},
      },
      { onConflict: "workspace_id,key" }
    );

  return withCookies(NextResponse.json({ workspaceId, cap }));
}
