import { NextRequest, NextResponse } from "next/server";
import { requireAdminWorkspace } from "@/lib/supabase/route";

type FieldType = "text" | "number" | "bool" | "date" | "select";

type FieldInput = {
  id?: unknown;
  workspace_id?: unknown;
  key?: unknown;
  label?: unknown;
  type?: unknown;
  options?: unknown;
  is_required?: unknown;
};

function parseType(value: unknown): FieldType | null {
  if (value === "text" || value === "number" || value === "bool" || value === "date") {
    return value;
  }
  if (value === "select") return value;
  return null;
}

function parseOptions(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object") return null;
  return value;
}

function normalizeField(input: FieldInput, workspaceId: string) {
  const key = typeof input.key === "string" ? input.key.trim() : "";
  const label = typeof input.label === "string" ? input.label.trim() : "";
  const type = parseType(input.type);
  const options = parseOptions(input.options);
  const isRequired =
    input.is_required === true || input.is_required === "true" ? true : false;
  const id = typeof input.id === "string" ? input.id : undefined;

  if (!key || !label || !type) return null;
  return {
    id,
    workspace_id: workspaceId,
    key,
    label,
    type,
    options,
    is_required: isRequired,
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const workspaceParam = req.nextUrl.searchParams.get("workspace_id");

  if (workspaceParam && workspaceParam !== workspaceId) {
    return withCookies(
      NextResponse.json({ error: "workspace_mismatch" }, { status: 403 })
    );
  }

  const { data, error } = await db
    .from("crm_fields")
    .select("id, workspace_id, key, label, type, options, is_required, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) {
    return withCookies(NextResponse.json({ error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ fields: data ?? [] }));
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const body = (await req.json().catch(() => null)) as
    | { field?: FieldInput; fields?: FieldInput[]; workspace_id?: unknown }
    | null;

  const requestedWorkspace =
    typeof body?.workspace_id === "string" ? body?.workspace_id : workspaceId;
  if (requestedWorkspace !== workspaceId) {
    return withCookies(
      NextResponse.json({ error: "workspace_mismatch" }, { status: 403 })
    );
  }

  const list = Array.isArray(body?.fields)
    ? body?.fields
    : body?.field
      ? [body.field]
      : [];

  if (list.length === 0) {
    return withCookies(NextResponse.json({ error: "no_fields" }, { status: 400 }));
  }

  const payload = list
    .map((item) => normalizeField(item, workspaceId))
    .filter(Boolean) as Array<{
    id?: string;
    workspace_id: string;
    key: string;
    label: string;
    type: FieldType;
    options: unknown | null;
    is_required: boolean;
  }>;

  if (payload.length === 0) {
    return withCookies(NextResponse.json({ error: "invalid_fields" }, { status: 400 }));
  }

  const { data, error } = await db
    .from("crm_fields")
    .upsert(payload, { onConflict: "workspace_id,key" })
    .select("id, workspace_id, key, label, type, options, is_required, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return withCookies(NextResponse.json({ error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ fields: data ?? [] }));
}
