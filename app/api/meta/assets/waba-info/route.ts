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
  wabaId: z.string().min(3),
});

/**
 * GET /api/meta/assets/waba-info?workspaceId=...&wabaId=...
 *
 * Fetches WABA details + owner business info directly from Graph API
 * using the WABA ID. This bypasses the need for `me/businesses` which
 * requires `business_management` scope that WhatsApp System User tokens
 * typically don't have.
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return unauthorizedResponse(withCookies);

  const parsed = schema.safeParse({
    workspaceId: req.nextUrl.searchParams.get("workspaceId"),
    wabaId: req.nextUrl.searchParams.get("wabaId"),
  });
  if (!parsed.success) return workspaceRequiredResponse(withCookies);

  const { workspaceId: bodyWorkspaceId, wabaId } = parsed.data;
  const workspaceId = getWorkspaceId(req, undefined, bodyWorkspaceId);
  if (!workspaceId) return workspaceRequiredResponse(withCookies);

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin"])) {
    return forbiddenResponse(withCookies);
  }

  const limiter = rateLimit(`meta-assets-waba-info:${workspaceId}:${userData.user.id}`, {
    windowMs: 60_000,
    max: 10,
  });
  if (!limiter.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 })
    );
  }

  try {
    const token = await getWorkspaceMetaAccessToken(workspaceId);

    // Fetch WABA details + owner business info in one call
    const wabaData = await metaGraphFetch<{
      id?: string;
      name?: string;
      currency?: string;
      timezone_id?: string;
      message_template_namespace?: string;
      owner_business_info?: {
        id?: string;
        name?: string;
      };
      on_behalf_of_business_info?: {
        id?: string;
        name?: string;
      };
    }>(wabaId, token, {
      query: {
        fields:
          "id,name,currency,timezone_id,message_template_namespace,owner_business_info,on_behalf_of_business_info",
      },
    });

    // Extract business info from either owner or on_behalf_of
    const businessInfo =
      wabaData?.owner_business_info ?? wabaData?.on_behalf_of_business_info ?? null;

    return withCookies(
      NextResponse.json({
        waba: {
          id: wabaData?.id ?? wabaId,
          name: wabaData?.name ?? null,
          currency: wabaData?.currency ?? null,
          timezone_id: wabaData?.timezone_id ?? null,
          message_template_namespace: wabaData?.message_template_namespace ?? null,
        },
        business: businessInfo
          ? { id: businessInfo.id ?? null, name: businessInfo.name ?? null }
          : null,
      })
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return withCookies(
      NextResponse.json({ error: "graph_error", reason: message }, { status: 502 })
    );
  }
});
