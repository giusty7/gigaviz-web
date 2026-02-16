import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { guardWorkspace, requireWorkspaceRole } from "@/lib/auth/guard";
import { logger } from "@/lib/logging";
import { graphUrl } from "@/lib/meta/graph";
import { resolveWorkspaceMetaToken } from "@/lib/meta/token";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const obaRequestSchema = z.object({
  business_website_url: z.string().url("Must be a valid URL"),
  additional_supporting_information: z.string().max(1000).optional(),
  parent_business_or_brand: z.string().max(200).optional(),
  primary_country_of_operation: z.string().max(100).optional(),
  primary_language: z.string().max(50).optional(),
  supporting_links: z.array(z.string().url()).max(10).optional().default([]),
});

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ phoneNumberId: string }>;
};

/* ═══════════════════════════════════════════════════════════════════
   Helper: resolve workspace + connection + token in one shot
   ═══════════════════════════════════════════════════════════════════ */
async function resolveContext(req: NextRequest, context: RouteContext) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return { ok: false as const, response: guard.response };

  const { workspaceId, role, withCookies } = guard;

  const params = await context.params;
  const phoneNumberId = params.phoneNumberId;
  if (!phoneNumberId || phoneNumberId.length < 3) {
    return {
      ok: false as const,
      response: withCookies(
        NextResponse.json(
          { error: "bad_request", message: "Invalid phone_number_id" },
          { status: 400 }
        )
      ),
    };
  }

  const db = supabaseAdmin();
  const { data: connection, error: findErr } = await db
    .from("wa_phone_numbers")
    .select("id, phone_number_id, waba_id, display_name")
    .eq("workspace_id", workspaceId)
    .eq("phone_number_id", phoneNumberId)
    .maybeSingle();

  if (findErr || !connection) {
    return {
      ok: false as const,
      response: withCookies(
        NextResponse.json(
          { error: "not_found", message: "Connection not found" },
          { status: 404 }
        )
      ),
    };
  }

  let accessToken: string;
  try {
    const tokenResult = await resolveWorkspaceMetaToken(workspaceId);
    accessToken = tokenResult.token;
  } catch {
    return {
      ok: false as const,
      response: withCookies(
        NextResponse.json(
          { error: "token_missing", message: "No valid Meta token found" },
          { status: 403 }
        )
      ),
    };
  }

  return {
    ok: true as const,
    workspaceId,
    role,
    withCookies,
    phoneNumberId,
    connection,
    accessToken,
    db,
  };
}

