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
