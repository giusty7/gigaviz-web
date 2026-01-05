import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceRole } from "@/lib/supabase/workspace-role";
import { fetchGraph, getMetaAccessToken, normalizeGraphVersion } from "@/lib/meta/graph";
import { logMetaAdminAudit } from "@/lib/meta/audit";

export const runtime = "nodejs";

type MetaTemplate = {
  id?: string;
  name?: string;
  status?: string;
  category?: string;
  language?: string;
};

type TemplatesResponse = {
  data?: MetaTemplate[];
  paging?: { cursors?: { after?: string } };
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function fetchAllTemplates(token: string, version: string, wabaId: string) {
  const templates: MetaTemplate[] = [];
  let after: string | null = null;
  do {
    const url = new URL(`https://graph.facebook.com/${version}/${wabaId}/message_templates`);
    url.searchParams.set("fields", "name,language,status,category,id");
    url.searchParams.set("limit", "250");
    if (after) url.searchParams.set("after", after);
    const data = await fetchGraph<TemplatesResponse>(url.toString(), token);
    if (Array.isArray(data.data)) templates.push(...data.data);
    after = data.paging?.cursors?.after ?? null;
  } while (after);
  return templates;
}

export async function POST(req: NextRequest) {
  const auth = await requireWorkspaceRole(req, ["admin", "supervisor"]);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user } = auth;
  const body = (await req.json().catch(() => ({}))) as { wabaId?: unknown };
  const wabaId = asString(body?.wabaId) || process.env.WA_WABA_ID || "";

  if (!wabaId) {
    return withCookies(
      NextResponse.json({ ok: false, error: "missing_waba_id" }, { status: 400 })
    );
  }

  try {
    const token = getMetaAccessToken();
    const version = normalizeGraphVersion(process.env.WA_GRAPH_VERSION);
    const templates = await fetchAllTemplates(token, version, wabaId);

    let updated = 0;
    let inserted = 0;
    let approved = 0;

    for (const t of templates) {
      const metaId = asString(t.id);
      const name = asString(t.name);
      const language = asString(t.language);
      const status = asString(t.status);
      const category = asString(t.category);
      if (!metaId && !name) continue;
      if (status.toUpperCase() === "APPROVED") approved += 1;

      let existingId: string | null = null;
      let existingErr: { message: string } | null = null;

      if (metaId) {
        const lookup = await db
          .from("wa_templates")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("meta_template_id", metaId)
          .maybeSingle();
        existingId = lookup.data?.id ?? null;
        existingErr = lookup.error;
      }

      if (!existingId && name) {
        const lookup = db
          .from("wa_templates")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("name", name);
        if (language) lookup.eq("language", language);
        const result = await lookup.maybeSingle();
        existingId = result.data?.id ?? null;
        existingErr = result.error;
      }

      if (existingErr) {
        console.log("wa_templates lookup failed (meta_sync)", existingErr.message);
      }

      if (existingId) {
        const updatePayload: Record<string, unknown> = {
          status: status || "pending",
          meta_template_id: metaId || null,
          meta_response: t ?? {},
          updated_at: new Date().toISOString(),
        };
        if (category) updatePayload.category = category;
        if (language) updatePayload.language = language;

        const { data, error } = await db
          .from("wa_templates")
          .update(updatePayload)
          .eq("id", existingId)
          .select("id");

        if (!error && data?.length) {
          updated += data.length;
        }
        continue;
      }

      const { data: insertedRow, error: insertErr } = await db
        .from("wa_templates")
        .insert({
          workspace_id: workspaceId,
          name: name || metaId,
          category: category || "UTILITY",
          language: language || "en_US",
          status: status || "pending",
          body: "Synced from Meta",
          header: null,
          footer: null,
          buttons: [],
          meta_template_id: metaId || null,
          meta_payload: {},
          meta_response: t ?? {},
        })
        .select("id")
        .single();

      if (insertErr || !insertedRow) {
        if (insertErr) {
          console.log("wa_templates insert failed (meta_sync)", insertErr.message);
        }
        continue;
      }

      inserted += 1;
    }

    await logMetaAdminAudit({
      db,
      workspaceId,
      userId: user?.id ?? null,
      action: "sync_templates",
      ok: true,
      detail: { waba_id: wabaId, total: templates.length, approved, updated, inserted },
    });

    return withCookies(
      NextResponse.json({ ok: true, total: templates.length, approved, updated, inserted })
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Meta API error";
    await logMetaAdminAudit({
      db,
      workspaceId,
      userId: user?.id ?? null,
      action: "sync_templates",
      ok: false,
      error: message,
    });
    return withCookies(
      NextResponse.json({ ok: false, error: message }, { status: 500 })
    );
  }
}