/* ── GET: Check OBA status ──────────────────────────────────────── */
export const GET = withErrorHandler(
  async (req: NextRequest, context: RouteContext) => {
    const ctx = await resolveContext(req, context);
    if (!ctx.ok) return ctx.response;

    const { phoneNumberId, workspaceId, accessToken, withCookies } = ctx;

    // Meta docs: GET /<PHONE_NUMBER_ID>?fields=official_business_account
    const url =
      graphUrl(phoneNumberId, "v24.0") +
      "?fields=official_business_account";

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json().catch(() => ({}));

      logger.info("[oba] GET status", {
        phoneNumberId,
        workspaceId,
        status: res.status,
        data,
      });

      if (!res.ok) {
        return withCookies(
          NextResponse.json(
            {
              error: "graph_error",
              message:
                data?.error?.message || `Graph API ${res.status}`,
            },
            { status: 502 }
          )
        );
      }

      // Meta returns: { official_business_account: { oba_status: "NOT_STARTED" | ... }, id: "..." }
      return withCookies(
        NextResponse.json({
          ok: true,
          phoneNumberId,
          official_business_account:
            data?.official_business_account ?? null,
        })
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to check OBA status";
      logger.error("[oba] GET failed", {
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
    // Clone request BEFORE guardWorkspace — it consumes req.json() internally
    const clonedReq = req.clone();

    const ctx = await resolveContext(req, context);
    if (!ctx.ok) return ctx.response;

    const {
      workspaceId,
      role,
      withCookies,
      phoneNumberId,
      connection,
      accessToken,
      db,
    } = ctx;

    if (!requireWorkspaceRole(role, ["owner", "admin"])) {
      return withCookies(
        NextResponse.json({ error: "forbidden" }, { status: 403 })
      );
    }

    // Read body from CLONED request (original consumed by guardWorkspace)
    const rawBody = await clonedReq.json().catch(() => ({}));

    // Validate with Zod
    const parseResult = obaRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return withCookies(
        NextResponse.json(
          {
            error: "validation",
            message: parseResult.error.issues[0]?.message || "Invalid input",
            details: parseResult.error.issues,
          },
          { status: 400 }
        )
      );
    }

    const validated = parseResult.data;

    logger.info("[oba] POST body", {
      phoneNumberId,
      workspaceId,
      bodyKeys: Object.keys(validated),
      hasWebsiteUrl: Boolean(validated.business_website_url),
    });

    // Build OBA payload — match Meta docs exactly:
    // POST /<PHONE_NUMBER_ID>/official_business_account  Content-Type: application/json
    // https://developers.facebook.com/docs/whatsapp/official-business-accounts
    const obaPayload: Record<string, string | string[]> = {
      business_website_url: validated.business_website_url,
    };

    if (validated.additional_supporting_information)
      obaPayload.additional_supporting_information = validated.additional_supporting_information;
    if (validated.parent_business_or_brand)
      obaPayload.parent_business_or_brand = validated.parent_business_or_brand;
    if (validated.primary_country_of_operation)
      obaPayload.primary_country_of_operation = validated.primary_country_of_operation;
    if (validated.primary_language)
      obaPayload.primary_language = validated.primary_language;
    if (validated.supporting_links && validated.supporting_links.length > 0)
      obaPayload.supporting_links = validated.supporting_links;

    // Meta docs: POST with Content-Type: application/json
    const apiUrl = graphUrl(
      `${phoneNumberId}/official_business_account`,
      "v24.0"
    );

    try {
      logger.info("[oba] submitting to Meta", {
        phoneNumberId,
        workspaceId,
        apiUrl,
        payloadKeys: Object.keys(obaPayload),
      });

      const graphRes = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(obaPayload),
      });

      const graphData = await graphRes.json().catch(() => ({}));

      logger.info("[oba] Meta response", {
        phoneNumberId,
        workspaceId,
        httpStatus: graphRes.status,
        graphData,
      });

      if (!graphRes.ok) {
        const metaErr = graphData?.error;
        const errMsg =
          metaErr?.message || `Graph API error (${graphRes.status})`;
        const errCode = metaErr?.code;

        logger.error("[oba] Meta error", {
          phoneNumberId,
          workspaceId,
          httpStatus: graphRes.status,
          metaErr,
        });

        // Meta code 1 = generic "An unknown error" — often means duplicate
        let userMessage = errMsg;
        if (errCode === 1) {
          userMessage =
            "Meta returned a generic error (code 1). This usually means an OBA request was already submitted. " +
            "Click 'Check Status' to see the current state. If recently denied, wait 30 days before re-applying.";
        } else if (errCode === 100) {
          userMessage = `Missing required field: ${errMsg}`;
        }

        return withCookies(
          NextResponse.json(
            {
              error: "graph_error",
              message: userMessage,
              meta_error_code: errCode,
              meta_error_message: errMsg,
            },
            { status: 502 }
          )
        );
      }

      // Audit log
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
            logger.warn("[oba] audit insert failed", {
              error: error.message,
            });
        });

      return withCookies(
        NextResponse.json({
          ok: true,
          success: graphData?.success ?? true,
          message:
            "OBA request submitted. Review may take several business days.",
          phoneNumberId,
        })
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "OBA request failed";
      logger.error("[oba] POST exception", {
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
