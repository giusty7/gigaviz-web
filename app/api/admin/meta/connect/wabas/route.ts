import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceRole } from "@/lib/supabase/workspace-role";
import { fetchGraph, getMetaAccessToken, normalizeGraphVersion } from "@/lib/meta/graph";
import { logMetaAdminAudit } from "@/lib/meta/audit";

export const runtime = "nodejs";

type WabaOwnerResponse = {
  owner_business?: { id?: string };
};

type WabaListResponse = {
  data?: Array<{
    id?: string;
    name?: string;
    account_review_status?: string;
  }>;
};

async function resolveBusinessId(token: string, version: string) {
  const envBusinessId = process.env.META_BUSINESS_ID || "";
  if (envBusinessId) return envBusinessId;

  const wabaId = process.env.WA_WABA_ID || "";
  if (!wabaId) return "";

  const url = `https://graph.facebook.com/${version}/${wabaId}?fields=owner_business`;
  const data = await fetchGraph<WabaOwnerResponse>(url, token);
  return data.owner_business?.id ?? "";
}

export async function GET(req: NextRequest) {
  const auth = await requireWorkspaceRole(req, ["admin", "supervisor"]);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user } = auth;
  const version = normalizeGraphVersion(process.env.WA_GRAPH_VERSION);

  try {
    const token = getMetaAccessToken();
    const businessId = await resolveBusinessId(token, version);
    if (!businessId) {
      throw new Error("Missing META_BUSINESS_ID or WA_WABA_ID owner_business");
    }

    const url = `https://graph.facebook.com/${version}/${businessId}/owned_whatsapp_business_accounts?fields=id,name,account_review_status&limit=50`;
    const data = await fetchGraph<WabaListResponse>(url, token);
    const items = (data.data ?? []).map((w) => ({
      id: w.id ?? "",
      name: w.name ?? "",
      account_review_status: w.account_review_status ?? null,
    }));

    await logMetaAdminAudit({
      db,
      workspaceId,
      userId: user?.id ?? null,
      action: "list_wabas",
      ok: true,
      detail: { business_id: businessId, count: items.length },
    });

    return withCookies(NextResponse.json({ ok: true, businessId, items }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Meta API error";
    await logMetaAdminAudit({
      db,
      workspaceId,
      userId: user?.id ?? null,
      action: "list_wabas",
      ok: false,
      error: message,
    });
    return withCookies(
      NextResponse.json({ ok: false, error: message }, { status: 500 })
    );
  }
}
