import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  forbiddenResponse,
  requireWorkspaceMember,
  requireWorkspaceRole,
  unauthorizedResponse,
  workspaceRequiredResponse,
} from "@/lib/auth/guard";
import { rateLimit } from "@/lib/rate-limit";
import {
  findConnectionById,
  findConnectionForWorkspace,
  findTokenForConnection,
  findWorkspaceBySlug,
} from "@/lib/meta/wa-connections";
import { logMetaAdminAudit } from "@/lib/meta/audit";

export const runtime = "nodejs";

type MetaTemplateResponse = {
  id?: string;
  name?: string;
  status?: string;
  category?: string;
  language?: string;
  quality_score?: { score?: string; quality?: string } | string | null;
  rejection_reason?: string | null;
  components?: unknown[];
  error?: { message?: string };
};

function normalizeGraphVersion(raw?: string) {
  const cleaned = (raw || "").trim();
  if (!cleaned) return "v19.0";
  return cleaned.startsWith("v") ? cleaned : `v${cleaned}`;
}

function isUuid(value: string) {
  return /^[0-9a-f-]{36}$/i.test(value);
}

function extractPieces(components?: unknown[]) {
  const blocks = Array.isArray(components) ? components : [];
  const findText = (type: string) =>
    (blocks.find((c) => (c as { type?: string })?.type === type) as {
      text?: string;
      format?: string;
    } | undefined)?.text;
  const headerBlock = blocks.find((c) => (c as { type?: string })?.type === "HEADER") as
    | { format?: string; text?: string }
    | undefined;
  const buttons = blocks.filter((c) => (c as { type?: string })?.type === "BUTTONS");
  const headerVal =
    headerBlock?.format === "TEXT"
      ? headerBlock?.text
      : headerBlock
      ? JSON.stringify(headerBlock)
      : "";

  return {
    body: findText("BODY") ?? "",
    header: headerVal ?? "",
    footer: findText("FOOTER") ?? "",
    buttons: buttons.length ? buttons : [],
  };
}

