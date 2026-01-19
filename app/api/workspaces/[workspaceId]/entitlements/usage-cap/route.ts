import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { guardWorkspace, forbiddenResponse } from "@/lib/auth/guard";
import { isPlatformAdmin } from "@/lib/platform/admin";
import { supabaseServer } from "@/lib/supabase/server";

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

  const supabase = await supabaseServer();
  const platformAdmin = await isPlatformAdmin(supabase);
  if (!platformAdmin) {
    return forbiddenResponse(withCookies);
  }

  const body = await req.json().catch(() => null);
  const cap = parseCap(body?.cap);
  if (cap === undefined) {
    return withCookies(NextResponse.json({ error: "invalid_cap" }, { status: 400 }));
  }

  if (cap === null) {
    const { error } = await supabase.rpc("set_workspace_entitlement_payload", {
      p_workspace_id: workspaceId,
      p_entitlement_key: "usage_cap_tokens",
      p_enabled: false,
      p_payload: {},
      p_expires_at: null,
      p_reason: "usage_cap_cleared",
    });
    if (error) {
      return withCookies(
        NextResponse.json({ error: error.message || "cap_update_failed" }, { status: 500 })
      );
    }

    return withCookies(NextResponse.json({ workspaceId, cap: null }));
  }

  const { error } = await supabase.rpc("set_workspace_entitlement_payload", {
    p_workspace_id: workspaceId,
    p_entitlement_key: "usage_cap_tokens",
    p_enabled: true,
    p_payload: cap,
    p_expires_at: null,
    p_reason: "usage_cap_updated",
  });
  if (error) {
    return withCookies(
      NextResponse.json({ error: error.message || "cap_update_failed" }, { status: 500 })
    );
  }

  return withCookies(NextResponse.json({ workspaceId, cap }));
}
