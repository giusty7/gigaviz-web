import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceRole } from "@/lib/supabase/workspace-role";
import { fetchGraph, getMetaAccessToken, normalizeGraphVersion } from "@/lib/meta/graph";
import { logMetaAdminAudit } from "@/lib/meta/audit";
import { normalizePhone } from "@/lib/contacts/normalize";

export const runtime = "nodejs";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toE164(raw: string) {
  const digits = normalizePhone(raw);
  if (!digits) return "";
  return `+${digits}`;
}

export async function POST(req: NextRequest) {
  const auth = await requireWorkspaceRole(req, ["admin", "supervisor"]);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user } = auth;
  const body = (await req.json().catch(() => ({}))) as { phoneE164?: unknown };
  const phoneRaw = asString(body.phoneE164);
  const phoneE164 = phoneRaw ? toE164(phoneRaw) : "";

  if (!phoneE164) {
    return withCookies(NextResponse.json({ ok: false, error: "phone_required" }, { status: 400 }));
  }

  const targetId = process.env.WA_WABA_ID || process.env.META_APP_ID || "";
  if (!targetId) {
    return withCookies(
      NextResponse.json({ ok: false, error: "WA_WABA_ID or META_APP_ID missing" }, { status: 400 })
    );
  }

  try {
    const token = getMetaAccessToken();
    const version = normalizeGraphVersion(process.env.WA_GRAPH_VERSION);
    const url = `https://graph.facebook.com/${version}/${targetId}/events`;
    const payload = {
      event_name: "Lead",
      event_time: new Date().toISOString(),
      phone_e164: phoneE164,
      source: "meta_test",
      consent_status: "unknown",
      custom_data: { test: true },
    };

    const data = await fetchGraph<Record<string, unknown>>(url, token, {
      method: "POST",
      body: payload,
    });

    await logMetaAdminAudit({
      db,
      workspaceId,
      userId: user?.id ?? null,
      action: "test_manage_events",
      ok: true,
      detail: { target_id: targetId },
    });

    return withCookies(NextResponse.json({ ok: true, data }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Meta API error";
    await logMetaAdminAudit({
      db,
      workspaceId,
      userId: user?.id ?? null,
      action: "test_manage_events",
      ok: false,
      error: message,
    });
    return withCookies(
      NextResponse.json({ ok: false, error: message }, { status: 500 })
    );
  }
}
