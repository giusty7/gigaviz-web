import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import {
  forbiddenResponse,
  getWorkspaceId,
  requireWorkspaceMember,
  requireWorkspaceRole,
  unauthorizedResponse,
  workspaceRequiredResponse,
} from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { logMetaAdminAudit } from "@/lib/meta/audit";

type MetaTemplate = {
  name?: string;
  language?: string;
  status?: string;
  category?: string;
  components?: unknown;
  quality_score?: { score?: string | null };
  rejection_reason?: string | null;
  id?: string;
};

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const body = await req.json().catch(() => ({}));
  const workspaceId = getWorkspaceId(req, undefined, body.workspaceId);
  if (!workspaceId) {
    return workspaceRequiredResponse(withCookies);
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin"])) {
    return forbiddenResponse(withCookies);
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limiter = rateLimit(`wa-template-sync:${workspaceId}:${ip}`, { windowMs: 60_000, max: 3 });
  if (!limiter.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 })
    );
  }

  const adminDb = supabaseAdmin();
  const { data: phone, error: phoneError } = await adminDb
    .from("wa_phone_numbers")
    .select("phone_number_id, waba_id")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (phoneError || !phone) {
    return withCookies(
      NextResponse.json(
        {
          ok: false,
          code: "phone_not_found",
          message: "Nomor WhatsApp belum dikonfigurasi untuk workspace ini.",
          details: phoneError?.message ?? null,
        },
        { status: 400 }
      )
    );
  }

  if (!phone.phone_number_id) {
    return withCookies(
      NextResponse.json(
        {
          ok: false,
          code: "phone_number_missing",
          message: "Phone number ID belum diset.",
        },
        { status: 400 }
      )
    );
  }

  if (!phone.waba_id) {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "waba_id_missing", message: "WABA ID belum diset" },
        { status: 400 }
      )
    );
  }

  const { data: tokenRow } = await adminDb
    .from("meta_tokens")
    .select("token_encrypted")
    .eq("workspace_id", workspaceId)
    .eq("provider", "meta_whatsapp")
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (!tokenRow?.token_encrypted) {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "token_missing", message: "Token WhatsApp belum diset" },
        { status: 400 }
      )
    );
  }

  let templates: MetaTemplate[] = [];
  let fetchError: string | null = null;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phone.waba_id}/message_templates?limit=256`,
      {
        headers: {
          Authorization: `Bearer ${tokenRow.token_encrypted}`,
        },
      }
    );
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      fetchError = json?.error?.message ?? `sync_failed_${res.status}`;
    } else {
      templates = Array.isArray(json?.data) ? (json.data as MetaTemplate[]) : [];
    }
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "fetch_failed";
  }

  if (fetchError) {
    await logMetaAdminAudit({
      db: adminDb,
      workspaceId,
      userId: userData.user.id,
      action: "wa_templates_sync",
      ok: false,
      error: fetchError,
    });
    return withCookies(
      NextResponse.json(
        { ok: false, code: "graph_failed", message: fetchError, details: null },
        { status: 502 }
      )
    );
  }

  const now = new Date().toISOString();
  type TemplateComponent = {
    type?: string;
    format?: string;
    text?: string;
  };

  const rows = templates.map((tpl) => {
    const comps = Array.isArray(tpl.components) ? (tpl.components as TemplateComponent[]) : [];
    const bodyBlock = comps.find((c) => c?.type === "BODY");
    const headerBlock = comps.find((c) => c?.type === "HEADER");
    const footerBlock = comps.find((c) => c?.type === "FOOTER");
    const buttonsBlock = comps.filter((c) => c?.type === "BUTTONS");

    const qualityRaw = tpl.quality_score as Record<string, unknown> | undefined;
    const quality =
      (qualityRaw?.score as string | undefined) ??
      (qualityRaw?.quality as string | undefined) ??
      (qualityRaw ? JSON.stringify(qualityRaw) : null);

    const headerVal =
      headerBlock?.format === "TEXT"
        ? headerBlock?.text
        : headerBlock
        ? JSON.stringify(headerBlock)
        : null;

    return {
      workspace_id: workspaceId,
      phone_number_id: phone.phone_number_id,
      name: tpl.name ?? "unknown",
      language: tpl.language ?? "id",
      status: tpl.status ?? "pending",
      category: tpl.category ?? null,
      body: bodyBlock?.text ?? "",
      header: headerVal ?? "",
      footer: footerBlock?.text ?? "",
      buttons: buttonsBlock && buttonsBlock.length > 0 ? buttonsBlock : [],
      meta_template_id: tpl.id ?? null,
      meta_payload: tpl,
      meta_response: tpl,
      quality_score: quality,
      rejection_reason: tpl.rejection_reason ?? null,
      last_synced_at: now,
      updated_at: now,
      created_at: now,
    };
  });

  let inserted = 0;
  let updated = 0;

  if (rows.length > 0) {
    const { data: upserted, error: upsertError } = await adminDb
      .from("wa_templates")
      .upsert(rows, { onConflict: "workspace_id,phone_number_id,name,language" })
      .select("id, inserted_at:created_at, updated_at");

    if (upsertError) {
      const missingUnique =
        upsertError.message?.includes("no unique") ||
        upsertError.message?.includes("unique or exclusion constraint");
      if (process.env.NODE_ENV === "development") {
        console.error("[wa-templates-sync] upsert error", upsertError);
      }
      return withCookies(
        NextResponse.json(
          {
            ok: false,
            code: missingUnique ? "missing_unique_index" : "db_upsert_failed",
            message: missingUnique
              ? "Index unik (workspace_id, phone_number_id, name, language) belum tersedia."
              : upsertError.message ?? "Gagal menyimpan template",
            details: upsertError.details ?? upsertError.message,
            hint: (upsertError as { hint?: string }).hint ?? null,
          },
          { status: 500 }
        )
      );
    }

    inserted = upserted?.filter((r) => r.inserted_at === r.updated_at).length ?? 0;
    updated = (upserted?.length ?? 0) - inserted;
  }

  await logMetaAdminAudit({
    db: adminDb,
    workspaceId,
    userId: userData.user.id,
    action: "wa_templates_sync",
    ok: true,
    detail: { count: rows.length, inserted, updated },
  });

  return withCookies(
    NextResponse.json({
      ok: true,
      inserted,
      updated,
      total: rows.length,
      lastSyncedAt: now,
    })
  );
}
