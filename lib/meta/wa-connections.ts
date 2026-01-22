import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";

export type WaConnectionRow = {
  id: string;
  workspace_id: string;
  phone_number_id: string | null;
  waba_id: string | null;
  status: string | null;
  display_name: string | null;
};

type Db = ReturnType<typeof supabaseAdmin>;

export async function findWorkspaceBySlug(db: Db, slug: string) {
  const { data, error } = await db
    .from("workspaces")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();
  return { data, error };
}

export async function findConnectionById(db: Db, connectionId: string) {
  const { data, error } = await db
    .from("wa_phone_numbers")
    .select("id, workspace_id, phone_number_id, waba_id, status, display_name")
    .eq("id", connectionId)
    .maybeSingle();
  return { data: data as WaConnectionRow | null, error };
}

/**
 * Resolve a connection by phone_number_id (for inbound webhook mapping).
 * Returns the connection row with workspace_id if found.
 */
export async function resolveConnectionForWebhook(
  phoneNumberId: string
): Promise<{ connection: WaConnectionRow | null; error: Error | null }> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("wa_phone_numbers")
    .select("id, workspace_id, phone_number_id, waba_id, status, display_name")
    .eq("phone_number_id", phoneNumberId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    logger.error("[wa-connections] resolveConnectionForWebhook failed", {
      phoneNumberId,
      message: error.message,
    });
    return { connection: null, error: new Error(error.message) };
  }

  return { connection: data as WaConnectionRow | null, error: null };
}

/**
 * Resolve a connection for a given thread.
 * Uses thread.connection_id if set, otherwise falls back to phone_number_id lookup.
 * Returns full connection with token for outbound sending.
 */
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

  // 1) Fetch thread with connection_id
  const { data: thread, error: threadErr } = await db
    .from("wa_threads")
    .select("id, connection_id, phone_number_id, workspace_id")
    .eq("id", threadId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (threadErr) {
    logger.error("[wa-connections] resolveConnectionForThread: thread lookup failed", {
      threadId,
      message: threadErr.message,
    });
    return { ok: false, error: threadErr.message, code: "thread_lookup_failed" };
  }

  if (!thread) {
    return { ok: false, error: "Thread not found", code: "thread_not_found" };
  }

  let connectionRow: WaConnectionRow | null = null;

  // 2) If thread has connection_id, use it directly
  if (thread.connection_id) {
    const { data, error } = await findConnectionById(db, thread.connection_id);
    if (error) {
      logger.warn("[wa-connections] resolveConnectionForThread: connection lookup failed", {
        connectionId: thread.connection_id,
        message: error.message,
      });
    }
    connectionRow = data;
  }

  // 3) Fallback: lookup by phone_number_id (legacy data)
  if (!connectionRow && thread.phone_number_id) {
    const { data } = await findConnectionForWorkspace(db, workspaceId, thread.phone_number_id);
    connectionRow = data;

    // If found, update thread.connection_id for future lookups
    if (connectionRow) {
      await db
        .from("wa_threads")
        .update({ connection_id: connectionRow.id })
        .eq("id", threadId);
    }
  }

  if (!connectionRow) {
    return { ok: false, error: "No active connection for this thread", code: "connection_not_found" };
  }

  if (!connectionRow.phone_number_id) {
    return { ok: false, error: "Connection has no phone_number_id", code: "phone_number_missing" };
  }

  const status = (connectionRow.status || "").toLowerCase();
  if (status && status !== "active") {
    return { ok: false, error: "Connection is not active", code: "connection_inactive" };
  }

  // 4) Resolve token for this connection
  const { data: tokenRow, error: tokenErr } = await findTokenForConnection(
    db,
    workspaceId,
    connectionRow.phone_number_id,
    connectionRow.waba_id
  );

  if (tokenErr) {
    logger.warn("[wa-connections] resolveConnectionForThread: token lookup failed", {
      connectionId: connectionRow.id,
      message: tokenErr.message,
    });
  }

  const token = tokenRow?.token_encrypted ?? null;
  if (!token) {
    return { ok: false, error: "Access token not found for this connection", code: "token_missing" };
  }

  return { ok: true, connection: connectionRow, token };
}

/**
 * Store an orphan webhook event (phone_number_id not mapped to any connection)
 */
export async function storeOrphanWebhookEvent(params: {
  phoneNumberId: string;
  eventKey?: string;
  payload: unknown;
  error?: string;
}): Promise<void> {
  const db = supabaseAdmin();
  try {
    await db.from("orphan_webhook_events").insert({
      phone_number_id: params.phoneNumberId,
      event_key: params.eventKey ?? null,
      payload_json: params.payload,
      error: params.error ?? null,
      processed: false,
    });
    logger.warn("[wa-connections] stored orphan webhook event", {
      phoneNumberId: params.phoneNumberId,
      eventKey: params.eventKey,
    });
  } catch (err) {
    logger.error("[wa-connections] failed to store orphan event", {
      phoneNumberId: params.phoneNumberId,
      message: err instanceof Error ? err.message : "unknown",
    });
  }
}

