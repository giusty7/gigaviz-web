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
import { logger } from "@/lib/logging";

const schema = z.object({
  workspaceId: z.string().uuid(),
  phoneNumberId: z.string().min(6),
  wabaId: z.string().min(3).optional().nullable(),
  accessToken: z.string().min(10),
  displayName: z.string().min(1).optional().nullable(),
});

export const runtime = "nodejs";

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
        {
          error: "bad_request",
          reason: "invalid_payload",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      )
    );
  }

  const { workspaceId: bodyWorkspaceId, phoneNumberId, wabaId, accessToken, displayName } =
    parsed.data;
  const workspaceId = getWorkspaceId(req, undefined, bodyWorkspaceId);
  if (!workspaceId) {
    return workspaceRequiredResponse(withCookies);
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin"])) {
    return forbiddenResponse(withCookies);
  }

  const db = supabaseAdmin();

  const phonePayload = {
    workspace_id: workspaceId,
    phone_number_id: phoneNumberId,
    waba_id: wabaId ?? null,
    display_name: displayName ?? null,
    status: "active",
  };

  const { data: phone, error: phoneError } = await db
    .from("wa_phone_numbers")
    .upsert(phonePayload, { onConflict: "workspace_id,phone_number_id" })
    .select("phone_number_id, waba_id, display_name, status, last_tested_at, last_test_result")
    .single();

  if (phoneError || !phone) {
    logger.error("[meta-wa-connect] upsert phone failed", { message: phoneError?.message });
    return withCookies(
      NextResponse.json(
        { error: "db_error", reason: "phone_upsert_failed" },
        { status: 500 }
      )
    );
  }

  const { error: deleteError } = await db
    .from("meta_tokens")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("provider", "meta_whatsapp");
  if (deleteError) {
    logger.warn("[meta-wa-connect] cleanup existing tokens failed", { message: deleteError.message });
  }

  const { error: tokenError } = await db.from("meta_tokens").insert({
    workspace_id: workspaceId,
    provider: "meta_whatsapp",
    token_encrypted: accessToken,
    scopes_json: { phone_number_id: phoneNumberId, waba_id: wabaId ?? null },
    expires_at: null,
  });

  if (tokenError) {
    logger.error("[meta-wa-connect] token save failed", { message: tokenError.message });
    return withCookies(
      NextResponse.json(
        { error: "db_error", reason: "token_save_failed" },
        { status: 500 }
      )
    );
  }

  return withCookies(
    NextResponse.json({
      connected: true,
      phoneNumberId: phone.phone_number_id,
      wabaId: phone.waba_id,
      displayName: phone.display_name,
      tokenSet: true,
      status: phone.status ?? "active",
      lastTestedAt: phone.last_tested_at,
      lastTestResult: phone.last_test_result,
    })
  );
}
