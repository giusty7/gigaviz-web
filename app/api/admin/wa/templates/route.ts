import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspaceRole } from "@/lib/supabase/workspace-role";
import { buildTemplatePayload, createMetaTemplate, fetchMetaTemplates } from "@/lib/wa/templates";

const templateSchema = z.object({
  name: z.string().min(1).regex(/^[a-z0-9_]+$/, "name_invalid"),
  category: z.enum(["MARKETING", "UTILITY", "AUTHENTICATION"]),
  language: z.string().regex(/^[a-z]{2}(_[A-Z]{2})?$/, "language_invalid"),
  body: z.string().min(1).refine((v) => v.includes("{{1}}"), { message: "body_missing_param" }),
  header: z.string().max(100).nullable().optional(),
  footer: z.string().max(100).nullable().optional(),
  buttons: z.array(z.object({ type: z.literal("QUICK_REPLY"), text: z.string().min(1) })).max(3).optional().default([]),
});

type MetaTemplate = {
  id?: string;
  name?: string;
  status?: string;
  category?: string;
  language?: string;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(req: NextRequest) {
  const auth = await requireWorkspaceRole(req, ["admin", "supervisor", "agent"]);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const { data, error } = await db
    .from("wa_templates")
    .select("id, name, category, language, status, updated_at, meta_template_id")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });

  if (error) {
    const message = error.message || "";
    const lower = message.toLowerCase();
    const missingTable =
      error.code === "42P01" ||
      (lower.includes("wa_templates") && lower.includes("exist"));
    if (!missingTable) {
      return withCookies(NextResponse.json({ error: error.message }, { status: 500 }));
    }
    try {
      const metaResponse = await fetchMetaTemplates();
      const raw = (metaResponse as { data?: MetaTemplate[] }).data ?? [];
      const items = raw.map((t) => ({
        id: asString(t.id) || asString(t.name),
        name: asString(t.name),
        category: asString(t.category),
        language: asString(t.language),
        status: asString(t.status),
        updated_at: null,
      }));
      return withCookies(NextResponse.json({ items }));
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Meta API error";
      return withCookies(NextResponse.json({ error: errMsg }, { status: 502 }));
    }
  }

  const items = (data ?? []).map((row) => ({
    id: row.meta_template_id ?? row.id,
    name: row.name,
    category: row.category,
    language: row.language,
    status: row.status,
    updated_at: row.updated_at,
  }));

  return withCookies(NextResponse.json({ items }));
}

export async function POST(req: NextRequest) {
  const auth = await requireWorkspaceRole(req, ["admin", "supervisor"]);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user } = auth;
  const body = await req.json().catch(() => null);
  const parsed = templateSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "invalid_payload";
    return withCookies(NextResponse.json({ error: msg }, { status: 400 }));
  }

  const validated = { ok: true as const, value: parsed.data };

  const payload = buildTemplatePayload(validated.value);

  let metaResponse: unknown = null;
  try {
    metaResponse = await createMetaTemplate(payload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Meta API error";
    return withCookies(NextResponse.json({ error: message }, { status: 502 }));
  }

  const meta = metaResponse as { id?: string; status?: string };
  const status = typeof meta?.status === "string" ? meta.status : "pending";

  const { data: inserted, error } = await db
    .from("wa_templates")
    .insert({
      workspace_id: workspaceId,
      name: validated.value.name,
      category: validated.value.category,
      language: validated.value.language,
      status,
      body: validated.value.body,
      header: validated.value.header,
      footer: validated.value.footer,
      buttons: validated.value.buttons ?? [],
      meta_template_id: meta?.id ?? null,
      meta_payload: payload,
      meta_response: metaResponse ?? {},
    })
    .select("id, name, category, language, status, updated_at, meta_template_id")
    .single();

  if (error) {
    return withCookies(NextResponse.json({ error: error.message }, { status: 500 }));
  }

  const { error: eventErr } = await db.from("wa_template_events").insert({
    workspace_id: workspaceId,
    template_id: inserted.id,
    event_type: "template.create",
    payload: metaResponse ?? {},
    created_by: user?.id ?? "system",
  });
  if (eventErr) {
    logger.info("wa_template_events insert failed (create)", eventErr.message);
  }

  return withCookies(NextResponse.json({ template: inserted }));
}