export async function findConnectionForWorkspace(
  db: Db,
  workspaceId: string,
  phoneNumberId?: string | null
) {
  const query = db
    .from("wa_phone_numbers")
    .select("id, workspace_id, phone_number_id, waba_id, status, display_name")
    .eq("workspace_id", workspaceId);

  if (phoneNumberId) {
    query.eq("phone_number_id", phoneNumberId);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .maybeSingle();

  return { data: data as WaConnectionRow | null, error };
}

export async function findTokenForConnection(
  db: Db,
  workspaceId: string,
  phoneNumberId?: string | null,
  wabaId?: string | null
) {
  if (phoneNumberId) {
    const { data, error } = await db
      .from("meta_tokens")
      .select("token_encrypted, scopes_json, expires_at")
      .eq("workspace_id", workspaceId)
      .eq("provider", "meta_whatsapp")
      .eq("scopes_json->>phone_number_id", phoneNumberId)
      .order("created_at", { ascending: false })
      .maybeSingle();
    if (data || error) return { data, error };
  }

  if (wabaId) {
    const { data, error } = await db
      .from("meta_tokens")
      .select("token_encrypted, scopes_json, expires_at")
      .eq("workspace_id", workspaceId)
      .eq("provider", "meta_whatsapp")
      .eq("scopes_json->>waba_id", wabaId)
      .order("created_at", { ascending: false })
      .maybeSingle();
    if (data || error) return { data, error };
  }

  return db
    .from("meta_tokens")
    .select("token_encrypted, scopes_json, expires_at")
    .eq("workspace_id", workspaceId)
    .eq("provider", "meta_whatsapp")
    .order("created_at", { ascending: false })
    .maybeSingle();
}

export type WorkspaceWhatsappConnection = {
  phoneNumberId: string;
  wabaId: string | null;
  displayName: string | null;
  status: string | null;
  token: string;
  tokenExpiresAt: string | null;
};

export type ConnectionLookupError = {
  ok: false;
  code: "wa_connection_missing" | "wa_phone_number_missing" | "wa_token_missing" | "wa_connection_inactive";
  message: string;
};

type ConnectionLookupResult = { ok: true; connection: WorkspaceWhatsappConnection } | ConnectionLookupError;

type ConnectionLookupOptions = {
  workspaceId: string;
  connectionId?: string | null;
  phoneNumberId?: string | null;
  requireActive?: boolean;
};

export async function getWorkspaceWhatsappConnectionOrThrow(
  options: ConnectionLookupOptions
): Promise<ConnectionLookupResult> {
  const db = supabaseAdmin();
  const { workspaceId, connectionId, phoneNumberId, requireActive = true } = options;

  let phoneRow: WaConnectionRow | null = null;

  if (connectionId) {
    const { data, error } = await findConnectionById(db, connectionId);
    if (error || !data || data.workspace_id !== workspaceId) {
      return { ok: false, code: "wa_connection_missing", message: "Connection not found" };
    }
    phoneRow = data;
  } else {
    const { data } = await findConnectionForWorkspace(db, workspaceId, phoneNumberId);
    phoneRow = data;
  }

  if (!phoneRow) {
    return { ok: false, code: "wa_connection_missing", message: "WhatsApp connection not found" };
  }

  if (!phoneRow.phone_number_id) {
    return { ok: false, code: "wa_phone_number_missing", message: "Phone number ID is missing" };
  }

  const status = (phoneRow.status || "").toLowerCase();
  if (requireActive && status && status !== "active") {
    return { ok: false, code: "wa_connection_inactive", message: "Connection is not active" };
  }

  const { data: tokenRow, error: tokenError } = await findTokenForConnection(
    db,
    workspaceId,
    phoneRow.phone_number_id,
    phoneRow.waba_id
  );

  if (tokenError) {
    logger.warn("[wa-connection] token lookup failed", { message: tokenError.message });
  }

  const token = tokenRow?.token_encrypted ?? null;
  if (!token) {
    return { ok: false, code: "wa_token_missing", message: "Access token is missing" };
  }

  return {
    ok: true,
    connection: {
      phoneNumberId: phoneRow.phone_number_id,
      wabaId: phoneRow.waba_id,
      displayName: phoneRow.display_name,
      status: phoneRow.status,
      token,
      tokenExpiresAt: tokenRow?.expires_at ?? null,
    },
  };
}