async function resolveWorkspaceId(
  adminDb: ReturnType<typeof supabaseAdmin>,
  workspaceSlug?: string | null,
  workspaceIdParam?: string | null,
  connectionId?: string | null,
  phoneNumberId?: string | null
) {
  let workspaceId = workspaceIdParam ?? null;
  let connection = null as Awaited<ReturnType<typeof findConnectionById>>["data"];

  if (connectionId) {
    const { data, error } = await findConnectionById(adminDb, connectionId);
    if (error || !data) {
      return { error: "connection_not_found" as const };
    }
    connection = data;
    workspaceId = data.workspace_id;
  } else if (workspaceSlug) {
    const { data, error } = await findWorkspaceBySlug(adminDb, workspaceSlug);
    if (error || !data) {
      return { error: "workspace_not_found" as const };
    }
    workspaceId = data.id;
  }

  if (!workspaceId) {
    return { error: "workspace_required" as const };
  }

  if (!connection) {
    const { data } = await findConnectionForWorkspace(adminDb, workspaceId, phoneNumberId);
    connection = data;
  }

  return { workspaceId, connection };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const { templateId } = await params;
  const body = await req.json().catch(() => ({}));
  const url = new URL(req.url);
  const workspaceSlug = body.workspaceSlug ?? url.searchParams.get("workspaceSlug");
  const workspaceIdParam = body.workspaceId ?? url.searchParams.get("workspaceId");
  const connectionId = body.connectionId ?? url.searchParams.get("connectionId");
  const phoneNumberId = body.phoneNumberId ?? url.searchParams.get("phoneNumberId");

  const adminDb = supabaseAdmin();
  const resolved = await resolveWorkspaceId(
    adminDb,
    workspaceSlug,
    workspaceIdParam,
    connectionId,
    phoneNumberId
  );

  if (resolved.error === "workspace_required") {
    return workspaceRequiredResponse(withCookies);
  }
  if (resolved.error === "workspace_not_found") {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "workspace_not_found", message: "Workspace not found" },
        { status: 404 }
      )
    );
  }
  if (resolved.error === "connection_not_found") {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "connection_not_found", message: "Connection not found" },
        { status: 404 }
      )
    );
  }

  const { workspaceId, connection } = resolved as {
    workspaceId: string;
    connection: Awaited<ReturnType<typeof findConnectionById>>["data"];
  };

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin"])) {
    return forbiddenResponse(withCookies);
  }

  const limiter = rateLimit(`wa-template-refresh:${workspaceId}:${userData.user.id}`, {
    windowMs: 60_000,
    max: 10,
  });
  if (!limiter.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 })
    );
  }

  const db = supabaseAdmin();
  const query = db
    .from("wa_templates")
    .select(
      "id, meta_template_id, name, language, phone_number_id, status, category, quality_score, rejection_reason"
    )
    .eq("workspace_id", workspaceId);

  if (isUuid(templateId)) {
    query.eq("id", templateId);
  } else {
    query.eq("meta_template_id", templateId);
  }

  const { data: row, error: rowErr } = await query.maybeSingle();
  if (rowErr || !row) {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "template_not_found", message: "Template not found" },
        { status: 404 }
      )
    );
  }

  const { data: tokenRow } = await findTokenForConnection(
    db,
    workspaceId,
    connection?.phone_number_id ?? null,
    connection?.waba_id ?? null
  );

  if (!tokenRow?.token_encrypted) {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "token_missing", message: "WhatsApp token is not set" },
        { status: 400 }
      )
    );
  }

  const metaId = row.meta_template_id ?? (isUuid(templateId) ? null : templateId);
  if (!metaId) {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "meta_id_missing", message: "Meta template ID is not available yet" },
        { status: 400 }
      )
    );
  }

  const version = normalizeGraphVersion(process.env.WA_GRAPH_VERSION);
  let metaResponse: MetaTemplateResponse | null = null;
  let metaError: string | null = null;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${version}/${metaId}?fields=id,name,status,category,language,quality_score,components,rejection_reason`,
      {
        headers: {
          Authorization: `Bearer ${tokenRow.token_encrypted}`,
        },
      }
    );
    const json = (await res.json().catch(() => ({}))) as MetaTemplateResponse;
    if (!res.ok) {
      metaError = json?.error?.message ?? `meta_refresh_failed_${res.status}`;
    } else {
      metaResponse = json;
    }
  } catch (err) {
    metaError = err instanceof Error ? err.message : "meta_refresh_failed";
  }

  if (metaError || !metaResponse) {
    await logMetaAdminAudit({
      db,
      workspaceId,
      userId: userData.user.id,
      action: "wa_template_refresh",
      ok: false,
      error: metaError ?? "meta_refresh_failed",
    });

    return withCookies(
      NextResponse.json(
        { ok: false, code: "meta_refresh_failed", message: metaError },
        { status: 502 }
      )
    );
  }

  const now = new Date().toISOString();
  const pieces = extractPieces(metaResponse.components);
  const qualityRaw = metaResponse.quality_score as Record<string, unknown> | string | null | undefined;
  const quality =
    typeof qualityRaw === "string"
      ? qualityRaw
      : (qualityRaw?.score as string | undefined) ??
        (qualityRaw?.quality as string | undefined) ??
        (qualityRaw ? JSON.stringify(qualityRaw) : null);

  const { data: updated, error: updateError } = await db
    .from("wa_templates")
    .update({
      status: metaResponse.status ?? row.status,
      category: metaResponse.category ?? row.category,
      language: metaResponse.language ?? row.language,
      quality_score: quality ?? row.quality_score,
      rejection_reason: metaResponse.rejection_reason ?? row.rejection_reason,
      body: pieces.body,
      header: pieces.header,
      footer: pieces.footer,
      buttons: pieces.buttons,
      meta_response: metaResponse,
      updated_at: now,
      last_synced_at: now,
    })
    .eq("workspace_id", workspaceId)
    .eq("id", row.id)
    .select("id, name, language, status, category, quality_score, rejection_reason, updated_at")
    .single();

  if (updateError) {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "db_update_failed", message: updateError.message },
        { status: 500 }
      )
    );
  }

  await logMetaAdminAudit({
    db,
    workspaceId,
    userId: userData.user.id,
    action: "wa_template_refresh",
    ok: true,
    detail: { templateId: row.id, metaId, connectionId: connection?.id ?? null },
  });

  return withCookies(
    NextResponse.json({
      ok: true,
      template: updated,
      meta: metaResponse,
    })
  );
}
