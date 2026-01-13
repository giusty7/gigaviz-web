import { supabaseAdmin } from "@/lib/supabase/admin";

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
