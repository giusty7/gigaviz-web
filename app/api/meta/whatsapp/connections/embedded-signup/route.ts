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
import { getGraphApiVersion, graphUrl } from "@/lib/meta/graph";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

const schema = z.object({
  workspaceSlug: z.string().min(1),
  label: z.string().min(1).optional().nullable(),
  waba_id: z.string().min(3),
  phone_number_id: z.string().min(3),
  businessId: z.string().optional().nullable(),
  code: z.string().min(4),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
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
  const graphVersion = getGraphApiVersion();

  let accessToken: string | undefined;
  let expiresAt: string | null = null;

  try {
    const tokenRes = await fetch(`${graphUrl(graphVersion)}/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
      }).toString(),
    });
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

  // ─────────────────────────────────────────────────────────
  // ENRICHMENT: Fetch official metadata from Graph API
  // ─────────────────────────────────────────────────────────
  let enrichedData: {
    display_phone_number?: string;
    verified_name?: string;
    quality_rating?: string;
  } = {};

  try {
    const enrichUrl = `${graphUrl(graphVersion)}/${phone_number_id}?fields=id,display_phone_number,verified_name,quality_rating`;
    const enrichRes = await fetch(enrichUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (enrichRes.ok) {
      const phoneDetails = (await enrichRes.json()) as {
        display_phone_number?: string;
        verified_name?: string;
        quality_rating?: string;
      };
      
      enrichedData = {
        display_phone_number: phoneDetails.display_phone_number,
        verified_name: phoneDetails.verified_name,
        quality_rating: phoneDetails.quality_rating,
      };

      // Update wa_phone_numbers display_name if user didn't provide label
      if (!label && (phoneDetails.verified_name || phoneDetails.display_phone_number)) {
        const autoName = phoneDetails.verified_name ?? phoneDetails.display_phone_number ?? "WhatsApp Line";
        await db
          .from("wa_phone_numbers")
          .update({ display_name: autoName })
          .eq("id", phone.id);
        phone.display_name = autoName;
      }

      // Cache in meta_assets_cache for quick lookup
      await db
        .from("meta_assets_cache")
        .upsert(
          {
            workspace_id: workspace.id,
            phone_number_id,
            waba_id,
            display_phone_number: phoneDetails.display_phone_number ?? null,
            verified_name: phoneDetails.verified_name ?? null,
            quality_rating: phoneDetails.quality_rating ?? null,
            last_synced_at: new Date().toISOString(),
            last_error: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "workspace_id,phone_number_id" }
        );
    } else {
      // Cache error state
      const errorText = await enrichRes.text();
      await db.from("meta_assets_cache").upsert(
        {
          workspace_id: workspace.id,
          phone_number_id,
          waba_id,
          last_error: `HTTP ${enrichRes.status}: ${errorText.substring(0, 200)}`,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "workspace_id,phone_number_id" }
      );
    }
  } catch (enrichErr) {
    // Log but don't fail the whole signup
    logger.warn("[meta-embedded-signup] enrichment failed", {
      phoneNumberId: phone_number_id,
      message: enrichErr instanceof Error ? enrichErr.message : "unknown",
    });
    // Cache error state (silent fail if cache unavailable)
    try {
      await db.from("meta_assets_cache").upsert(
        {
          workspace_id: workspace.id,
          phone_number_id,
          waba_id,
          last_error: enrichErr instanceof Error ? enrichErr.message : "Enrichment failed",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "workspace_id,phone_number_id" }
      );
    } catch {
      // Silent fail on cache error logging
    }
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
      displayPhoneNumber: enrichedData.display_phone_number ?? null,
      verifiedName: enrichedData.verified_name ?? null,
      qualityRating: enrichedData.quality_rating ?? null,
      status: phone.status ?? "active",
      tokenSet: true,
    })
  );
});
