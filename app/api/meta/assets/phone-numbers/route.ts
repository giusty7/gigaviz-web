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
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const schema = z.object({
  workspaceId: z.string().uuid(),
  wabaId: z.string().min(3),
});

export async function GET(req: NextRequest) {
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

  const limiter = rateLimit(`meta-assets-phones:${workspaceId}:${userData.user.id}`, {
    windowMs: 60_000,
    max: 10,
  });
  if (!limiter.ok) {
    return withCookies(NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 }));
  }

  try {
    const token = await getWorkspaceMetaAccessToken(workspaceId);
    const data = await metaGraphFetch<{ data?: Array<Record<string, unknown>> }>(
      `${wabaId}/phone_numbers`,
      token,
      { query: { fields: "id,display_phone_number,verified_name,status,quality_rating" } }
    );
    const list = data?.data ?? [];

    try {
      const db = supabaseAdmin();
      const payload = list
        .map((row) => {
          const id = typeof row.id === "string" ? row.id : null;
          if (!id) return null;
          return {
            workspace_id: workspaceId,
            phone_number_id: id,
            waba_id: wabaId,
            display_phone_number:
              typeof row.display_phone_number === "string" ? row.display_phone_number : null,
            verified_name: typeof row.verified_name === "string" ? row.verified_name : null,
            quality_rating: typeof row.quality_rating === "string" ? row.quality_rating : null,
            updated_at: new Date().toISOString(),
          };
        })
        .filter(Boolean) as Array<Record<string, unknown>>;

      if (payload.length > 0) {
        await db
          .from("meta_assets_cache")
          .upsert(payload, { onConflict: "workspace_id,phone_number_id" });
      }
    } catch {
      // cache best-effort; ignore errors
    }

    return withCookies(NextResponse.json({ data: list }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return withCookies(NextResponse.json({ error: "graph_error", reason: message }, { status: 502 }));
  }
}
