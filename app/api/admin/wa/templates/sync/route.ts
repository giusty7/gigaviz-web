import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceRole } from "@/lib/supabase/workspace-role";
import { fetchMetaTemplates } from "@/lib/wa/templates";

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

function normalizeTemplates(data: unknown): MetaTemplate[] {
  const root = data as { data?: unknown };
  if (root && Array.isArray(root.data)) {
    return root.data as MetaTemplate[];
  }
  return [];
}

export async function POST(req: NextRequest) {
  const auth = await requireWorkspaceRole(req, ["admin", "supervisor"]);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user } = auth;

  let metaResponse: unknown = null;
  try {
    metaResponse = await fetchMetaTemplates();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Meta API error";
    return withCookies(NextResponse.json({ error: message }, { status: 502 }));
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
