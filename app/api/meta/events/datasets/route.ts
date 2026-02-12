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
import { ensureDatasetId } from "@/lib/meta/events";
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

async function validateAccess(
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

  const forbidden = await validateAccess(req, withCookies, userId, workspaceId);
  if (forbidden) return forbidden;

  const limiter = rateLimit(`meta-events-datasets:get:${workspaceId}:${userId}`, { windowMs: 60_000, max: 10 });
  if (!limiter.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 })
    );
  }

  const ensure = req.nextUrl.searchParams.get("ensure") === "true";
  const db = supabaseAdmin();

  try {
    const { token } = await resolveWorkspaceMetaToken(workspaceId);
    if (ensure) {
      const datasetId = await ensureDatasetId({ workspaceId, wabaId, token });
      return withCookies(NextResponse.json({ ok: true, datasetId, created: true }));
    }

    let datasetId: string | null = null;
    try {
      const existing = await metaGraphFetch<{ id?: string; data?: Array<{ id?: string }> }>(
        `${wabaId}/dataset`,
        token
      );
      datasetId = existing?.id ?? existing?.data?.[0]?.id ?? null;
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (!status || status === 404) {
        datasetId = null;
      } else {
        throw err;
      }
    }

    if (datasetId) {
      await db
        .from("meta_whatsapp_connections")
        .upsert({ workspace_id: workspaceId, waba_id: wabaId, dataset_id: datasetId }, { onConflict: "workspace_id,waba_id" });
    }

    return withCookies(NextResponse.json({ ok: true, datasetId, created: false }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return withCookies(NextResponse.json({ error: "dataset_error", reason: message }, { status: 502 }));
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

  const forbidden = await validateAccess(req, withCookies, userId, workspaceId);
  if (forbidden) return forbidden;

  const limiter = rateLimit(`meta-events-datasets:post:${workspaceId}:${userId}`, { windowMs: 60_000, max: 5 });
  if (!limiter.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 })
    );
  }

  try {
    const { token } = await resolveWorkspaceMetaToken(workspaceId);
    const datasetId = await ensureDatasetId({ workspaceId, wabaId, token });
    return withCookies(NextResponse.json({ ok: true, datasetId, created: true }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return withCookies(NextResponse.json({ error: "dataset_error", reason: message }, { status: 502 }));
  }
});
