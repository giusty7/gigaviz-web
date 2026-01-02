import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceRole } from "@/lib/supabase/workspace-role";
import { fetchMetaTemplates } from "@/lib/wa/templates";

type MetaTemplate = {
  id?: string;
  name?: string;
  status?: string;
  language?: string;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTemplates(data: unknown): MetaTemplate[] {
  const root = data as { data?: unknown };
  if (root && Array.isArray(root.data)) {
    return root.data as MetaTemplate[];
  }
  return [];
}

function sanitizeToken(value: string) {
  const trimmed = value.trim();
  const unquoted =
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1).trim()
      : trimmed;
  if (/\s/.test(unquoted)) {
    throw new Error("WA_ACCESS_TOKEN contains whitespace");
  }
  return unquoted;
}

function validateEnv() {
  const token = process.env.WA_ACCESS_TOKEN || process.env.WA_CLOUD_API_TOKEN || "";
  const wabaId = process.env.WA_WABA_ID || "";
  if (!token) return { ok: false as const, error: "Missing WA access token" };
  if (!wabaId) return { ok: false as const, error: "Missing WA_WABA_ID" };
  try {
    sanitizeToken(token);
  } catch (err: unknown) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Invalid token" };
  }
  return { ok: true as const };
}

export async function POST(req: NextRequest) {
  const auth = await requireWorkspaceRole(req, ["admin", "supervisor"]);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user } = auth;

  const envCheck = validateEnv();
  if (!envCheck.ok) {
    return withCookies(
      NextResponse.json(
        { ok: false, error: { message: envCheck.error, code: null, subcode: null, fbtrace_id: null } },
        { status: 400 }
      )
    );
  }

  let metaResponse: unknown = null;
  try {
    metaResponse = await fetchMetaTemplates();
  } catch (err: unknown) {
    const data = err as { message?: string; code?: number; subcode?: number; fbtrace_id?: string };
    const message = data?.message || (err instanceof Error ? err.message : "Meta API error");
    return withCookies(
      NextResponse.json(
        {
          ok: false,
          error: {
            message,
            code: data?.code ?? null,
            subcode: data?.subcode ?? null,
            fbtrace_id: data?.fbtrace_id ?? null,
          },
        },
        { status: 502 }
      )
    );
  }

  const templates = normalizeTemplates(metaResponse);
  let updated = 0;

  for (const t of templates) {
    const metaId = asString(t.id);
    const name = asString(t.name);
    const language = asString(t.language);
    const status = asString(t.status);
    if (!metaId && !name) continue;

    const query = db
      .from("wa_templates")
      .update({
        status: status || "pending",
        meta_template_id: metaId || null,
        meta_response: t ?? {},
        updated_at: new Date().toISOString(),
      })
      .eq("workspace_id", workspaceId);

    if (metaId) {
      query.eq("meta_template_id", metaId);
    } else if (name && language) {
      query.eq("name", name).eq("language", language);
    } else if (name) {
      query.eq("name", name);
    }

    const { data, error } = await query.select("id");
    if (error) continue;
    const ids = (data ?? []).map((row: { id: string }) => row.id);
    if (ids.length === 0) continue;

    updated += ids.length;

    const eventRows = ids.map((id) => ({
      workspace_id: workspaceId,
      template_id: id,
      event_type: "template.sync",
      payload: t ?? {},
      created_by: user?.id ?? "system",
    }));
    const { error: eventErr } = await db.from("wa_template_events").insert(eventRows);
    if (eventErr) {
      console.log("wa_template_events insert failed (sync)", eventErr.message);
    }
  }

  return withCookies(NextResponse.json({ ok: true, updated }));
}
