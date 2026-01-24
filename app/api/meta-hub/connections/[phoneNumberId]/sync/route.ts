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
import { logger } from "@/lib/logging";
import { metaGraphFetch } from "@/lib/meta/graph";
import { resolveWorkspaceMetaToken } from "@/lib/meta/token";

export const runtime = "nodejs";

const syncSchema = z.object({
  workspaceId: z.string().uuid(),
});

type RouteContext = {
  params: Promise<{ phoneNumberId: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const params = await context.params;
  const phoneNumberId = params.phoneNumberId;
  if (!phoneNumberId || phoneNumberId.length < 3) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", message: "Invalid phone_number_id" },
        { status: 400 }
      )
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = syncSchema.safeParse(body);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", reason: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { workspaceId } = parsed.data;

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin"])) {
    return forbiddenResponse(withCookies);
  }

  const db = supabaseAdmin();

  // Verify connection exists and get WABA ID
  const { data: connection, error: findErr } = await db
    .from("wa_phone_numbers")
    .select("id, phone_number_id, waba_id, display_name")
    .eq("workspace_id", workspaceId)
    .eq("phone_number_id", phoneNumberId)
    .maybeSingle();

  if (findErr || !connection) {
    logger.warn("[meta-hub-connections-sync] connection not found", {
      phoneNumberId,
      workspaceId,
      message: findErr?.message,
    });
    return withCookies(
      NextResponse.json(
        { error: "not_found", message: "Connection not found" },
        { status: 404 }
      )
    );
  }

  // Resolve token for this workspace
  let accessToken: string;
  try {
    const tokenResult = await resolveWorkspaceMetaToken(workspaceId);
    accessToken = tokenResult.token;
  } catch (tokenErr) {
    logger.error("[meta-hub-connections-sync] token resolution failed", {
      phoneNumberId,
      workspaceId,
      message: tokenErr instanceof Error ? tokenErr.message : "unknown",
    });
    return withCookies(
      NextResponse.json(
        { error: "token_missing", message: "No valid Meta token found for this workspace" },
        { status: 403 }
      )
    );
  }

  // Fetch enriched data from Graph API
  let enrichedData: {
    display_phone_number?: string;
    verified_name?: string;
    quality_rating?: string;
  } = {};
  let lastError: string | null = null;

  try {
    const phoneDetails = await metaGraphFetch<{
      display_phone_number?: string;
      verified_name?: string;
      quality_rating?: string;
    }>(`${phoneNumberId}`, accessToken, {
      query: { fields: "id,display_phone_number,verified_name,quality_rating" },
    });

    enrichedData = {
      display_phone_number: phoneDetails.display_phone_number,
      verified_name: phoneDetails.verified_name,
      quality_rating: phoneDetails.quality_rating,
    };

    // Update meta_assets_cache
    await db
      .from("meta_assets_cache")
      .upsert(
        {
          workspace_id: workspaceId,
          phone_number_id: phoneNumberId,
          waba_id: connection.waba_id,
          display_phone_number: phoneDetails.display_phone_number ?? null,
          verified_name: phoneDetails.verified_name ?? null,
          quality_rating: phoneDetails.quality_rating ?? null,
          last_synced_at: new Date().toISOString(),
          last_error: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "workspace_id,phone_number_id" }
      );

    logger.info("[meta-hub-connections-sync] sync successful", {
      phoneNumberId,
      workspaceId,
      hasVerifiedName: !!phoneDetails.verified_name,
      hasDisplayPhone: !!phoneDetails.display_phone_number,
    });
  } catch (enrichErr) {
    lastError = enrichErr instanceof Error ? enrichErr.message : "Sync failed";
    logger.error("[meta-hub-connections-sync] enrichment failed", {
      phoneNumberId,
      workspaceId,
      message: lastError,
    });

    // Update cache with error
    await db
      .from("meta_assets_cache")
      .upsert(
        {
          workspace_id: workspaceId,
          phone_number_id: phoneNumberId,
          waba_id: connection.waba_id,
          last_error: lastError,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "workspace_id,phone_number_id" }
      );

    return withCookies(
      NextResponse.json(
        {
          error: "sync_failed",
          message: "Failed to sync from Meta",
          details: lastError,
        },
        { status: 502 }
      )
    );
  }

  return withCookies(
    NextResponse.json({
      ok: true,
      phoneNumberId: connection.phone_number_id,
      wabaId: connection.waba_id,
      displayPhoneNumber: enrichedData.display_phone_number ?? null,
      verifiedName: enrichedData.verified_name ?? null,
      qualityRating: enrichedData.quality_rating ?? null,
      lastSyncedAt: new Date().toISOString(),
    })
  );
}
