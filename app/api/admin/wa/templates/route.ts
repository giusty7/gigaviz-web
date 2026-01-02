import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceRole } from "@/lib/supabase/workspace-role";
import { buildTemplatePayload, createMetaTemplate } from "@/lib/wa/templates";

type CreatePayload = {
  name?: unknown;
  category?: unknown;
  language?: unknown;
  body?: unknown;
  header?: unknown;
  footer?: unknown;
  buttons?: unknown;
};

const CATEGORY_ALLOWED = new Set(["MARKETING", "UTILITY", "AUTHENTICATION"]);

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeButtons(input: unknown) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((v) => {
        if (typeof v === "string") {
          const text = v.trim();
          return text ? { type: "QUICK_REPLY" as const, text } : null;
        }
        if (v && typeof v === "object") {
          const text = asString((v as { text?: unknown }).text);
          return text ? { type: "QUICK_REPLY" as const, text } : null;
        }
        return null;
      })
      .filter(Boolean) as Array<{ type: "QUICK_REPLY"; text: string }>;
  }
  if (typeof input === "string") {
    return input
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((text) => ({ type: "QUICK_REPLY" as const, text }));
  }
  return [];
}

function validateTemplate(input: CreatePayload) {
  const name = asString(input.name);
  const category = asString(input.category).toUpperCase();
  const language = asString(input.language);
  const body = asString(input.body);
  const header = asString(input.header) || null;
  const footer = asString(input.footer) || null;
  const buttons = normalizeButtons(input.buttons);

  if (!name) return { ok: false as const, error: "name_required" };
  if (!/^[a-z0-9_]+$/.test(name)) return { ok: false as const, error: "name_invalid" };
  if (!category || !CATEGORY_ALLOWED.has(category)) {
    return { ok: false as const, error: "category_invalid" };
  }
  if (!language || !/^[a-z]{2}(_[A-Z]{2})?$/.test(language)) {
    return { ok: false as const, error: "language_invalid" };
  }
  if (!body) return { ok: false as const, error: "body_required" };
  if (!body.includes("{{1}}")) return { ok: false as const, error: "body_missing_param" };
  if (header && header.length > 100) return { ok: false as const, error: "header_too_long" };
  if (footer && footer.length > 100) return { ok: false as const, error: "footer_too_long" };
  if (buttons.length > 3) return { ok: false as const, error: "buttons_max_3" };

  return {
    ok: true as const,
    value: { name, category, language, body, header, footer, buttons },
  };
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
    return withCookies(NextResponse.json({ error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ items: data ?? [] }));
}

export async function POST(req: NextRequest) {
  const auth = await requireWorkspaceRole(req, ["admin", "supervisor"]);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user } = auth;
  const body = (await req.json().catch(() => null)) as CreatePayload | null;
  if (!body) {
    return withCookies(NextResponse.json({ error: "invalid_payload" }, { status: 400 }));
  }

  const validated = validateTemplate(body);
  if (!validated.ok) {
    return withCookies(NextResponse.json({ error: validated.error }, { status: 400 }));
  }

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
    console.log("wa_template_events insert failed (create)", eventErr.message);
  }

  return withCookies(NextResponse.json({ template: inserted }));
}
