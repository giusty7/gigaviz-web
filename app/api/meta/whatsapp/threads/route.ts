import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { forbiddenResponse, requireWorkspaceMember, unauthorizedResponse, workspaceRequiredResponse } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type ThreadRow = {
  id: string;
  phone_number_id: string | null;
  contact_wa_id: string | null;
  contact_name: string | null;
  status: string | null;
  unread_count: number | null;
  assigned_to: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
};

export async function GET(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const url = new URL(req.url);
  const paramsSchema = z.object({
    workspaceSlug: z.string().min(1),
  });

  const parsed = paramsSchema.safeParse({
    workspaceSlug: url.searchParams.get("workspaceSlug"),
  });

  const isDev = process.env.NODE_ENV !== "production";

  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        {
          error: "bad_request",
          reason: "invalid_workspace",
          ...(isDev ? { issues: parsed.error.flatten() } : {}),
        },
        { status: 400 }
      )
    );
  }

  const { workspaceSlug } = parsed.data;

  const db = supabaseAdmin();
  const { data: workspaceRow, error: workspaceError } = await db
    .from("workspaces")
    .select("id, slug")
    .eq("slug", workspaceSlug)
    .maybeSingle();

  if (workspaceError) {
    return withCookies(
      NextResponse.json(
        {
          error: "db_error",
          reason: "workspace_lookup_failed",
          ...(isDev ? { message: workspaceError.message } : {}),
        },
        { status: 500 }
      )
    );
  }

  if (!workspaceRow?.id) {
    return workspaceRequiredResponse(withCookies);
  }

  const workspaceId = workspaceRow.id;

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok) {
    return forbiddenResponse(withCookies);
  }

  const q = url.searchParams.get("q")?.trim() ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "all";
  const assigned = url.searchParams.get("assigned")?.trim() ?? "all";
  const unread = url.searchParams.get("unread")?.trim() ?? "all";
  const tag = url.searchParams.get("tag")?.trim() ?? "";

  // If tag filter is provided, join with wa_thread_tags for filtering
  // Using !inner join ensures only threads WITH that tag are returned
  let query;
  if (tag) {
    // Join with wa_thread_tags and filter by tag
    query = db
      .from("wa_threads")
      .select(
        `id, phone_number_id, contact_wa_id, contact_name, last_message_preview, last_message_at, status, unread_count, assigned_to,
        wa_thread_tags!inner(tag)`
      )
      .eq("workspace_id", workspaceId)
      .eq("wa_thread_tags.tag", tag);
  } else {
    query = db
      .from("wa_threads")
      .select(
        "id, phone_number_id, contact_wa_id, contact_name, last_message_preview, last_message_at, status, unread_count, assigned_to"
      )
      .eq("workspace_id", workspaceId);
  }

  if (q) {
    query = query.or(`contact_name.ilike.%${q}%,contact_wa_id.ilike.%${q}%`);
  }
  if (status !== "all") query = query.eq("status", status);
  if (assigned === "assigned") query = query.not("assigned_to", "is", null);
  if (assigned === "unassigned") query = query.is("assigned_to", null);
  if (unread === "true") query = query.gt("unread_count", 0);
  if (unread === "false") query = query.eq("unread_count", 0);

  const { data: rows, error } = await query
    .order("unread_count", { ascending: false })
    .order("last_message_at", { ascending: false });

  if (error) {
    return withCookies(
      NextResponse.json(
        { error: "db_error", reason: "thread_list_failed" },
        { status: 500 }
      )
    );
  }

  const threads =
    rows?.map((row) => {
      const raw = row as ThreadRow;
      return {
        id: raw.id,
        external_thread_id: raw.contact_wa_id,
        status: raw.status ?? "open",
        unread_count: raw.unread_count ?? 0,
        assigned_to: raw.assigned_to ?? null,
        last_message_at: raw.last_message_at,
        last_inbound_at: raw.last_message_at,
        last_message_preview: raw.last_message_preview ?? null,
        contact: raw.contact_wa_id
          ? { id: raw.contact_wa_id, display_name: raw.contact_name, phone: raw.contact_wa_id }
          : null,
      };
    }) ?? [];

  return withCookies(NextResponse.json({ threads }));
}
