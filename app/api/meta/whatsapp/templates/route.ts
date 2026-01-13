import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

const nameRegex = /^[a-z0-9_]{3,512}$/;

const buttonSchema = z
  .object({
    type: z.enum(["QUICK_REPLY", "URL", "PHONE_NUMBER"]),
    text: z.string().min(1),
    url: z.string().url().optional(),
    phone_number: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "URL" && !val.url) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "URL wajib diisi" });
    }
    if (val.type === "PHONE_NUMBER" && !val.phone_number) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Nomor telepon wajib diisi" });
    }
  });

const createSchema = z.object({
  workspaceId: z.string().uuid().optional(),
  workspaceSlug: z.string().optional(),
  connectionId: z.string().uuid().optional(),
  name: z.string().trim().regex(nameRegex, "Gunakan huruf kecil + underscore"),
  language: z.string().min(2),
  category: z.enum(["MARKETING", "UTILITY", "AUTHENTICATION"]),
  components: z.object({
    header: z
      .object({
        text: z.string().min(1),
      })
      .optional()
      .nullable(),
    body: z.object({
      text: z.string().min(1),
    }),
    footer: z
      .object({
        text: z.string().min(1),
      })
      .optional()
      .nullable(),
    buttons: z.array(buttonSchema).optional().nullable(),
  }),
  examples: z
    .object({
      header: z.array(z.string()).optional(),
      body: z.array(z.string()).optional(),
    })
    .optional(),
});

type MetaTemplateComponent =
  | { type: "BODY"; text: string; example?: { body_text?: string[][] } }
  | { type: "HEADER"; format: "TEXT"; text: string; example?: { header_text?: string[] } }
  | { type: "FOOTER"; text: string }
  | { type: "BUTTONS"; buttons: Array<Record<string, unknown>> };

type MetaTemplateResponse = {
  id?: string;
  name?: string;
  status?: string;
  category?: string;
  language?: string;
  quality_score?: { score?: string; quality?: string } | string | null;
  rejection_reason?: string | null;
  components?: unknown[];
};

function normalizeGraphVersion(raw?: string) {
  const cleaned = (raw || "").trim();
  if (!cleaned) return "v19.0";
  return cleaned.startsWith("v") ? cleaned : `v${cleaned}`;
}

function buildMetaPayload(input: z.infer<typeof createSchema>) {
  const components: MetaTemplateComponent[] = [];
  const bodyExample = input.examples?.body?.length ? [input.examples.body] : undefined;

  components.push({
    type: "BODY",
    text: input.components.body.text,
    ...(bodyExample ? { example: { body_text: bodyExample } } : {}),
  });

  if (input.components.header?.text) {
    const headerExample = input.examples?.header?.length
      ? { header_text: input.examples.header }
      : undefined;
    components.push({
      type: "HEADER",
      format: "TEXT",
      text: input.components.header.text,
      ...(headerExample ? { example: headerExample } : {}),
    });
  }

  if (input.components.footer?.text) {
    components.push({ type: "FOOTER", text: input.components.footer.text });
  }

  if (input.components.buttons && input.components.buttons.length > 0) {
    const buttons = input.components.buttons.map((btn) => {
      if (btn.type === "URL") {
        return { type: "URL", text: btn.text, url: btn.url };
      }
      if (btn.type === "PHONE_NUMBER") {
        return { type: "PHONE_NUMBER", text: btn.text, phone_number: btn.phone_number };
      }
      return { type: "QUICK_REPLY", text: btn.text };
    });
    components.push({ type: "BUTTONS", buttons });
  }

  return {
    name: input.name,
    category: input.category,
    language: input.language,
    components,
  };
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

export async function GET(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const url = new URL(req.url);
  const workspaceSlug = url.searchParams.get("workspaceSlug");
  const workspaceIdParam = url.searchParams.get("workspaceId");
  const connectionId = url.searchParams.get("connectionId");
  const phoneNumberId = url.searchParams.get("phoneNumberId");
  const query = url.searchParams.get("q");

  const adminDb = supabaseAdmin();
  let workspaceId = workspaceIdParam ?? null;
  let connection = null as Awaited<ReturnType<typeof findConnectionById>>["data"];

  if (connectionId) {
    const { data, error } = await findConnectionById(adminDb, connectionId);
    if (error || !data) {
      return withCookies(
        NextResponse.json(
          { ok: false, code: "connection_not_found", message: "Connection tidak ditemukan" },
          { status: 404 }
        )
      );
    }
    connection = data;
    workspaceId = data.workspace_id;
  } else if (workspaceSlug) {
    const { data, error } = await findWorkspaceBySlug(adminDb, workspaceSlug);
    if (error || !data) {
      return withCookies(
        NextResponse.json(
          { ok: false, code: "workspace_not_found", message: "Workspace tidak ditemukan" },
          { status: 404 }
        )
      );
    }
    workspaceId = data.id;
  }

  if (!workspaceId) {
    return workspaceRequiredResponse(withCookies);
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok) {
    return forbiddenResponse(withCookies);
  }

  const queryBuilder = adminDb
    .from("wa_templates")
    .select(
      "id, name, language, status, category, quality_score, rejection_reason, phone_number_id, last_synced_at, updated_at, body, header, footer, buttons, meta_payload, meta_response"
    )
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });

  const filterPhone = connection?.phone_number_id ?? phoneNumberId ?? null;
  if (filterPhone) {
    queryBuilder.eq("phone_number_id", filterPhone);
  }

  if (query) {
    queryBuilder.ilike("name", `%${query}%`);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    return withCookies(
      NextResponse.json(
        {
          ok: false,
          code: "db_error",
          message: "Gagal mengambil templates",
          details: error.message,
        },
        { status: 500 }
      )
    );
  }

  return withCookies(
    NextResponse.json({
      ok: true,
      templates: data ?? [],
    })
  );
}

