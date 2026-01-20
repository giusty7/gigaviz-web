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
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { getWorkspaceMetaAccessToken } from "@/lib/meta/graph";
import { ensureDatasetId } from "@/lib/meta/events";
import { logger } from "@/lib/logging";

export const runtime = "nodejs";

const schema = z.object({
  workspaceId: z.string().uuid(),
  wabaId: z.string().min(3),
});

export async function POST(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

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

  const { workspaceId: bodyWorkspaceId, wabaId } = parsed.data;
  const workspaceId = getWorkspaceId(req, undefined, bodyWorkspaceId);
  if (!workspaceId) {
    return workspaceRequiredResponse(withCookies);
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin"])) {
    return forbiddenResponse(withCookies);
  }

  const limiter = rateLimit(`wa-dataset:${workspaceId}:${userData.user.id}`, {
    windowMs: 60_000,
    max: 5,
  });
  if (!limiter.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 })
    );
  }

  try {
    const token = await getWorkspaceMetaAccessToken(workspaceId);
    const datasetId = await ensureDatasetId({ workspaceId, wabaId, token });

    const db = supabaseAdmin();
    const { error: upsertError } = await db.from("meta_whatsapp_connections").upsert(
      {
        workspace_id: workspaceId,
        waba_id: wabaId,
        dataset_id: datasetId,
      },
      { onConflict: "workspace_id,waba_id" }
    );

    if (upsertError) {
      logger.error("[wa-dataset] upsert failed", { message: upsertError.message, workspaceId });
    }

    return withCookies(NextResponse.json({ ok: true, datasetId }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return withCookies(
      NextResponse.json({ error: "dataset_failed", reason: message }, { status: 502 })
    );
  }
}
