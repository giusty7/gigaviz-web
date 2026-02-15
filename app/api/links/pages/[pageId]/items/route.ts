import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace } from "@/lib/auth/guard";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ pageId: string }> };

const createItemSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url().nullish(),
  link_type: z.enum(["url", "whatsapp", "product", "heading", "social"]).default("url"),
  icon: z.string().max(50).nullish(),
  thumbnail_url: z.string().url().nullish(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  sort_order: z.number().int().min(0).optional(),
  visible: z.boolean().default(true),
});

const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string().uuid(), sort_order: z.number().int().min(0) })),
});

/** GET — list items for a page */
export const GET = withErrorHandler(async (req: NextRequest, ctx?: RouteCtx) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;
  const { pageId } = await ctx!.params;

  const { data, error } = await db
    .from("link_items")
    .select("*")
    .eq("page_id", pageId)
    .eq("workspace_id", workspaceId)
    .order("sort_order", { ascending: true });

  if (error) {
    logger.error("links/items GET error", { error: error.message, pageId, workspaceId });
    return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ ok: true, items: data ?? [] }));
});

/** POST — add item to page */
export const POST = withErrorHandler(async (req: NextRequest, ctx?: RouteCtx) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;
  const { pageId } = await ctx!.params;

  const body = await req.json().catch(() => ({}));
  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json({ ok: false, error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 })
    );
  }

  // Get next sort_order if not provided
  let sortOrder = parsed.data.sort_order;
  if (sortOrder === undefined) {
    const { data: last } = await db
      .from("link_items")
      .select("sort_order")
      .eq("page_id", pageId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    sortOrder = (last?.sort_order ?? -1) + 1;
  }

  const { data, error } = await db
    .from("link_items")
    .insert({
      page_id: pageId,
      workspace_id: workspaceId,
      title: parsed.data.title,
      url: parsed.data.url ?? null,
      link_type: parsed.data.link_type,
      icon: parsed.data.icon ?? null,
      thumbnail_url: parsed.data.thumbnail_url ?? null,
      metadata: parsed.data.metadata,
      sort_order: sortOrder,
      visible: parsed.data.visible,
    })
    .select()
    .single();

  if (error) {
    logger.error("links/items POST error", { error: error.message, pageId, workspaceId });
    return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ ok: true, item: data }, { status: 201 }));
});

/** PATCH — reorder items (batch update sort_order) */
export const PATCH = withErrorHandler(async (req: NextRequest, ctx?: RouteCtx) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;
  const { pageId } = await ctx!.params;

  const body = await req.json().catch(() => ({}));
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json({ ok: false, error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 })
    );
  }

  // Update each item's sort_order
  const updates = parsed.data.items.map((item) =>
    db
      .from("link_items")
      .update({ sort_order: item.sort_order, updated_at: new Date().toISOString() })
      .eq("id", item.id)
      .eq("page_id", pageId)
      .eq("workspace_id", workspaceId)
  );

  const results = await Promise.all(updates);
  const failed = results.filter((r) => r.error);
  if (failed.length > 0) {
    logger.error("links/items PATCH reorder error", { errors: failed.map((f) => f.error?.message), pageId });
  }

  return withCookies(NextResponse.json({ ok: true, updated: parsed.data.items.length - failed.length }));
});
