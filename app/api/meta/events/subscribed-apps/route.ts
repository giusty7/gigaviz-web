import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import {
  forbiddenResponse,
  getWorkspaceId,
  requireWorkspaceMember,
  requireWorkspaceRole,
  unauthorizedResponse,
  workspaceRequiredResponse,
} from "@/lib/auth/guard";
import { rateLimit } from "@/lib/rate-limit";
import { metaGraphFetch } from "@/lib/meta/graph";
import { resolveWorkspaceMetaToken } from "@/lib/meta/token";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

const schema = z.object({
  workspaceId: z.string().uuid(),
  wabaId: z.string().min(3),
});

async function authorize(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return { ok: false as const, withCookies, error: unauthorizedResponse(withCookies) };
  return { ok: true as const, supabase, withCookies, userId: userData.user.id };
}

async function ensureAccess(
  req: NextRequest,
  withCookies: (res: NextResponse) => NextResponse,
  userId: string,
  workspaceId: string
) {
  const membership = await requireWorkspaceMember(userId, workspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin"])) {
    return forbiddenResponse(withCookies);
  }
  return null;
}

function getAppId() {
  return process.env.META_APP_ID || process.env.META_BUSINESS_APP_ID || null;
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = await authorize(req);
  if (!auth.ok) return auth.error;
  const { withCookies, userId } = auth;

  const parsed = schema.safeParse({
    workspaceId: req.nextUrl.searchParams.get("workspaceId"),
    wabaId: req.nextUrl.searchParams.get("wabaId"),
  });
  if (!parsed.success) return workspaceRequiredResponse(withCookies);

  const { workspaceId: rawWorkspaceId, wabaId } = parsed.data;
  const workspaceId = getWorkspaceId(req, undefined, rawWorkspaceId);
  if (!workspaceId) return workspaceRequiredResponse(withCookies);

  const denied = await ensureAccess(req, withCookies, userId, workspaceId);
  if (denied) return denied;

  const limiter = rateLimit(`meta-events:subscribed-get:${workspaceId}:${userId}`, { windowMs: 60_000, max: 10 });
  if (!limiter.ok) {
    return withCookies(NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 }));
  }

  const appId = getAppId();
  if (!appId) {
    return withCookies(NextResponse.json({ error: "meta_app_missing" }, { status: 500 }));
  }

  try {
    const { token } = await resolveWorkspaceMetaToken(workspaceId);
    const data = await metaGraphFetch<{ data?: Array<{ app_id?: string }> }>(
      `${wabaId}/subscribed_apps`,
      token,
      { query: { fields: "app_id" } }
    );
    const subscribed = Boolean(data?.data?.some((row) => row.app_id === appId));
    return withCookies(NextResponse.json({ ok: true, subscribed, appId }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return withCookies(NextResponse.json({ error: "graph_error", reason: message }, { status: 502 }));
  }
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = await authorize(req);
  if (!auth.ok) return auth.error;
  const { withCookies, userId } = auth;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", reason: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { workspaceId: rawWorkspaceId, wabaId } = parsed.data;
  const workspaceId = getWorkspaceId(req, undefined, rawWorkspaceId);
  if (!workspaceId) return workspaceRequiredResponse(withCookies);

  const denied = await ensureAccess(req, withCookies, userId, workspaceId);
  if (denied) return denied;

  const limiter = rateLimit(`meta-events:subscribed-post:${workspaceId}:${userId}`, { windowMs: 60_000, max: 5 });
  if (!limiter.ok) {
    return withCookies(NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 }));
  }

  const appId = getAppId();
  if (!appId) {
    return withCookies(NextResponse.json({ error: "meta_app_missing" }, { status: 500 }));
  }

  try {
    const { token } = await resolveWorkspaceMetaToken(workspaceId);
    await metaGraphFetch(`${wabaId}/subscribed_apps`, token, {
      method: "POST",
      body: { subscribed_fields: ["messages", "business_messaging"] },
    });
    return withCookies(NextResponse.json({ ok: true, subscribed: true, appId }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return withCookies(NextResponse.json({ error: "subscribe_failed", reason: message }, { status: 502 }));
  }
});
