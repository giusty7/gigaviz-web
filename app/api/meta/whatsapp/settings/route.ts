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

const patchSchema = z.object({
  workspaceId: z.string().uuid(),
  whitelist: z.array(z.string()).default([]),
  sandboxEnabled: z.boolean().optional(),
});

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const workspaceId = getWorkspaceId(req);
  if (!workspaceId) {
    return workspaceRequiredResponse(withCookies);
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok) {
    return forbiddenResponse(withCookies);
  }

  const db = supabaseAdmin();
  const { data } = await db
    .from("wa_settings")
    .select("sandbox_enabled, test_whitelist")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  return withCookies(
    NextResponse.json({
      workspaceId,
      sandboxEnabled: data?.sandbox_enabled ?? true,
      whitelist: Array.isArray(data?.test_whitelist) ? data?.test_whitelist : [],
    })
  );
}

export async function PATCH(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", reason: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { workspaceId: bodyWorkspaceId, whitelist, sandboxEnabled } = parsed.data;
  const workspaceId = getWorkspaceId(req, undefined, bodyWorkspaceId);
  if (!workspaceId) {
    return workspaceRequiredResponse(withCookies);
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin"])) {
    return forbiddenResponse(withCookies);
  }

  const limiter = rateLimit(`wa-settings:${workspaceId}:${userData.user.id}`, {
    windowMs: 60_000,
    max: 5,
  });
  if (!limiter.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 })
    );
  }

  const db = supabaseAdmin();
  const payload = {
    workspace_id: workspaceId,
    sandbox_enabled: sandboxEnabled ?? true,
    test_whitelist: whitelist,
    updated_at: new Date().toISOString(),
  };

  const { error } = await db.from("wa_settings").upsert(payload);
  if (error) {
    return withCookies(
      NextResponse.json({ error: "db_error", reason: "settings_save_failed" }, { status: 500 })
    );
  }

  return withCookies(
    NextResponse.json({
      workspaceId,
      sandboxEnabled: payload.sandbox_enabled,
      whitelist,
    })
  );
}
