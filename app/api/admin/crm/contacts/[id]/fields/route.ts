import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrSupervisorWorkspace } from "@/lib/supabase/route";
import { withErrorHandler } from "@/lib/api/with-error-handler";

type Ctx = { params: Promise<{ id: string }> };

type FieldType = "text" | "number" | "bool" | "date" | "select";

type FieldRow = {
  id: string;
  workspace_id: string;
  key: string;
  label: string;
  type: FieldType;
  options: unknown | null;
  is_required: boolean | null;
};

type ContactRow = {
  id: string;
  workspace_id: string;
};

function parseBool(value: unknown) {
  if (value === true || value === false) return value;
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === 1) return true;
  if (value === 0) return false;
  return null;
}

function fieldChoiceList(field: FieldRow) {
  const raw = field.options;
  if (!raw || typeof raw !== "object") return null;
  const choices = (raw as { choices?: unknown }).choices;
  if (!Array.isArray(choices)) return null;
  return choices.filter((c): c is string => typeof c === "string");
}

function normalizeValue(field: FieldRow, raw: unknown) {
  if (raw === undefined) return { value_text: null, value_json: null };
  if (raw === null || raw === "") return { value_text: null, value_json: null };

  if (field.type === "bool") {
    const boolVal = parseBool(raw);
    if (boolVal === null) return null;
    return { value_text: null, value_json: boolVal };
  }

  if (field.type === "number") {
    const num = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(num)) return null;
    return { value_text: String(num), value_json: null };
  }

  if (field.type === "date") {
    if (typeof raw !== "string") return null;
    const trimmed = raw.trim();
    if (!trimmed) return { value_text: null, value_json: null };
    const d = new Date(trimmed);
    if (Number.isNaN(d.getTime())) return null;
    return { value_text: trimmed, value_json: null };
  }

  if (field.type === "select") {
    if (typeof raw !== "string") return null;
    const trimmed = raw.trim();
    if (!trimmed) return { value_text: null, value_json: null };
    const choices = fieldChoiceList(field);
    if (choices && choices.length > 0 && !choices.includes(trimmed)) return null;
    return { value_text: trimmed, value_json: null };
  }

  if (field.type === "text") {
    const txt = String(raw).trim();
    if (!txt) return { value_text: null, value_json: null };
    return { value_text: txt, value_json: null };
  }

  return null;
}

export const GET = withErrorHandler(async (req: NextRequest, { params }: Ctx) => {
  const auth = await requireAdminOrSupervisorWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const { id } = await params;

  const { data: contact, error: contactErr } = await db
    .from("contacts")
    .select("id, workspace_id")
    .eq("id", id)
    .single();

  if (contactErr || !contact) {
    return withCookies(
      NextResponse.json({ error: contactErr?.message ?? "contact_not_found" }, { status: 404 })
    );
  }

  if ((contact as ContactRow).workspace_id !== workspaceId) {
    return withCookies(
      NextResponse.json({ error: "workspace_mismatch" }, { status: 403 })
    );
  }

  const { data: fields, error: fieldsErr } = await db
    .from("crm_fields")
    .select("id, workspace_id, key, label, type, options, is_required")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (fieldsErr) {
    return withCookies(NextResponse.json({ error: fieldsErr.message }, { status: 500 }));
  }

  const { data: values, error: valuesErr } = await db
    .from("crm_field_values")
    .select("field_id, value_text, value_json, updated_at")
    .eq("contact_id", id);

  if (valuesErr) {
    return withCookies(NextResponse.json({ error: valuesErr.message }, { status: 500 }));
  }

  return withCookies(
    NextResponse.json({ fields: fields ?? [], values: values ?? [] })
  );
});

export const POST = withErrorHandler(async (req: NextRequest, { params }: Ctx) => {
  const auth = await requireAdminOrSupervisorWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const { id } = await params;

  const { data: contact, error: contactErr } = await db
    .from("contacts")
    .select("id, workspace_id")
    .eq("id", id)
    .single();

  if (contactErr || !contact) {
    return withCookies(
      NextResponse.json({ error: contactErr?.message ?? "contact_not_found" }, { status: 404 })
    );
  }

  if ((contact as ContactRow).workspace_id !== workspaceId) {
    return withCookies(
      NextResponse.json({ error: "workspace_mismatch" }, { status: 403 })
    );
  }

  const body = (await req.json().catch(() => null)) as
    | { values?: Record<string, unknown>; items?: Array<{ field_id?: unknown; value?: unknown }> }
    | null;

  let valuesMap: Record<string, unknown> = {};
  if (body?.values && typeof body.values === "object") {
    valuesMap = body.values;
  } else if (Array.isArray(body?.items)) {
    body?.items.forEach((item) => {
      const fieldId = typeof item?.field_id === "string" ? item.field_id : null;
      if (fieldId) valuesMap[fieldId] = item.value;
    });
  }

  const fieldIds = Object.keys(valuesMap);
  if (fieldIds.length === 0) {
    return withCookies(NextResponse.json({ error: "no_fields" }, { status: 400 }));
  }

  const { data: fields, error: fieldsErr } = await db
    .from("crm_fields")
    .select("id, workspace_id, key, label, type, options, is_required")
    .eq("workspace_id", workspaceId)
    .in("id", fieldIds);

  if (fieldsErr) {
    return withCookies(NextResponse.json({ error: fieldsErr.message }, { status: 500 }));
  }

  const fieldRows = (fields ?? []) as FieldRow[];
  if (fieldRows.length !== fieldIds.length) {
    return withCookies(NextResponse.json({ error: "invalid_field" }, { status: 400 }));
  }

  const rows = [];
  for (const field of fieldRows) {
    const rawValue = valuesMap[field.id];
    const normalized = normalizeValue(field, rawValue);
    if (normalized === null) {
      return withCookies(
        NextResponse.json({ error: `invalid_value:${field.key}` }, { status: 400 })
      );
    }
    if (field.is_required && normalized.value_text === null && normalized.value_json === null) {
      return withCookies(
        NextResponse.json({ error: `required:${field.key}` }, { status: 400 })
      );
    }
    rows.push({
      contact_id: id,
      field_id: field.id,
      value_text: normalized.value_text,
      value_json: normalized.value_json,
      updated_at: new Date().toISOString(),
    });
  }

  const { data: saved, error: saveErr } = await db
    .from("crm_field_values")
    .upsert(rows, { onConflict: "contact_id,field_id" })
    .select("field_id, value_text, value_json, updated_at");

  if (saveErr) {
    return withCookies(NextResponse.json({ error: saveErr.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ values: saved ?? [] }));
});
