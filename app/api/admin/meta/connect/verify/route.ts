import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceRole } from "@/lib/supabase/workspace-role";
import { fetchGraph, getMetaAccessToken, normalizeGraphVersion } from "@/lib/meta/graph";
import { logMetaAdminAudit } from "@/lib/meta/audit";

export const runtime = "nodejs";

type WabaOwnerResponse = {
  owner_business?: { id?: string };
};

type BusinessInfo = {
  id?: string;
  name?: string;
  verification_status?: string;
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

export async function POST(req: NextRequest) {
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

    const url = `https://graph.facebook.com/${version}/${businessId}?fields=name,verification_status`;
    const data = await fetchGraph<BusinessInfo>(url, token);

    await logMetaAdminAudit({
      db,
      workspaceId,
      userId: user?.id ?? null,
      action: "verify_config",
      ok: true,
      detail: { business_id: businessId, name: data.name ?? null, verification_status: data.verification_status ?? null },
    });

    return withCookies(
      NextResponse.json({
        ok: true,
        business: {
          id: businessId,
          name: data.name ?? null,
          verification_status: data.verification_status ?? null,
        },
      })
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Meta API error";
    await logMetaAdminAudit({
      db,
      workspaceId,
      userId: user?.id ?? null,
      action: "verify_config",
      ok: false,
      error: message,
    });
    return withCookies(
      NextResponse.json({ ok: false, error: message }, { status: 500 })
    );
  }
}
