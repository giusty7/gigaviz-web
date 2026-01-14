import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  forbiddenResponse,
  getWorkspaceId,
  requireWorkspaceMember,
  requireWorkspaceRole,
  unauthorizedResponse,
  workspaceRequiredResponse,
} from "@/lib/auth/guard";

export const runtime = "nodejs";

type CheckResult = {
  ok: boolean;
  reason?: string;
  wabaId?: string;
  phoneNumberId?: string;
  count?: number;
  lastEventAt?: string | null;
  events24h?: number;
  lastSyncedAt?: string | null;
};

type VerifyResponse = {
  ok: boolean;
  checks: {
    token: CheckResult;
    connection: CheckResult;
    templates: CheckResult;
    webhooks: CheckResult;
  };
  recommendations: string[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * GET /api/meta/whatsapp/verify
 * Query params:
 *   workspaceId (required) - overridden by session check
 *
 * Returns: VerifyResponse
 */
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
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin", "member"])) {
    return forbiddenResponse(withCookies);
  }

  const db = supabaseAdmin();
  const recommendations: string[] = [];

  // ─────────────────────────────────────────────────────────
  // 1. Check connection (wa_phone_numbers)
  // ─────────────────────────────────────────────────────────
  const { data: phone } = await db
    .from("wa_phone_numbers")
    .select("phone_number_id, waba_id, display_name, status, last_tested_at, last_test_result")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .maybeSingle();

  const connectionCheck: CheckResult = {
    ok: Boolean(phone?.phone_number_id),
    wabaId: phone?.waba_id ?? undefined,
    phoneNumberId: phone?.phone_number_id ?? undefined,
  };

  if (!connectionCheck.ok) {
    connectionCheck.reason = "No WhatsApp phone number configured";
    recommendations.push("Add your WhatsApp Phone Number ID and WABA ID in the Connections form.");
  }

  // ─────────────────────────────────────────────────────────
  // 2. Check token (meta_tokens)
  // ─────────────────────────────────────────────────────────
  const { data: tokenRow } = await db
    .from("meta_tokens")
    .select("id, expires_at")
    .eq("workspace_id", workspaceId)
    .eq("provider", "meta_whatsapp")
    .order("created_at", { ascending: false })
    .maybeSingle();

  let tokenOk = Boolean(tokenRow);
  let tokenReason: string | undefined;

  if (!tokenRow) {
    tokenOk = false;
    tokenReason = "Access token not configured";
    recommendations.push("Add your WhatsApp Access Token in the Connections form.");
  } else if (tokenRow.expires_at) {
    const expiresAt = new Date(tokenRow.expires_at);
    if (expiresAt < new Date()) {
      tokenOk = false;
      tokenReason = "Access token has expired";
      recommendations.push("Your access token has expired. Please update it in Connections.");
    }
  }

  const tokenCheck: CheckResult = {
    ok: tokenOk,
    reason: tokenReason,
  };

  // ─────────────────────────────────────────────────────────
  // 3. Check templates (from DB cache - do NOT call Graph if token missing)
  // ─────────────────────────────────────────────────────────
  let templatesCheck: CheckResult;

  if (!tokenOk) {
    templatesCheck = {
      ok: false,
      reason: "Cannot verify templates: token missing or expired",
      count: 0,
    };
  } else {
    const { count: templateCount } = await db
      .from("wa_templates")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);

    const { data: lastTemplate } = await db
      .from("wa_templates")
      .select("last_synced_at")
      .eq("workspace_id", workspaceId)
      .order("last_synced_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    const count = templateCount ?? 0;
    templatesCheck = {
      ok: count > 0,
      count,
      lastSyncedAt: lastTemplate?.last_synced_at ?? null,
    };

    if (count === 0) {
      templatesCheck.reason = "No templates synced yet";
      recommendations.push("Sync your WhatsApp message templates from the Templates page.");
    }
  }

  // ─────────────────────────────────────────────────────────
  // 4. Check webhooks (meta_webhook_events - last 24h)
  // ─────────────────────────────────────────────────────────
  const dayAgo = new Date(Date.now() - DAY_MS).toISOString();

  const { count: events24h } = await db
    .from("meta_webhook_events")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("channel", "whatsapp")
    .gte("received_at", dayAgo);

  const { data: lastEvent } = await db
    .from("meta_webhook_events")
    .select("received_at")
    .eq("workspace_id", workspaceId)
    .eq("channel", "whatsapp")
    .order("received_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const webhooksCheck: CheckResult = {
    ok: (events24h ?? 0) > 0,
    events24h: events24h ?? 0,
    lastEventAt: lastEvent?.received_at ?? null,
  };

  if (!webhooksCheck.ok) {
    webhooksCheck.reason = "No webhook events received in the last 24 hours";
    recommendations.push(
      "Verify your Meta webhook configuration is pointing to this workspace, or send a test message."
    );
  }

  // ─────────────────────────────────────────────────────────
  // Build final response
  // ─────────────────────────────────────────────────────────
  const allOk =
    tokenCheck.ok && connectionCheck.ok && templatesCheck.ok && webhooksCheck.ok;

  const result: VerifyResponse = {
    ok: allOk,
    checks: {
      token: tokenCheck,
      connection: connectionCheck,
      templates: templatesCheck,
      webhooks: webhooksCheck,
    },
    recommendations,
  };

  return withCookies(NextResponse.json(result));
}
