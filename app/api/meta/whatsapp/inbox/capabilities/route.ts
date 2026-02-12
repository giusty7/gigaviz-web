import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  forbiddenResponse,
  requireWorkspaceMember,
  unauthorizedResponse,
  workspaceRequiredResponse,
} from "@/lib/auth/guard";
import { getWaSettings } from "@/lib/meta/wa-settings";
import { getWorkspaceWhatsappConnectionOrThrow } from "@/lib/meta/wa-connections";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

const paramsSchema = z.object({
  workspaceSlug: z.string().min(1),
});

type CapabilityReasonCode =
  | "PLAN_LOCKED"
  | "NO_CONNECTION"
  | "CONNECTION_INACTIVE"
  | "PHONE_NUMBER_MISSING"
  | "TOKEN_MISSING"
  | "TOKEN_EXPIRED"
  | "CAPABILITY_API_ERROR";

const reasonMessages: Record<CapabilityReasonCode, string> = {
  PLAN_LOCKED: "Messaging is disabled for the current plan. Upgrade to send WhatsApp messages.",
  NO_CONNECTION: "No active WhatsApp connection is configured for this workspace.",
  CONNECTION_INACTIVE: "The WhatsApp connection is inactive. Reconnect to resume messaging.",
  PHONE_NUMBER_MISSING: "WhatsApp phone number ID is missing for the active connection.",
  TOKEN_MISSING: "WhatsApp access token is missing. Reconnect your account to continue.",
  TOKEN_EXPIRED: "WhatsApp access token expired. Reconnect to refresh access.",
  CAPABILITY_API_ERROR: "Unable to verify messaging capability right now.",
};

function mapConnectionCode(code: string | undefined): CapabilityReasonCode {
  switch (code) {
    case "wa_connection_missing":
      return "NO_CONNECTION";
    case "wa_connection_inactive":
      return "CONNECTION_INACTIVE";
    case "wa_phone_number_missing":
      return "PHONE_NUMBER_MISSING";
    case "wa_token_missing":
      return "TOKEN_MISSING";
    default:
      return "CAPABILITY_API_ERROR";
  }
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const url = new URL(req.url);
  const parsed = paramsSchema.safeParse({ workspaceSlug: url.searchParams.get("workspaceSlug") });
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        {
          ok: false,
          error: "bad_request",
          reason: "invalid_workspace",
        },
        { status: 400 }
      )
    );
  }

  const { workspaceSlug } = parsed.data;
  const db = supabaseAdmin();

  const { data: workspaceRow, error: workspaceError } = await db
    .from("workspaces")
    .select("id")
    .eq("slug", workspaceSlug)
    .maybeSingle();

  if (workspaceError) {
    return withCookies(
      NextResponse.json(
        {
          ok: false,
          error: "db_error",
          reason: "workspace_lookup_failed",
        },
        { status: 500 }
      )
    );
  }

  if (!workspaceRow?.id) {
    return workspaceRequiredResponse(withCookies);
  }

  const workspaceId = workspaceRow.id;

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok) {
    return forbiddenResponse(withCookies);
  }

  const settings = await getWaSettings(workspaceId);

  const devEmails = (process.env.DEV_FULL_ACCESS_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const devOverride = devEmails.includes((userData.user.email || "").toLowerCase());

  const { data: subscription } = await db
    .from("subscriptions")
    .select("plan_id")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  const planId = (subscription?.plan_id as string | null) ?? "free_locked";

  if (planId === "free_locked" && !devOverride) {
    return withCookies(
      NextResponse.json({
        ok: true,
        canSendText: false,
        canSendTemplates: false,
        reasonCode: "PLAN_LOCKED" as CapabilityReasonCode,
        reason: reasonMessages.PLAN_LOCKED,
        planId,
        sandboxEnabled: settings.sandboxEnabled,
        sandboxWhitelist: settings.whitelist,
      })
    );
  }

  const connectionResult = await getWorkspaceWhatsappConnectionOrThrow({
    workspaceId,
    requireActive: true,
  });

  let reasonCode: CapabilityReasonCode | null = null;
  let connectionStatus: string | null = null;

  if (!connectionResult.ok) {
    reasonCode = mapConnectionCode(connectionResult.code);
  } else {
    connectionStatus = connectionResult.connection.status ?? "active";
    const expiresAt = connectionResult.connection.tokenExpiresAt;
    if (expiresAt && Date.parse(expiresAt) < Date.now()) {
      reasonCode = "TOKEN_EXPIRED";
    }
  }

  const responsePayload = {
    ok: true,
    canSendText: !reasonCode,
    canSendTemplates: !reasonCode,
    reasonCode,
    reason: reasonCode ? reasonMessages[reasonCode] : null,
    planId,
    connectionStatus,
    sandboxEnabled: settings.sandboxEnabled,
    sandboxWhitelist: settings.whitelist,
  } satisfies Record<string, unknown>;

  return withCookies(NextResponse.json(responsePayload));
});

export const POST = withErrorHandler(async () => {
  return NextResponse.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
});
