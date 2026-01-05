import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceRole } from "@/lib/supabase/workspace-role";
import { fetchGraph, getMetaAccessToken, normalizeGraphVersion } from "@/lib/meta/graph";
import { logMetaAdminAudit } from "@/lib/meta/audit";

export const runtime = "nodejs";

type AppInfo = {
  id?: string;
  name?: string;
};

export async function POST(req: NextRequest) {
  const auth = await requireWorkspaceRole(req, ["admin", "supervisor"]);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user } = auth;
  const appId = process.env.META_APP_ID || "";
  if (!appId) {
    return withCookies(
      NextResponse.json({ ok: false, error: "META_APP_ID missing" }, { status: 400 })
    );
  }

  try {
    const token = getMetaAccessToken();
    const version = normalizeGraphVersion(process.env.WA_GRAPH_VERSION);
    const url = `https://graph.facebook.com/${version}/${appId}?fields=id,name`;
    const data = await fetchGraph<AppInfo>(url, token);

    await logMetaAdminAudit({
      db,
      workspaceId,
      userId: user?.id ?? null,
      action: "test_manage_app_solution",
      ok: true,
      detail: { app_id: appId, name: data.name ?? null },
    });

    return withCookies(NextResponse.json({ ok: true, app: data }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Meta API error";
    await logMetaAdminAudit({
      db,
      workspaceId,
      userId: user?.id ?? null,
      action: "test_manage_app_solution",
      ok: false,
      error: message,
    });
    return withCookies(
      NextResponse.json({ ok: false, error: message }, { status: 500 })
    );
  }
}
