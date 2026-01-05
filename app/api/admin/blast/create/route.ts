import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceRole } from "@/lib/supabase/workspace-role";
import { normalizePhone } from "@/lib/contacts/normalize";

export const runtime = "nodejs";

type Segment = {
  tag?: unknown;
  createdAfter?: unknown;
};

type CreatePayload = {
  name?: unknown;
  templateName?: unknown;
  language?: unknown;
  segment?: Segment;
};

type ContactRow = {
  id: string;
  phone: string | null;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseIsoDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function chunk<T>(items: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export async function POST(req: NextRequest) {
  const auth = await requireWorkspaceRole(req, ["admin", "supervisor"]);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user } = auth;
  const body = (await req.json().catch(() => ({}))) as CreatePayload;

  const name = asString(body.name);
  const templateName = asString(body.templateName);
  const language = asString(body.language);

  if (!name) {
    return withCookies(
      NextResponse.json({ error: "name_required" }, { status: 400 })
    );
  }
  if (!templateName) {
    return withCookies(
      NextResponse.json({ error: "template_name_required" }, { status: 400 })
    );
  }
  if (!language) {
    return withCookies(
      NextResponse.json({ error: "language_required" }, { status: 400 })
    );
  }

  const { data: tplRow, error: tplErr } = await db
    .from("wa_templates")
    .select("status")
    .eq("workspace_id", workspaceId)
    .eq("name", templateName)
    .eq("language", language)
    .maybeSingle();

  if (tplErr) {
    return withCookies(
      NextResponse.json({ error: tplErr.message }, { status: 500 })
    );
  }
  const tplStatus = (tplRow as { status?: string | null } | null)?.status || "";
  if (!tplStatus) {
    return withCookies(
      NextResponse.json({ error: "template_not_found" }, { status: 400 })
    );
  }
  if (tplStatus.toUpperCase() !== "APPROVED") {
    return withCookies(
      NextResponse.json({ error: "template_not_approved" }, { status: 400 })
    );
  }

  const segment = body.segment ?? {};
  const tag = asString(segment.tag);
  const createdAfterRaw = asString(segment.createdAfter);
  const createdAfter = createdAfterRaw ? parseIsoDate(createdAfterRaw) : null;
  if (createdAfterRaw && !createdAfter) {
    return withCookies(
      NextResponse.json({ error: "created_after_invalid" }, { status: 400 })
    );
  }

  let contactQuery = db
    .from("contacts")
    .select("id, phone")
    .eq("workspace_id", workspaceId)
    .eq("opted_in", true)
    .eq("opted_out", false)
    .not("phone", "is", null);

  if (tag) {
    contactQuery = contactQuery.contains("tags", [tag]);
  }
  if (createdAfter) {
    contactQuery = contactQuery.gte("created_at", createdAfter);
  }

  const { data: contacts, error: contactErr } = await contactQuery;
  if (contactErr) {
    return withCookies(
      NextResponse.json({ error: contactErr.message }, { status: 500 })
    );
  }

  const { data: campaign, error: campaignErr } = await db
    .from("campaigns")
    .insert({
      workspace_id: workspaceId,
      name,
      template_name: templateName,
      language,
      status: "queued",
      created_by: user?.id ?? "system",
    })
    .select("id, name, template_name, language, status, created_at")
    .single();

  if (campaignErr || !campaign) {
    return withCookies(
      NextResponse.json({ error: campaignErr?.message || "campaign_insert_failed" }, { status: 500 })
    );
  }

  const rows = (contacts ?? [])
    .map((c: ContactRow) => {
      const phone = c.phone ? normalizePhone(c.phone) : "";
      if (!phone) return null;
      return {
        campaign_id: campaign.id,
        contact_id: c.id,
        to_phone: phone,
        status: "queued",
      };
    })
    .filter(Boolean) as Array<{
    campaign_id: string;
    contact_id: string;
    to_phone: string;
    status: string;
  }>;

  for (const batch of chunk(rows, 500)) {
    const { error: insErr } = await db.from("campaign_recipients").insert(batch);
    if (insErr) {
      return withCookies(
        NextResponse.json({ error: insErr.message }, { status: 500 })
      );
    }
  }

  return withCookies(
    NextResponse.json({ ok: true, campaign, recipients: rows.length })
  );
}
