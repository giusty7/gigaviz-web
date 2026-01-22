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
import { getMetaHubTestEnvStatus } from "@/lib/meta-hub/test-env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";
import { getGraphApiVersion, graphUrl } from "@/lib/meta/graph";

const schema = z.object({
  workspaceId: z.string().uuid(),
  phoneNumberId: z.string().min(3).optional(),
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const envStatus = getMetaHubTestEnvStatus();
  if (envStatus.connectionTestMissing.length > 0) {
    return withCookies(
      NextResponse.json(
        {
          ok: false,
          error: "missing_env",
          missing: envStatus.connectionTestMissing,
          message: "Missing required environment variables for connection test.",
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
        { error: "bad_request", reason: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { workspaceId: bodyWorkspaceId, phoneNumberId } = parsed.data;
  const workspaceId = getWorkspaceId(req, undefined, bodyWorkspaceId);
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

  const phoneQuery = db
    .from("wa_phone_numbers")
    .select("phone_number_id, waba_id, display_name, status")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (phoneNumberId) {
    phoneQuery.eq("phone_number_id", phoneNumberId);
  }

  const { data: phone, error: phoneError } = await phoneQuery.maybeSingle();
  if (phoneError || !phone) {
    return withCookies(
      NextResponse.json({ error: "bad_request", reason: "phone_not_found" }, { status: 404 })
    );
  }

  const { data: tokenRow, error: tokenError } = await db
    .from("meta_tokens")
    .select("token_encrypted")
    .eq("workspace_id", workspaceId)
    .eq("provider", "meta_whatsapp")
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (tokenError || !tokenRow?.token_encrypted) {
    return withCookies(
      NextResponse.json({ error: "bad_request", reason: "token_missing" }, { status: 400 })
    );
  }

  const token = tokenRow.token_encrypted;
  const dryRun = process.env.META_HUB_WA_TEST_DRY_RUN === "true";

  let ok = true;
  let result = "ok";
  let statusCode = 200;

  if (!dryRun) {
    const version = getGraphApiVersion();
    try {
      const url = graphUrl(`${phone.phone_number_id}?fields=id`, version);
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        ok = false;
        statusCode = 502;
        result = json?.error?.message ?? `HTTP_${res.status}`;
      } else {
        result = json?.id ? "validated" : "ok";
      }
    } catch (err) {
      ok = false;
      statusCode = 502;
      result = err instanceof Error ? err.message : "unknown_error";
    }
  } else {
    result = "dry_run_ok";
  }

  const now = new Date().toISOString();
  const updatePayload = {
    last_tested_at: now,
    last_test_result: result,
    status: ok ? "active" : "inactive",
  };

  const { error: updateError } = await db
    .from("wa_phone_numbers")
    .update(updatePayload)
    .eq("workspace_id", workspaceId)
    .eq("phone_number_id", phone.phone_number_id);

  if (updateError) {
    logger.warn("[meta-wa-test] update last_tested failed", { message: updateError.message });
  }

  return withCookies(
    NextResponse.json(
      {
        ok,
        phoneNumberId: phone.phone_number_id,
        wabaId: phone.waba_id,
        status: updatePayload.status,
        lastTestedAt: now,
        result,
        dryRun,
      },
      { status: ok ? 200 : statusCode }
    )
  );
}
