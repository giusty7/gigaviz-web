import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { guardWorkspace, requireWorkspaceRole } from "@/lib/auth/guard";
import { logger } from "@/lib/logging";
import { metaGraphFetch } from "@/lib/meta/graph";
import { resolveWorkspaceMetaToken } from "@/lib/meta/token";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ phoneNumberId: string }>;
};

/* ── OBA request body schema ────────────────────────────────────── */
const obaRequestSchema = z.object({
  /** Supporting information for OBA request (e.g. press mentions, website) */
  additional_supporting_information: z.string().max(2000).optional(),
  /** Company / brand website URL (required by Meta — validated manually) */
  business_website_url: z.string().optional(),
  /** Official name of the business or brand */
  parent_business_or_brand: z.string().max(200).optional(),
  /** Country of primary business operations */
  primary_country_of_operation: z.string().max(100).optional(),
  /** Primary language for the WhatsApp channel */
  primary_language: z.string().max(50).optional(),
  /** Array of supporting links (news articles, directories, etc.) */
  supporting_links: z.array(z.string()).max(10).optional(),
});

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

    // Validate request body
    const body = await req.json().catch(() => ({}));
    const parsed = obaRequestSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      logger.warn("[oba] validation failed", {
        phoneNumberId,
        workspaceId,
        fieldErrors,
        bodyKeys: Object.keys(body),
      });
      return withCookies(
        NextResponse.json(
          {
            error: "validation_error",
            message: "Invalid request body",
            details: fieldErrors,
          },
          { status: 400 }
        )
      );
    }

    // Meta requires business_website_url — check explicitly
    const websiteUrl = (parsed.data.business_website_url ?? "").trim();
    if (!websiteUrl || !/^https?:\/\/.+/i.test(websiteUrl)) {
      return withCookies(
        NextResponse.json(
          {
            error: "validation_error",
            message: "business_website_url is required and must be a valid URL (e.g. https://gigaviz.com)",
          },
          { status: 400 }
        )
      );
    }

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

    // Build OBA request payload — only include non-empty fields
    const v = parsed.data;
    const obaPayload: Record<string, unknown> = {
      business_website_url: websiteUrl,
    };
    if (v.additional_supporting_information?.trim()) {
      obaPayload.additional_supporting_information =
        v.additional_supporting_information.trim();
    }
    if (v.parent_business_or_brand?.trim()) {
      obaPayload.parent_business_or_brand =
        v.parent_business_or_brand.trim();
    }
    if (v.primary_country_of_operation?.trim()) {
      obaPayload.primary_country_of_operation =
        v.primary_country_of_operation.trim();
    }
    if (v.primary_language?.trim()) {
      obaPayload.primary_language = v.primary_language.trim();
    }
    const links = (v.supporting_links ?? [])
      .map((l) => l.trim())
      .filter((l) => /^https?:\/\//i.test(l));
    if (links.length > 0) {
      obaPayload.supporting_links = links;
    }

    // POST to Graph API: /{phoneNumberId}/official_business_account
    try {
      logger.info("[oba] submitting request", {
        phoneNumberId,
        workspaceId,
        payload_keys: Object.keys(obaPayload),
      });

      const result = await metaGraphFetch<{ success?: boolean }>(
        `${phoneNumberId}/official_business_account`,
        accessToken,
        {
          method: "POST",
          body: obaPayload,
        }
      );

      logger.info("[oba] request submitted", {
        phoneNumberId,
        workspaceId,
        displayName: connection.display_name,
        success: result.success,
      });

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
            graph_response: result,
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
          success: result.success ?? true,
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
