import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  forbiddenResponse,
  requireWorkspaceMember,
  requireWorkspaceRole,
  unauthorizedResponse,
} from "@/lib/auth/guard";
import { rateLimit } from "@/lib/rate-limit";
import { findWorkspaceBySlug } from "@/lib/meta/wa-connections";
import { logger } from "@/lib/logging";

export const runtime = "nodejs";

const schema = z.object({
  workspaceSlug: z.string().min(1),
  label: z.string().min(1).optional().nullable(),
  waba_id: z.string().min(3),
  phone_number_id: z.string().min(3),
  businessId: z.string().optional().nullable(),
  code: z.string().min(4),
});

function normalizeGraphVersion(raw?: string | null) {
  const value = (raw || "").trim();
  if (!value) return "v22.0";
  return value.startsWith("v") ? value : `v${value}`;
}

export async function POST(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const limiter = rateLimit(`wa-embedded-signup:${userData.user.id}`, {
    windowMs: 60_000,
    max: 10,
  });
  if (!limiter.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 })
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

  const { workspaceSlug, label, waba_id, phone_number_id, businessId, code } = parsed.data;

  const db = supabaseAdmin();
  const { data: workspace, error: workspaceErr } = await findWorkspaceBySlug(db, workspaceSlug);
  if (workspaceErr || !workspace) {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "workspace_not_found", message: "Workspace tidak ditemukan" },
        { status: 404 }
      )
    );
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspace.id);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin"])) {
    return forbiddenResponse(withCookies);
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "meta_config_missing", message: "Meta config is incomplete" },
        { status: 500 }
      )
    );
  }

  const redirectUri =
    process.env.META_OAUTH_REDIRECT_URI ?? `${req.nextUrl.origin}/api/meta/oauth/callback`;
  const graphVersion = normalizeGraphVersion(process.env.META_GRAPH_VERSION);

  let accessToken: string | undefined;
  let expiresAt: string | null = null;

  try {
    const tokenRes = await fetch(
      `https://graph.facebook.com/${graphVersion}/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code,
        }).toString(),
      }
    );
    const tokenJson = (await tokenRes.json().catch(() => ({}))) as {
      access_token?: string;
      expires_in?: number;
      error?: { message?: string };
    };
    if (!tokenRes.ok || !tokenJson.access_token) {
      return withCookies(
        NextResponse.json(
          {
            ok: false,
            code: "token_exchange_failed",
            message: tokenJson?.error?.message ?? "Meta token exchange failed",
          },
          { status: 502 }
        )
      );
    }
    accessToken = tokenJson.access_token;
    if (tokenJson.expires_in) {
      expiresAt = new Date(Date.now() + tokenJson.expires_in * 1000).toISOString();
    }
  } catch (err) {
    logger.error("[meta-embedded-signup] token exchange failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return withCookies(
      NextResponse.json(
        { ok: false, code: "token_exchange_failed", message: "Gagal menukar kode Meta" },
        { status: 502 }
      )
    );
  }

  const phonePayload = {
    workspace_id: workspace.id,
    phone_number_id,
    waba_id,
    display_name: label ?? null,
    status: "active",
  };

  const { data: phone, error: phoneError } = await db
    .from("wa_phone_numbers")
    .upsert(phonePayload, { onConflict: "workspace_id,phone_number_id" })
    .select("id, phone_number_id, waba_id, display_name, status, last_tested_at, last_test_result")
    .single();

  if (phoneError || !phone) {
    logger.error("[meta-embedded-signup] upsert phone failed", {
      message: phoneError?.message,
    });
    return withCookies(
      NextResponse.json(
        { ok: false, code: "phone_upsert_failed", message: "Gagal menyimpan koneksi" },
        { status: 500 }
      )
    );
  }

  const scopes = {
    phone_number_id,
    waba_id,
    business_id: businessId ?? null,
  };

  const { data: existingToken } = await db
    .from("meta_tokens")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("provider", "meta_whatsapp")
    .eq("scopes_json->>phone_number_id", phone_number_id)
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (existingToken?.id) {
    const { error: updateError } = await db
      .from("meta_tokens")
      .update({
        token_encrypted: accessToken,
        scopes_json: scopes,
        expires_at: expiresAt,
      })
      .eq("id", existingToken.id);
    if (updateError) {
      logger.error("[meta-embedded-signup] token update failed", {
        message: updateError.message,
      });
      return withCookies(
        NextResponse.json(
          { ok: false, code: "token_save_failed", message: "Gagal menyimpan token" },
          { status: 500 }
        )
      );
    }
  } else {
    const { error: insertError } = await db.from("meta_tokens").insert({
      workspace_id: workspace.id,
      provider: "meta_whatsapp",
      token_encrypted: accessToken,
      scopes_json: scopes,
      expires_at: expiresAt,
    });
    if (insertError) {
      logger.error("[meta-embedded-signup] token insert failed", {
        message: insertError.message,
      });
      return withCookies(
        NextResponse.json(
          { ok: false, code: "token_save_failed", message: "Gagal menyimpan token" },
          { status: 500 }
        )
      );
    }
  }

  return withCookies(
    NextResponse.json({
      ok: true,
      connectionId: phone.id,
      phoneNumberId: phone.phone_number_id,
      wabaId: phone.waba_id,
      displayName: phone.display_name,
      status: phone.status ?? "active",
      tokenSet: true,
    })
  );
}
