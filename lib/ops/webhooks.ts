import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { WebhookLog, WebhookLogFilter } from "./webhook-types";

/**
 * Get webhook logs with filters
 */
export async function getWebhookLogs(filter: WebhookLogFilter = {}): Promise<{
  logs: WebhookLog[];
  total: number;
}> {
  const db = supabaseAdmin();
  const { webhookType, workspaceId, hasError, limit = 50, offset = 0 } = filter;

  let query = db
    .from("ops_webhook_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (webhookType) {
    query = query.eq("webhook_type", webhookType);
  }

  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  }

  if (hasError !== undefined) {
    if (hasError) {
      query = query.not("processing_error", "is", null);
    } else {
      query = query.is("processing_error", null);
    }
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    logs: (data || []).map((row) => ({
      id: row.id,
      webhookType: row.webhook_type,
      method: row.method,
      url: row.url,
      headers: row.headers || {},
      queryParams: row.query_params || {},
      body: row.body || {},
      rawBody: row.raw_body,
      responseStatus: row.response_status,
      responseBody: row.response_body,
      processingError: row.processing_error,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      workspaceId: row.workspace_id,
      processedAt: row.processed_at,
      createdAt: row.created_at,
    })),
    total: count || 0,
  };
}

/**
 * Log incoming webhook
 */
export async function logWebhook(params: {
  webhookType: string;
  method: string;
  url: string;
  headers: Record<string, unknown>;
  queryParams?: Record<string, unknown>;
  body?: Record<string, unknown>;
  rawBody?: string;
  responseStatus?: number;
  responseBody?: Record<string, unknown>;
  processingError?: string;
  ipAddress?: string;
  userAgent?: string;
  workspaceId?: string;
}): Promise<string> {
  const { data, error } = await supabaseAdmin()
    .from("ops_webhook_logs")
    .insert({
      webhook_type: params.webhookType,
      method: params.method,
      url: params.url,
      headers: params.headers,
      query_params: params.queryParams || {},
      body: params.body || {},
      raw_body: params.rawBody || null,
      response_status: params.responseStatus || null,
      response_body: params.responseBody || null,
      processing_error: params.processingError || null,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
      workspace_id: params.workspaceId || null,
      processed_at: params.processingError ? null : new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

/**
 * Get single webhook log by ID
 */
export async function getWebhookLog(id: string): Promise<WebhookLog | null> {
  const { data, error } = await supabaseAdmin()
    .from("ops_webhook_logs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    webhookType: data.webhook_type,
    method: data.method,
    url: data.url,
    headers: data.headers || {},
    queryParams: data.query_params || {},
    body: data.body || {},
    rawBody: data.raw_body,
    responseStatus: data.response_status,
    responseBody: data.response_body,
    processingError: data.processing_error,
    ipAddress: data.ip_address,
    userAgent: data.user_agent,
    workspaceId: data.workspace_id,
    processedAt: data.processed_at,
    createdAt: data.created_at,
  };
}
