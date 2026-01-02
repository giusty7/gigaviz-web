import { NextRequest, NextResponse } from "next/server";
import { requireAdminWorkspace } from "@/lib/supabase/route";

type CategoryInput = {
  id?: unknown;
  workspace_id?: unknown;
  key?: unknown;
  label?: unknown;
};

function normalizeCategory(input: CategoryInput, workspaceId: string) {
  const key = typeof input.key === "string" ? input.key.trim() : "";
  const label = typeof input.label === "string" ? input.label.trim() : "";
  const id = typeof input.id === "string" ? input.id : undefined;

  if (!key || !label) return null;
  return {
    id,
    workspace_id: workspaceId,
    key,
    label,
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const workspaceParam = req.nextUrl.searchParams.get("workspace_id");

  if (workspaceParam && workspaceParam !== workspaceId) {
    return withCookies(
      NextResponse.json({ error: "workspace_mismatch" }, { status: 403 })
    );
  }

  const { data, error } = await db
    .from("routing_categories")
    .select("id, workspace_id, key, label, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) {
    return withCookies(NextResponse.json({ error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ categories: data ?? [] }));
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const body = (await req.json().catch(() => null)) as
    | {
        category?: CategoryInput;
        categories?: CategoryInput[];
        delete_ids?: unknown;
        workspace_id?: unknown;
      }
    | null;

  const requestedWorkspace =
    typeof body?.workspace_id === "string" ? body?.workspace_id : workspaceId;
  if (requestedWorkspace !== workspaceId) {
    return withCookies(
      NextResponse.json({ error: "workspace_mismatch" }, { status: 403 })
    );
  }

  if (Array.isArray(body?.delete_ids)) {
    const deleteIds = body?.delete_ids.filter(
      (id): id is string => typeof id === "string"
    );
    if (deleteIds.length === 0) {
      return withCookies(NextResponse.json({ error: "no_delete_ids" }, { status: 400 }));
    }

    const { error } = await db
      .from("routing_categories")
      .delete()
      .eq("workspace_id", workspaceId)
      .in("id", deleteIds);

    if (error) {
      return withCookies(NextResponse.json({ error: error.message }, { status: 500 }));
    }

    return withCookies(NextResponse.json({ deleted: deleteIds }));
  }

  const list = Array.isArray(body?.categories)
    ? body?.categories
    : body?.category
      ? [body.category]
      : [];

  if (list.length === 0) {
    return withCookies(NextResponse.json({ error: "no_categories" }, { status: 400 }));
  }

  const payload = list
    .map((item) => normalizeCategory(item, workspaceId))
    .filter(Boolean) as Array<{
    id?: string;
    workspace_id: string;
    key: string;
    label: string;
  }>;

  if (payload.length === 0) {
    return withCookies(NextResponse.json({ error: "invalid_categories" }, { status: 400 }));
  }

  const { data, error } = await db
    .from("routing_categories")
    .upsert(payload, { onConflict: "workspace_id,key" })
    .select("id, workspace_id, key, label, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return withCookies(NextResponse.json({ error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ categories: data ?? [] }));
}
