import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { isAdminEmail } from "@/lib/admin";
import {
  forbiddenResponse,
  getWorkspaceId,
  requireWorkspaceMember,
  requireWorkspaceRole,
  unauthorizedResponse,
  workspaceRequiredResponse,
} from "@/lib/auth/guard";
import { getMetaHubTestEnvStatus, getWebhookVerifyToken } from "@/lib/meta-hub/test-env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

const schema = z.object({
  workspaceId: z.string().uuid(),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const envStatus = getMetaHubTestEnvStatus();
  if (envStatus.webhookPingMissing.length > 0) {
    return withCookies(
      NextResponse.json(
        {
          ok: false,
          error: "missing_env",
          missing: envStatus.webhookPingMissing,
          message: "Missing required environment variables for webhook test.",
        },
        { status: 400 }
      )
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { ok: false, error: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const workspaceId = getWorkspaceId(req, undefined, parsed.data.workspaceId);
  if (!workspaceId) {
    return workspaceRequiredResponse(withCookies);
  }

  const db = supabaseAdmin();
  const { data: profile } = await db
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .maybeSingle();
  const devEmails = (process.env.DEV_FULL_ACCESS_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const isDevOverride = devEmails.includes((userData.user.email || "").toLowerCase());
  const isAdminOverride = Boolean(profile?.is_admin) || isAdminEmail(userData.user.email) || isDevOverride;

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (
    (!membership.ok && !isAdminOverride) ||
    (membership.ok && !requireWorkspaceRole(membership.role, ["owner", "admin"]) && !isAdminOverride)
  ) {
    return forbiddenResponse(withCookies);
  }

  const verifyToken = getWebhookVerifyToken();
  if (!verifyToken) {
    return withCookies(
      NextResponse.json(
        { ok: false, error: "verify_token_missing", message: "Webhook verify token not configured." },
        { status: 400 }
      )
    );
  }

  const { data: phone } = await db
    .from("wa_phone_numbers")
    .select("phone_number_id")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (!phone?.phone_number_id) {
    return withCookies(
      NextResponse.json(
        { ok: false, error: "connection_missing", message: "No WhatsApp connection configured." },
        { status: 400 }
      )
    );
  }

  const [{ data: metaToken }, { data: waToken }] = await Promise.all([
    db
      .from("meta_tokens")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("provider", "meta_whatsapp")
      .maybeSingle(),
    db
      .from("whatsapp_tokens")
      .select("id")
      .eq("workspace_id", workspaceId)
      .maybeSingle(),
  ]);

  const hasToken = Boolean(metaToken?.id || waToken?.id);
  if (!hasToken) {
    return withCookies(
      NextResponse.json(
        { ok: false, error: "token_missing", message: "WhatsApp token not configured." },
        { status: 400 }
      )
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const url = new URL("/api/webhooks/meta/whatsapp", baseUrl);
  url.searchParams.set("hub.mode", "subscribe");
  url.searchParams.set("hub.verify_token", verifyToken);
  url.searchParams.set("hub.challenge", "ping");

  try {
    const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
    const text = await res.text();
    if (!res.ok || text !== "ping") {
      return withCookies(
        NextResponse.json(
          {
            ok: false,
            error: "verification_failed",
            message: "Webhook verification failed.",
            status: res.status,
          },
          { status: 502 }
        )
      );
    }
  } catch (err) {
    return withCookies(
      NextResponse.json(
        {
          ok: false,
          error: "verification_failed",
          message: err instanceof Error ? err.message : "Webhook verification failed.",
        },
        { status: 502 }
      )
    );
  }

  return withCookies(NextResponse.json({ ok: true }));
});
