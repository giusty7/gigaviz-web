import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  forbiddenResponse,
  requireWorkspaceMember,
  unauthorizedResponse,
  workspaceRequiredResponse,
} from "@/lib/auth/guard";
import {
  findConnectionById,
  findConnectionForWorkspace,
  findTokenForConnection,
  findWorkspaceBySlug,
} from "@/lib/meta/wa-connections";

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const { templateId } = await params;
  const url = new URL(req.url);
  const workspaceSlug = url.searchParams.get("workspaceSlug");
  const workspaceIdParam = url.searchParams.get("workspaceId");
  const connectionId = url.searchParams.get("connectionId");
  const phoneNumberId = url.searchParams.get("phoneNumberId");

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
        { ok: false, code: "workspace_not_found", message: "Workspace tidak ditemukan" },
        { status: 404 }
      )
    );
  }
  if (resolved.error === "connection_not_found") {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "connection_not_found", message: "Connection tidak ditemukan" },
        { status: 404 }
      )
    );
  }

  const { workspaceId, connection } = resolved as {
    workspaceId: string;
    connection: Awaited<ReturnType<typeof findConnectionForWorkspace>>["data"];
  };
  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok) {
    return forbiddenResponse(withCookies);
  }

  const db = supabaseAdmin();
  const query = db
    .from("wa_templates")
    .select(
      "id, name, language, status, category, quality_score, rejection_reason, phone_number_id, last_synced_at, updated_at, body, header, footer, buttons, meta_template_id, meta_payload, meta_response"
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
        { ok: false, code: "template_not_found", message: "Template tidak ditemukan" },
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

  const metaId = row.meta_template_id ?? (isUuid(templateId) ? null : templateId);
  if (!metaId || !tokenRow?.token_encrypted) {
    return withCookies(
      NextResponse.json({ ok: true, template: row, meta: null, metaError: null })
    );
  }

  const version = normalizeGraphVersion(process.env.WA_GRAPH_VERSION);
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
      return withCookies(
        NextResponse.json({
          ok: true,
          template: row,
          meta: null,
          metaError: json?.error?.message ?? `meta_fetch_failed_${res.status}`,
        })
      );
    }

    return withCookies(NextResponse.json({ ok: true, template: row, meta: json }));
  } catch (err) {
    return withCookies(
      NextResponse.json({
        ok: true,
        template: row,
        meta: null,
        metaError: err instanceof Error ? err.message : "meta_fetch_failed",
      })
    );
  }
}
