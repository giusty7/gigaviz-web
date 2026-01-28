import { supabaseAdmin } from "@/lib/supabase/admin";
import * as shared from "./wa-connections.shared";

export type WaConnectionRow = shared.WaConnectionRow;
export type WorkspaceWhatsappConnection = shared.WorkspaceWhatsappConnection;
export type ConnectionLookupError = shared.ConnectionLookupError;

type Db = ReturnType<typeof supabaseAdmin>;

export async function findWorkspaceBySlug(db: Db, slug: string) {
  return shared.findWorkspaceBySlug(db, slug);
}

export async function findConnectionById(db: Db, connectionId: string) {
  return shared.findConnectionById(db, connectionId);
}

export async function resolveConnectionForWebhook(
  phoneNumberId: string
): Promise<{ connection: WaConnectionRow | null; error: Error | null }> {
  const db = supabaseAdmin();
  return shared.resolveConnectionForWebhook(db, phoneNumberId);
}

export async function resolveConnectionForThread(
  threadId: string,
  workspaceId: string
): Promise<{
  ok: boolean;
  connection?: WaConnectionRow;
  token?: string;
  error?: string;
  code?: string;
}> {
  const db = supabaseAdmin();
  return shared.resolveConnectionForThread(db, threadId, workspaceId);
}

export async function storeOrphanWebhookEvent(params: {
  phoneNumberId: string;
  eventKey?: string;
  payload: unknown;
  error?: string;
}): Promise<void> {
  const db = supabaseAdmin();
  return shared.storeOrphanWebhookEvent(db, params);
}

export async function findConnectionForWorkspace(
  db: Db,
  workspaceId: string,
  phoneNumberId?: string | null
) {
  return shared.findConnectionForWorkspace(db, workspaceId, phoneNumberId);
}

export async function findTokenForConnection(
  db: Db,
  workspaceId: string,
  phoneNumberId?: string | null,
  wabaId?: string | null
) {
  return shared.findTokenForConnection(db, workspaceId, phoneNumberId, wabaId);
}

type ConnectionLookupOptions = {
  workspaceId: string;
  connectionId?: string | null;
  phoneNumberId?: string | null;
  requireActive?: boolean;
};

export async function getWorkspaceWhatsappConnectionOrThrow(
  options: ConnectionLookupOptions
) {
  const db = supabaseAdmin();
  return shared.getWorkspaceWhatsappConnectionOrThrow({ ...options, db });
}
