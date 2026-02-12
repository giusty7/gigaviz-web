import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceRole } from "@/lib/supabase/workspace-role";
import { fetchMetaTemplates } from "@/lib/wa/templates";
import { withErrorHandler } from "@/lib/api/with-error-handler";

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

function buildSyncSummary(templates: MetaTemplate[]) {
  const total = templates.length;
  const withId = templates.filter((t) => Boolean(t.id)).length;
  return { total, withId };
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireWorkspaceRole(req, ["admin", "supervisor"]);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user } = auth;

  let metaResponse: unknown = null;
  try {
    metaResponse = await fetchMetaTemplates();
  } catch (err: unknown) {
    const data = err as {
      message?: string;
      code?: number;
      subcode?: number;
      fbtrace_id?: string;
      status?: number;
      requestUrl?: string;
    };
    const requestUrl = typeof data?.requestUrl === "string" ? data.requestUrl : null;
    const baseMessage =
      data?.message || (err instanceof Error ? err.message : "Meta API error");
    const message = requestUrl ? `${baseMessage} (url: ${requestUrl})` : baseMessage;
    return withCookies(
      NextResponse.json(
        {
          ok: false,
          error: {
            message,
            code: data?.code ?? null,
            subcode: data?.subcode ?? null,
            fbtrace_id: data?.fbtrace_id ?? null,
            status: data?.status ?? null,
            request_url: requestUrl,
          },
        },
        { status: 502 }
      )
    );
  }

  const templates = normalizeTemplates(metaResponse);
  const summary = buildSyncSummary(templates);
  logger.info("WA_TEMPLATE_SYNC_META", JSON.stringify({ workspaceId, ...summary }));
  let updated = 0;
  let inserted = 0;

  for (const t of templates) {
    const metaId = asString(t.id);
    const name = asString(t.name);
    const language = asString(t.language);
    const status = asString(t.status);
    const category = asString(t.category);
    if (!metaId && !name) continue;

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
      const lookupData = result as { data?: { id?: string | null }; error?: { message: string } | null };
      existingId = lookupData.data?.id ?? null;
      existingErr = lookupData.error ?? null;
    }

    if (existingErr) {
      logger.info("wa_templates lookup failed (sync)", existingErr.message);
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
        const { error: eventErr } = await db.from("wa_template_events").insert({
          workspace_id: workspaceId,
          template_id: existingId,
          event_type: "template.sync",
          payload: t ?? {},
          created_by: user?.id ?? "system",
        });
        if (eventErr) {
          logger.info("wa_template_events insert failed (sync)", eventErr.message);
        }
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
        logger.info("wa_templates insert failed (sync)", insertErr.message);
      }
      continue;
    }

    inserted += 1;
    const { error: eventErr } = await db.from("wa_template_events").insert({
      workspace_id: workspaceId,
      template_id: insertedRow.id,
      event_type: "template.sync",
      payload: t ?? {},
      created_by: user?.id ?? "system",
    });
    if (eventErr) {
      logger.info("wa_template_events insert failed (sync)", eventErr.message);
    }
  }

  return withCookies(NextResponse.json({ ok: true, updated, inserted, total: templates.length }));
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireWorkspaceRole(req, ["admin", "supervisor"]);
  if (!auth.ok) return auth.res;

  const { withCookies } = auth;
  return withCookies(
    NextResponse.json(
      { ok: false, error: { message: "Use POST to sync templates from Meta." } },
      { status: 405 }
    )
  );
});
