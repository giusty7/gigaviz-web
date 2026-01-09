import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { supabaseAdmin } from "@/lib/supabase/admin";

const DEV = process.env.NODE_ENV === "development";

type RequireUserResult =
  | {
      ok: true;
      supabase: ReturnType<typeof createSupabaseRouteClient>["supabase"];
      withCookies: ReturnType<typeof createSupabaseRouteClient>["withCookies"];
      user: NonNullable<Awaited<ReturnType<ReturnType<typeof createSupabaseRouteClient>["supabase"]["auth"]["getUser"]>>["data"]["user"]>;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export function unauthorizedResponse(withCookies: (res: NextResponse) => NextResponse) {
  return withCookies(
    NextResponse.json({ error: "unauthorized", reason: "auth_required" }, { status: 401 })
  );
}

export function workspaceRequiredResponse(withCookies: (res: NextResponse) => NextResponse) {
  return withCookies(
    NextResponse.json({ error: "bad_request", reason: "workspace_required" }, { status: 400 })
  );
}

export function forbiddenResponse(withCookies: (res: NextResponse) => NextResponse) {
  return withCookies(
    NextResponse.json({ error: "forbidden", reason: "workspace_access_denied" }, { status: 403 })
  );
}

export async function requireUser(req: NextRequest): Promise<RequireUserResult> {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { ok: false, response: unauthorizedResponse(withCookies) };
  }
  return { ok: true, supabase, withCookies, user: data.user };
}

export function getWorkspaceId(
  req: NextRequest,
  params?: Record<string, string | undefined>,
  bodyWorkspaceId?: unknown
) {
  const paramId =
    params?.workspaceId ||
    params?.workspace_id ||
    params?.workspaceSlug || // some routes might still use slug; treat as id string
    undefined;
  const headerId = req.headers.get("x-workspace-id")?.trim() || undefined;
  let bodyId: string | undefined;
  if (typeof bodyWorkspaceId === "string") {
    bodyId = bodyWorkspaceId;
    if (DEV) {
      console.warn("[guard] workspaceId supplied from body (discouraged)");
    }
  }
  return paramId || headerId || bodyId;
}

export async function requireWorkspaceMember(userId: string, workspaceId: string) {
  const adminDb = supabaseAdmin();
  const { data, error } = await adminDb
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return { ok: false as const };
  return { ok: true as const, role: data.role as string | null };
}

export function requireWorkspaceRole(role: string | null | undefined, allowedRoles: string[]) {
  return allowedRoles.includes(role ?? "");
}

export async function guardWorkspace(req: NextRequest, params?: Record<string, string | undefined>) {
  const userRes = await requireUser(req);
  if (!userRes.ok) return userRes;
  const { supabase, withCookies, user } = userRes;

  const body = await req.json().catch(() => null);
  const workspaceId = getWorkspaceId(req, params, body?.workspaceId ?? body?.workspace_id);
  if (!workspaceId) {
    return { ok: false as const, response: workspaceRequiredResponse(withCookies) };
  }

  const membership = await requireWorkspaceMember(user.id, workspaceId);
  if (!membership.ok) {
    return { ok: false as const, response: forbiddenResponse(withCookies) };
  }

  return {
    ok: true as const,
    supabase,
    withCookies,
    user,
    workspaceId,
    role: membership.role ?? null,
    body,
  };
}
