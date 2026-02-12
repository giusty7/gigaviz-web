import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminWorkspace } from "@/lib/supabase/route";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const categoryItemSchema = z.object({
  id: z.string().uuid().optional(),
  key: z.string().trim().min(1, "Key is required").max(100),
  label: z.string().trim().min(1, "Label is required").max(200),
});

const categoriesBodySchema = z.union([
  z.object({
    delete_ids: z.array(z.string().uuid()).min(1, "At least one ID required"),
    workspace_id: z.string().uuid().optional(),
  }),
  z.object({
    category: categoryItemSchema.optional(),
    categories: z.array(categoryItemSchema).optional(),
    workspace_id: z.string().uuid().optional(),
  }).refine(
    (d) => d.category || (d.categories && d.categories.length > 0),
    { message: "Provide 'category' or 'categories'" }
  ),
]);

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

export const GET = withErrorHandler(async (req: NextRequest) => {
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
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const raw = await req.json();
  const body = categoriesBodySchema.parse(raw);

  const requestedWorkspace = body.workspace_id ?? workspaceId;
  if (requestedWorkspace !== workspaceId) {
    return withCookies(
      NextResponse.json({ error: "workspace_mismatch" }, { status: 403 })
    );
  }

  if ("delete_ids" in body && Array.isArray(body.delete_ids)) {
    const deleteIds = body.delete_ids;

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

  const upsertBody = body as {
    category?: { id?: string; key: string; label: string };
    categories?: { id?: string; key: string; label: string }[];
    workspace_id?: string;
  };

  const list = upsertBody.categories ?? (upsertBody.category ? [upsertBody.category] : []);

  if (list.length === 0) {
    return withCookies(NextResponse.json({ error: "no_categories" }, { status: 400 }));
  }

  const payload = list.map((item: { id?: string; key: string; label: string }) => normalizeCategory(item, workspaceId))
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
});
