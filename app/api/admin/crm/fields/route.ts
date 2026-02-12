import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminWorkspace } from "@/lib/supabase/route";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const fieldSchema = z.object({
  id: z.string().uuid().optional(),
  key: z.string().trim().min(1, "Key is required").max(100),
  label: z.string().trim().min(1, "Label is required").max(200),
  type: z.enum(["text", "number", "bool", "date", "select"]),
  options: z.record(z.string(), z.unknown()).nullable().optional(),
  is_required: z.boolean().optional().default(false),
});

const fieldsBodySchema = z.object({
  field: fieldSchema.optional(),
  fields: z.array(fieldSchema).optional(),
  workspace_id: z.string().uuid().optional(),
}).refine(
  (d) => d.field || (d.fields && d.fields.length > 0),
  { message: "Provide 'field' or 'fields'" }
);

export const GET = withErrorHandler(async (req: NextRequest) => {
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
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const raw = await req.json();
  const body = fieldsBodySchema.parse(raw);

  const requestedWorkspace = body.workspace_id ?? workspaceId;
  if (requestedWorkspace !== workspaceId) {
    return withCookies(
      NextResponse.json({ error: "workspace_mismatch" }, { status: 403 })
    );
  }

  const list = body.fields ?? (body.field ? [body.field] : []);

  const payload = list.map((item) => ({
    id: item.id,
    workspace_id: workspaceId,
    key: item.key,
    label: item.label,
    type: item.type,
    options: item.options ?? null,
    is_required: item.is_required ?? false,
  }));

  const { data, error } = await db
    .from("crm_fields")
    .upsert(payload, { onConflict: "workspace_id,key" })
    .select("id, workspace_id, key, label, type, options, is_required, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return withCookies(NextResponse.json({ error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ fields: data ?? [] }));
});
