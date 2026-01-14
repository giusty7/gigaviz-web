import "server-only";

import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const ALLOWLIST_INTENTS = ["summarize_thread", "draft_reply", "create_ticket"] as const;
export type AllowedIntent = (typeof ALLOWLIST_INTENTS)[number];

export type ToolExecutePayload = {
  workspace_slug: string;
  workspace_id: string;
  conversation_id?: string;
  intent: string;
  params: Record<string, unknown>;
  correlation_id: string;
  idempotency_key: string;
  requested_by: "user" | "assistant";
};

export async function insertToolRun(payload: {
  workspaceId: string;
  conversationId?: string | null;
  messageId?: string | null;
  intent: string;
  params: Record<string, unknown>;
  status: "queued" | "running" | "success" | "error";
  correlationId?: string | null;
  idempotencyKey: string;
  result?: Record<string, unknown> | null;
  error?: Record<string, unknown> | null;
}) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("helper_tool_runs")
    .upsert(
      {
        workspace_id: payload.workspaceId,
        conversation_id: payload.conversationId ?? null,
        message_id: payload.messageId ?? null,
        intent: payload.intent,
        params: payload.params,
        status: payload.status,
        correlation_id: payload.correlationId ?? null,
        idempotency_key: payload.idempotencyKey,
        result: payload.result ?? null,
        error: payload.error ?? null,
        updated_at: new Date().toISOString(),
        finished_at: payload.status === "success" || payload.status === "error"
          ? new Date().toISOString()
          : null,
      },
      { onConflict: "workspace_id,idempotency_key" }
    )
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

export function signN8nPayload(secret: string, payload: unknown) {
  const json = JSON.stringify(payload ?? {});
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(json);
  return hmac.digest("hex");
}

export function isIntentAllowed(intent: string): intent is AllowedIntent {
  return ALLOWLIST_INTENTS.includes(intent as AllowedIntent);
}
