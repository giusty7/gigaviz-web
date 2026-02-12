import { createHash } from "crypto";
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
import { rateLimit } from "@/lib/rate-limit";
import { getWorkspaceMetaAccessToken, metaGraphFetch } from "@/lib/meta/graph";
import { ensureDatasetId, storeMetaEventLog } from "@/lib/meta/events";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

const eventNames = z.enum([
  "Purchase",
  "LeadSubmitted",
  "InitiateCheckout",
  "AddToCart",
  "ViewContent",
  "OrderCreated",
  "OrderShipped",
]);

const schema = z.object({
  workspaceId: z.string().uuid(),
  wabaId: z.string().min(3),
  datasetId: z.string().min(3).optional(),
  eventName: eventNames,
  value: z.number().finite().optional(),
  currency: z.string().min(3).max(6).optional(),
  ctwaClidSource: z.enum(["manual", "latest_conversation"]),
  ctwaClidManual: z.string().min(6).optional(),
});

function hashCtwaClid(raw: string) {
  return createHash("sha256").update(raw.trim()).digest("hex");
}

export const POST = withErrorHandler(async (req: NextRequest) => {
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
        { error: "bad_request", reason: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const {
    workspaceId: bodyWorkspaceId,
    wabaId,
    datasetId: providedDataset,
    eventName,
    value,
    currency,
    ctwaClidSource,
    ctwaClidManual,
  } = parsed.data;

  const workspaceId = getWorkspaceId(req, undefined, bodyWorkspaceId);
  if (!workspaceId) {
    return workspaceRequiredResponse(withCookies);
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin"])) {
    return forbiddenResponse(withCookies);
  }

  const limiter = rateLimit(`wa-events-send:${workspaceId}:${userData.user.id}`, {
    windowMs: 60_000,
    max: 10,
  });
  if (!limiter.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 })
    );
  }

  let rawClid: string | null = null;
  if (ctwaClidSource === "manual") {
    rawClid = ctwaClidManual?.trim() || null;
    if (!rawClid) {
      return withCookies(
        NextResponse.json({ error: "ctwa_clid_required", reason: "provide_ctwa_clid" }, { status: 400 })
      );
    }
  } else {
    return withCookies(
      NextResponse.json(
        {
          error: "ctwa_clid_missing",
          reason: "latest_conversation_not_available",
          message: "Provide ctwa_clid manually for now.",
        },
        { status: 400 }
      )
    );
  }

  const eventTime = Math.floor(Date.now() / 1000);
  const token = await getWorkspaceMetaAccessToken(workspaceId);
  const datasetId = await ensureDatasetId({ workspaceId, wabaId, token, datasetId: providedDataset });
  const ctwaHash = hashCtwaClid(rawClid);

  const userDataPayload = {
    whatsapp_business_account_id: wabaId,
    ctwa_clid: rawClid,
  };

  const customData: Record<string, unknown> = {};
  if (value !== undefined) customData.value = value;
  customData.currency = currency || "IDR";

  const requestPayload = {
    data: [
      {
        event_name: eventName,
        event_time: eventTime,
        action_source: "business_messaging",
        messaging_channel: "whatsapp",
        user_data: userDataPayload,
        custom_data: customData,
      },
    ],
    partner_agent: "Gigaviz",
  };

  const redactedPayload = {
    ...requestPayload,
    data: requestPayload.data.map((item) => ({
      ...item,
      user_data: {
        whatsapp_business_account_id: item.user_data.whatsapp_business_account_id,
        ctwa_clid_hash: ctwaHash,
      },
    })),
  };

  let responseJson: unknown = null;
  let status: "success" | "failed" = "failed";
  let errorMessage: string | null = null;

  try {
    responseJson = await metaGraphFetch(`${datasetId}/events`, token, {
      method: "POST",
      body: requestPayload,
    });
    status = "success";
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "unknown_error";
    responseJson = { error: errorMessage };
  }

  try {
    const db = supabaseAdmin();
    await db.from("meta_capi_event_logs").insert({
      workspace_id: workspaceId,
      waba_id: wabaId,
      dataset_id: datasetId,
      event_name: eventName,
      event_time: new Date(eventTime * 1000).toISOString(),
      currency: customData.currency as string,
      value: typeof customData.value === "number" ? customData.value : null,
      ctwa_clid_hash: ctwaHash,
      request_payload_json: redactedPayload,
      response_json: responseJson,
      status,
      error_message: errorMessage,
    });
  } catch (logErr) {
    logger.error("[wa-events] log insert failed", {
      workspaceId,
      message: logErr instanceof Error ? logErr.message : String(logErr),
    });
  }

  await storeMetaEventLog({
    workspaceId,
    eventType: eventName,
    source: "api",
    referralHash: ctwaHash,
    payload: redactedPayload,
  });

  if (status === "failed") {
    return withCookies(
      NextResponse.json({ error: "send_failed", reason: errorMessage }, { status: 502 })
    );
  }

  const fbtraceId =
    typeof responseJson === "object" && responseJson !== null && "fbtrace_id" in responseJson
      ? (responseJson as { fbtrace_id?: unknown }).fbtrace_id
      : undefined;

  return withCookies(NextResponse.json({ ok: true, datasetId, fbtrace_id: fbtraceId }));
});
