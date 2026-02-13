import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { guardWorkspace, requireWorkspaceRole } from "@/lib/auth/guard";
import { logger } from "@/lib/logging";
import { metaGraphFetch, graphUrl } from "@/lib/meta/graph";
import { resolveWorkspaceMetaToken } from "@/lib/meta/token";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ phoneNumberId: string }>;
};

/* ── GET: Check OBA status ──────────────────────────────────────── */
export const GET = withErrorHandler(
  async (req: NextRequest, context: RouteContext) => {
    const guard = await guardWorkspace(req);
    if (!guard.ok) return guard.response;
    const { workspaceId, withCookies } = guard;

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

    const db = supabaseAdmin();

    // Verify connection belongs to workspace
    const { data: connection, error: findErr } = await db
      .from("wa_phone_numbers")
      .select("id, phone_number_id, waba_id")
      .eq("workspace_id", workspaceId)
      .eq("phone_number_id", phoneNumberId)
      .maybeSingle();

    if (findErr || !connection) {
      return withCookies(
        NextResponse.json(
          { error: "not_found", message: "Connection not found" },
          { status: 404 }
        )
      );
    }

    // Resolve token
    let accessToken: string;
    try {
      const tokenResult = await resolveWorkspaceMetaToken(workspaceId);
      accessToken = tokenResult.token;
    } catch {
      return withCookies(
        NextResponse.json(
          {
            error: "token_missing",
            message: "No valid Meta token found for this workspace",
          },
          { status: 403 }
        )
      );
    }

    // Query Graph API for OBA status
    try {
      const result = await metaGraphFetch<{
        official_business_account?: {
          id?: string;
          name?: string;
          rejection_reasons?: string[];
        } | string;
        id?: string;
      }>(phoneNumberId, accessToken, {
        query: { fields: "official_business_account" },
      });

      logger.info("[oba] status check successful", {
        phoneNumberId,
        workspaceId,
        oba: typeof result.official_business_account,
      });

      return withCookies(
        NextResponse.json({
          ok: true,
          phoneNumberId,
          official_business_account: result.official_business_account ?? null,
        })
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to check OBA status";
      logger.error("[oba] status check failed", {
        phoneNumberId,
        workspaceId,
        message,
      });
      return withCookies(
        NextResponse.json(
          { error: "graph_error", message },
          { status: 502 }
        )
      );
    }
  }
);

/* ── POST: Request OBA (blue tick) ──────────────────────────────── */
export const POST = withErrorHandler(
  async (req: NextRequest, context: RouteContext) => {
    const guard = await guardWorkspace(req);
    if (!guard.ok) return guard.response;
    const { workspaceId, role, withCookies } = guard;

    // Only owners/admins can request OBA
    if (!requireWorkspaceRole(role, ["owner", "admin"])) {
      return withCookies(
        NextResponse.json({ error: "forbidden" }, { status: 403 })
      );
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

    // Validate request body (lenient — all fields optional, Meta will enforce what it needs)
    const body = await req.json().catch(() => ({}));
    logger.info("[oba] received body", {
      phoneNumberId,
      workspaceId,
      bodyKeys: Object.keys(body),
      hasWebsiteUrl: Boolean(body?.business_website_url),
    });

    const db = supabaseAdmin();

    // Verify connection belongs to workspace
    const { data: connection, error: findErr } = await db
      .from("wa_phone_numbers")
      .select("id, phone_number_id, waba_id, display_name")
      .eq("workspace_id", workspaceId)
      .eq("phone_number_id", phoneNumberId)
      .maybeSingle();

    if (findErr || !connection) {
      return withCookies(
        NextResponse.json(
          { error: "not_found", message: "Connection not found" },
          { status: 404 }
        )
      );
    }

    // Resolve token
    let accessToken: string;
    try {
      const tokenResult = await resolveWorkspaceMetaToken(workspaceId);
      accessToken = tokenResult.token;
    } catch {
      return withCookies(
        NextResponse.json(
          {
            error: "token_missing",
            message: "No valid Meta token found for this workspace",
          },
          { status: 403 }
        )
      );
    }

    // Build OBA payload — match Meta curl example exactly
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const obaPayload: Record<string, unknown> = {};

    if (str(body.business_website_url))
      obaPayload.business_website_url = str(body.business_website_url);
    if (str(body.additional_supporting_information))
      obaPayload.additional_supporting_information = str(body.additional_supporting_information);
    if (str(body.parent_business_or_brand))
      obaPayload.parent_business_or_brand = str(body.parent_business_or_brand);
    if (str(body.primary_country_of_operation))
      obaPayload.primary_country_of_operation = str(body.primary_country_of_operation);
    if (str(body.primary_language))
      obaPayload.primary_language = str(body.primary_language);

    if (Array.isArray(body.supporting_links)) {
      const links = body.supporting_links
        .map((l: unknown) => (typeof l === "string" ? l.trim() : ""))
        .filter((l: string) => /^https?:\/\//i.test(l));
      if (links.length > 0) obaPayload.supporting_links = links;
    }

    // Direct fetch to Meta Graph API using form-urlencoded
    // Many Meta POST endpoints only read form params, not JSON body
    const apiUrl = graphUrl(`${phoneNumberId}/official_business_account`, "v24.0");
    try {
      // Build form body — flat key=value pairs
      const formParams = new URLSearchParams();
      for (const [key, value] of Object.entries(obaPayload)) {
        if (value === undefined || value === null) continue;
        formParams.set(
          key,
          typeof value === "string" ? value : JSON.stringify(value)
        );
      }

      logger.info("[oba] submitting request (form-urlencoded)", {
        phoneNumberId,
        workspaceId,
        apiUrl,
        formKeys: [...formParams.keys()],
      });

      const graphRes = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formParams,
      });

      const graphData = await graphRes.json().catch(() => ({}));

      logger.info("[oba] Graph API response", {
        phoneNumberId,
        workspaceId,
        status: graphRes.status,
        data: graphData,
      });

      if (!graphRes.ok) {
        const errMsg =
          graphData?.error?.message || `Graph API error (${graphRes.status})`;
        logger.error("[oba] Graph API error", {
          phoneNumberId,
          workspaceId,
          status: graphRes.status,
          error: graphData?.error,
        });
        return withCookies(
          NextResponse.json(
            { error: "graph_error", message: errMsg },
            { status: 502 }
          )
        );
      }

      // Log to audit
      await db
        .from("audit_logs")
        .insert({
          workspace_id: workspaceId,
          action: "oba_request_submitted",
          entity_type: "wa_connection",
          entity_id: connection.id,
          details: {
            phone_number_id: phoneNumberId,
            display_name: connection.display_name,
            payload_keys: Object.keys(obaPayload),
            graph_response: graphData,
          },
        })
        .then(({ error }) => {
          if (error)
            logger.warn("[oba] audit log insert failed", {
              error: error.message,
            });
        });

      return withCookies(
        NextResponse.json({
          ok: true,
          success: graphData?.success ?? true,
          message:
            "OBA request submitted successfully. Note: success=true means the request was submitted, not yet approved.",
          phoneNumberId,
        })
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "OBA request failed";
      logger.error("[oba] request failed", {
        phoneNumberId,
        workspaceId,
        message,
      });
      return withCookies(
        NextResponse.json(
          { error: "graph_error", message },
          { status: 502 }
        )
      );
    }
  }
);
