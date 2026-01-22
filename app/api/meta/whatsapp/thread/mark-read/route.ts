import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { forbiddenResponse, requireWorkspaceMember, unauthorizedResponse, workspaceRequiredResponse } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const body = await req.json().catch(() => ({}));
  const bodySchema = z.object({
    threadId: z.string().uuid(),
    workspaceSlug: z.string().min(1),
  });

  const isDev = process.env.NODE_ENV !== "production";

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        {
          error: "bad_request",
          reason: "invalid_payload",
          ...(isDev ? { issues: parsed.error.flatten() } : {}),
        },
        { status: 400 }
      )
    );
  }

  const { threadId, workspaceSlug } = parsed.data;

  const db = supabaseAdmin();
  const { data: workspaceRow, error: workspaceError } = await db
    .from("workspaces")
    .select("id")
    .eq("slug", workspaceSlug)
    .maybeSingle();

  if (workspaceError || !workspaceRow?.id) {
    return workspaceRequiredResponse(withCookies);
  }

  const workspaceId = workspaceRow.id;

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok) {
    return forbiddenResponse(withCookies);
  }

  await db
    .from("wa_threads")
    .update({ unread_count: 0, updated_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("id", threadId);

  return withCookies(NextResponse.json({ ok: true }));
}
