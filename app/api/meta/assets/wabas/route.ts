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
import { getWorkspaceMetaAccessToken, metaGraphFetch } from "@/lib/meta/graph";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

const schema = z.object({
  workspaceId: z.string().uuid(),
  businessId: z.string().min(3),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return unauthorizedResponse(withCookies);

  const parsed = schema.safeParse({
    workspaceId: req.nextUrl.searchParams.get("workspaceId"),
    businessId: req.nextUrl.searchParams.get("businessId"),
  });
  if (!parsed.success) return workspaceRequiredResponse(withCookies);

  const { workspaceId: bodyWorkspaceId, businessId } = parsed.data;
  const workspaceId = getWorkspaceId(req, undefined, bodyWorkspaceId);
  if (!workspaceId) return workspaceRequiredResponse(withCookies);

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin"])) {
    return forbiddenResponse(withCookies);
  }

  const limiter = rateLimit(`meta-assets-wabas:${workspaceId}:${userData.user.id}`, {
    windowMs: 60_000,
    max: 10,
  });
  if (!limiter.ok) {
    return withCookies(NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 }));
  }

  try {
    const token = await getWorkspaceMetaAccessToken(workspaceId);
    const data = await metaGraphFetch<{ data?: Array<{ id?: string; name?: string }> }>(
      `${businessId}/owned_whatsapp_business_accounts`,
      token,
      { query: { fields: "id,name" } }
    );
    return withCookies(NextResponse.json({ data: data?.data ?? [] }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return withCookies(NextResponse.json({ error: "graph_error", reason: message }, { status: 502 }));
  }
});
