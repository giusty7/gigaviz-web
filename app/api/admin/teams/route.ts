import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrSupervisorWorkspace } from "@/lib/supabase/route";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireAdminOrSupervisorWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;

  const { data, error } = await db
    .from("teams")
    .select("id, name, is_default")
    .eq("workspace_id", workspaceId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    return withCookies(
      NextResponse.json({ error: error.message }, { status: 500 })
    );
  }

  return withCookies(NextResponse.json({ teams: data ?? [] }));
});
