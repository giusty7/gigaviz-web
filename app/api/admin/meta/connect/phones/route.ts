import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceRole } from "@/lib/supabase/workspace-role";
import { fetchGraph, getMetaAccessToken, normalizeGraphVersion } from "@/lib/meta/graph";
import { logMetaAdminAudit } from "@/lib/meta/audit";

export const runtime = "nodejs";

type PhoneListResponse = {
  data?: Array<{
    id?: string;
    display_phone_number?: string;
    verified_name?: string;
    code_verification_status?: string;
  }>;
};

export async function GET(req: NextRequest) {
  const auth = await requireWorkspaceRole(req, ["admin", "supervisor"]);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user } = auth;
  const version = normalizeGraphVersion(process.env.WA_GRAPH_VERSION);
  const { searchParams } = req.nextUrl;
  const wabaId = searchParams.get("waba_id") || process.env.WA_WABA_ID || "";

  if (!wabaId) {
    return withCookies(
      NextResponse.json({ ok: false, error: "missing_waba_id" }, { status: 400 })
    );
  }

  try {
    const token = getMetaAccessToken();
    const url = `https://graph.facebook.com/${version}/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name,code_verification_status&limit=50`;
    const data = await fetchGraph<PhoneListResponse>(url, token);
    const items = (data.data ?? []).map((p) => ({
      id: p.id ?? "",
      display_phone_number: p.display_phone_number ?? "",
      verified_name: p.verified_name ?? "",
      code_verification_status: p.code_verification_status ?? null,
    }));

    await logMetaAdminAudit({
      db,
      workspaceId,
      userId: user?.id ?? null,
      action: "list_phone_numbers",
      ok: true,
      detail: { waba_id: wabaId, count: items.length },
    });

    return withCookies(NextResponse.json({ ok: true, items }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Meta API error";
    await logMetaAdminAudit({
      db,
      workspaceId,
      userId: user?.id ?? null,
      action: "list_phone_numbers",
      ok: false,
      error: message,
    });
    return withCookies(
      NextResponse.json({ ok: false, error: message }, { status: 500 })
    );
  }
}