export async function POST(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", reason: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const adminDb = supabaseAdmin();
  let workspaceId = parsed.data.workspaceId ?? null;
  let connection = null as Awaited<ReturnType<typeof findConnectionById>>["data"];

  if (parsed.data.connectionId) {
    const { data, error } = await findConnectionById(adminDb, parsed.data.connectionId);
    if (error || !data) {
      return withCookies(
        NextResponse.json(
          { ok: false, code: "connection_not_found", message: "Connection tidak ditemukan" },
          { status: 404 }
        )
      );
    }
    connection = data;
    workspaceId = data.workspace_id;
  } else if (parsed.data.workspaceSlug) {
    const { data, error } = await findWorkspaceBySlug(adminDb, parsed.data.workspaceSlug);
    if (error || !data) {
      return withCookies(
        NextResponse.json(
          { ok: false, code: "workspace_not_found", message: "Workspace tidak ditemukan" },
          { status: 404 }
        )
      );
    }
    workspaceId = data.id;
  }

  if (!workspaceId) {
    return workspaceRequiredResponse(withCookies);
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin"])) {
    return forbiddenResponse(withCookies);
  }

  const limiter = rateLimit(`wa-template-create:${workspaceId}:${userData.user.id}`, {
    windowMs: 60_000,
    max: 10,
  });
  if (!limiter.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 })
    );
  }

  if (!connection) {
    const { data } = await findConnectionForWorkspace(adminDb, workspaceId);
    connection = data;
  }

  if (!connection) {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "connection_missing", message: "Connection WhatsApp belum diset" },
        { status: 400 }
      )
    );
  }

  if (!connection.phone_number_id || !connection.waba_id) {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "connection_incomplete", message: "Phone number/WABA belum lengkap" },
        { status: 400 }
      )
    );
  }

  const { data: tokenRow } = await findTokenForConnection(
    adminDb,
    workspaceId,
    connection.phone_number_id,
    connection.waba_id
  );

  if (!tokenRow?.token_encrypted) {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "token_missing", message: "Token WhatsApp belum diset" },
        { status: 400 }
      )
    );
  }

  const version = normalizeGraphVersion(process.env.WA_GRAPH_VERSION);
  const metaPayload = buildMetaPayload(parsed.data);

  let metaResponse: MetaTemplateResponse | null = null;
  let metaError: string | null = null;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${version}/${connection.waba_id}/message_templates`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenRow.token_encrypted}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metaPayload),
      }
    );
    const json = (await res.json().catch(() => ({}))) as MetaTemplateResponse & {
      error?: { message?: string };
    };

    if (!res.ok) {
      metaError = json?.error?.message ?? `meta_create_failed_${res.status}`;
    } else {
      metaResponse = json;
    }
  } catch (err) {
    metaError = err instanceof Error ? err.message : "meta_create_failed";
  }

  if (metaError || !metaResponse) {
    await logMetaAdminAudit({
      db: adminDb,
      workspaceId,
      userId: userData.user.id,
      action: "wa_template_create",
      ok: false,
      error: metaError ?? "meta_create_failed",
    });

    return withCookies(
      NextResponse.json(
        { ok: false, code: "meta_create_failed", message: metaError },
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

  const row = {
    workspace_id: workspaceId,
    phone_number_id: connection.phone_number_id,
    name: metaResponse.name ?? parsed.data.name,
    language: metaResponse.language ?? parsed.data.language,
    status: metaResponse.status ?? "PENDING",
    category: metaResponse.category ?? parsed.data.category,
    body: pieces.body,
    header: pieces.header,
    footer: pieces.footer,
    buttons: pieces.buttons,
    meta_template_id: metaResponse.id ?? null,
    meta_payload: metaPayload,
    meta_response: metaResponse,
    quality_score: quality ?? null,
    rejection_reason: metaResponse.rejection_reason ?? null,
    last_synced_at: now,
    updated_at: now,
    created_at: now,
  };

  const { data: upserted, error: upsertError } = await adminDb
    .from("wa_templates")
    .upsert(row, { onConflict: "workspace_id,phone_number_id,name,language" })
    .select("id, name, language, status, category")
    .single();

  if (upsertError) {
    return withCookies(
      NextResponse.json(
        {
          ok: false,
          code: "db_upsert_failed",
          message: upsertError.message,
          details: upsertError.details,
        },
        { status: 500 }
      )
    );
  }

  await logMetaAdminAudit({
    db: adminDb,
    workspaceId,
    userId: userData.user.id,
    action: "wa_template_create",
    ok: true,
    detail: { name: row.name, language: row.language, category: row.category },
  });

  return withCookies(
    NextResponse.json({
      ok: true,
      templateId: metaResponse.id ?? null,
      status: row.status,
      template: upserted ?? row,
    })
  );
}
