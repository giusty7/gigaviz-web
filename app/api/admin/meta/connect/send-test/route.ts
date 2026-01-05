import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceRole } from "@/lib/supabase/workspace-role";
import { normalizePhone } from "@/lib/contacts/normalize";
import { fetchGraph, getMetaAccessToken, normalizeGraphVersion } from "@/lib/meta/graph";
import { logMetaAdminAudit } from "@/lib/meta/audit";

export const runtime = "nodejs";

type ContactRow = {
  id: string;
  phone: string | null;
  opted_in: boolean | null;
  opted_out: boolean | null;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isTruthy(value: string | undefined) {
  const v = (value || "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

export async function POST(req: NextRequest) {
  const auth = await requireWorkspaceRole(req, ["admin", "supervisor"]);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user } = auth;
  const body = (await req.json().catch(() => ({}))) as {
    contactId?: unknown;
    templateName?: unknown;
    language?: unknown;
    phoneNumberId?: unknown;
  };

  const contactId = asString(body.contactId);
  const templateName = asString(body.templateName);
  const language = asString(body.language) || "id";
  const phoneNumberId = asString(body.phoneNumberId) || process.env.WA_PHONE_NUMBER_ID || "";

  if (!contactId) {
    return withCookies(NextResponse.json({ error: "contact_id_required" }, { status: 400 }));
  }
  if (!templateName) {
    return withCookies(NextResponse.json({ error: "template_name_required" }, { status: 400 }));
  }
  if (!phoneNumberId) {
    return withCookies(NextResponse.json({ error: "wa_phone_number_id_missing" }, { status: 400 }));
  }

  const { data: contact, error: cErr } = await db
    .from("contacts")
    .select("id, phone, opted_in, opted_out")
    .eq("workspace_id", workspaceId)
    .eq("id", contactId)
    .single();

  if (cErr || !contact) {
    return withCookies(NextResponse.json({ error: cErr?.message || "contact_not_found" }, { status: 404 }));
  }

  const row = contact as ContactRow;
  if (!row.opted_in || row.opted_out) {
    return withCookies(
      NextResponse.json({ error: "contact_not_opted_in" }, { status: 403 })
    );
  }

  const phone = row.phone ? normalizePhone(row.phone) : "";
  if (!phone) {
    return withCookies(NextResponse.json({ error: "contact_phone_missing" }, { status: 400 }));
  }
  const to = `+${phone}`;

  if (!isTruthy(process.env.ENABLE_WA_SEND)) {
    await logMetaAdminAudit({
      db,
      workspaceId,
      userId: user?.id ?? null,
      action: "send_test_template",
      ok: true,
      detail: { contact_id: contactId, template: templateName, language, dry_run: true },
    });
    return withCookies(NextResponse.json({ ok: true, status: "dry_run" }));
  }

  try {
    const token = getMetaAccessToken();
    const version = normalizeGraphVersion(process.env.WA_GRAPH_VERSION);
    const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: language },
        components: [],
      },
    };

    const data = await fetchGraph<Record<string, unknown>>(url, token, {
      method: "POST",
      body: payload,
    });

    await logMetaAdminAudit({
      db,
      workspaceId,
      userId: user?.id ?? null,
      action: "send_test_template",
      ok: true,
      detail: { contact_id: contactId, template: templateName, language },
    });

    return withCookies(NextResponse.json({ ok: true, status: "sent", data }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Meta API error";
    await logMetaAdminAudit({
      db,
      workspaceId,
      userId: user?.id ?? null,
      action: "send_test_template",
      ok: false,
      error: message,
    });
    return withCookies(
      NextResponse.json({ ok: false, error: message }, { status: 500 })
    );
  }
}
