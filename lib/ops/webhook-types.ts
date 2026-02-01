/**
 * Ops Console: Webhook Debugging Types & Functions
 */

export type WebhookLog = {
  id: string;
  webhookType: string;
  method: string;
  url: string;
  headers: Record<string, unknown>;
  queryParams: Record<string, unknown>;
  body: Record<string, unknown>;
  rawBody: string | null;
  responseStatus: number | null;
  responseBody: Record<string, unknown> | null;
  processingError: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  workspaceId: string | null;
  processedAt: string | null;
  createdAt: string;
};

export type WebhookLogFilter = {
  webhookType?: string;
  workspaceId?: string;
  hasError?: boolean;
  limit?: number;
  offset?: number;
};
