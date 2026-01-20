import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";
import { metaGraphFetch } from "@/lib/meta/graph";

export type MetaEventSource = "webhook" | "api";

export async function storeMetaEventLog(params: {
  workspaceId: string;
  eventType: string;
  source: MetaEventSource;
  payload: unknown;
  referralHash?: string | null;
  utm?: Record<string, unknown> | null;
  receivedAt?: string | null;
}) {
  const { workspaceId, eventType, source, payload, referralHash, utm, receivedAt } = params;
  try {
    const db = supabaseAdmin();
    await db.from("meta_events_log").insert({
      workspace_id: workspaceId,
      event_type: eventType,
      source,
      payload_json: payload ?? {},
      referral_hash: referralHash ?? null,
      utm_json: utm ?? null,
      received_at: receivedAt ?? new Date().toISOString(),
    });
  } catch (err) {
    logger.warn("[meta-events] store log failed", {
      workspaceId,
      eventType,
      message: err instanceof Error ? err.message : "unknown",
    });
  }
}

export async function ensureDatasetId(options: {
  workspaceId: string;
  wabaId: string;
  token: string;
  datasetId?: string | null;
}) {
  const { workspaceId, wabaId, token, datasetId: provided } = options;
  const db = supabaseAdmin();

  if (provided) {
    await db
      .from("meta_whatsapp_connections")
      .upsert(
        { workspace_id: workspaceId, waba_id: wabaId, dataset_id: provided },
        { onConflict: "workspace_id,waba_id" }
      );
    return provided;
  }

  const { data: cached } = await db
    .from("meta_whatsapp_connections")
    .select("dataset_id")
    .eq("workspace_id", workspaceId)
    .eq("waba_id", wabaId)
    .maybeSingle();

  if (cached?.dataset_id) return cached.dataset_id;

  let datasetId: string | null = null;
  try {
    const existing = await metaGraphFetch<{ id?: string; data?: Array<{ id?: string }> }>(
      `${wabaId}/dataset`,
      token
    );
    datasetId = existing?.id ?? existing?.data?.[0]?.id ?? null;
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status && status !== 404) {
      throw err;
    }
  }

  if (!datasetId) {
    const created = await metaGraphFetch<{ id?: string }>(`${wabaId}/dataset`, token, {
      method: "POST",
    });
    datasetId = created?.id ?? null;
  }

  if (!datasetId) {
    throw new Error("Dataset creation failed");
  }

  await db
    .from("meta_whatsapp_connections")
    .upsert({ workspace_id: workspaceId, waba_id: wabaId, dataset_id: datasetId }, { onConflict: "workspace_id,waba_id" });

  return datasetId;
}
