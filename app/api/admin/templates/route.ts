import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceRole } from "@/lib/supabase/workspace-role";

type DraftInput = {
  name?: unknown;
  category?: unknown;
  language?: unknown;
  body?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function buildDraft(input: DraftInput) {
  const now = Date.now();
  const name = asString(input.name) || `draft_${now}`;
  const category = asString(input.category) || "UTILITY";
  const language = asString(input.language) || "en_US";
  const body = asString(input.body) || "Hi {{1}}";
  return { name, category, language, body };
}

export async function GET(req: NextRequest) {
  const auth = await requireWorkspaceRole(req, ["admin", "supervisor", "agent"]);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const { data, error } = await db
    .from("wa_templates")
    .select("id, name, category, language, status, updated_at")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });

  if (error) {
    return withCookies(NextResponse.json({ error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ templates: data ?? [] }));
}

export async function POST(req: NextRequest) {
  const auth = await requireWorkspaceRole(req, ["admin", "supervisor"]);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user } = auth;
  const body = (await req.json().catch(() => ({}))) as DraftInput;
  const draft = buildDraft(body);

  const { data: inserted, error } = await db
    .from("wa_templates")
    .insert({
      workspace_id: workspaceId,
      name: draft.name,
      category: draft.category,
      language: draft.language,
      status: "draft",
      body: draft.body,
      buttons: [],
      meta_payload: {},
      meta_response: {},
    })
    .select("id, name, category, language, status, updated_at")
    .single();

  if (error) {
    return withCookies(NextResponse.json({ error: error.message }, { status: 500 }));
  }

  const { error: eventErr } = await db.from("wa_template_events").insert({
    workspace_id: workspaceId,
    template_id: inserted.id,
    event_type: "template.draft",
    payload: { name: draft.name },
    created_by: user?.id ?? "system",
  });
  if (eventErr) {
    console.log("wa_template_events insert failed (draft)", eventErr.message);
  }

  return withCookies(NextResponse.json({ template: inserted }));
}
