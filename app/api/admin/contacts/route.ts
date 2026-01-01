import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.reason }, { status: 401 });

  const workspaceId = process.env.DEFAULT_WORKSPACE_ID!;
  const sb = supabaseAdmin();

  const { data, error } = await sb
    .from("contacts")
    .select("id, name, phone, tags, last_seen_at")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}
