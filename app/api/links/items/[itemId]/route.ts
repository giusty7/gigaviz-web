import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace } from "@/lib/auth/guard";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ itemId: string }> };

const updateItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  url: z.string().url().nullish(),
  link_type: z.enum(["url", "whatsapp", "product", "heading", "social"]).optional(),
  icon: z.string().max(50).nullish(),
  thumbnail_url: z.string().url().nullish(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  visible: z.boolean().optional(),
});

/** PATCH — update a single link item */
export const PATCH = withErrorHandler(async (req: NextRequest, ctx?: RouteCtx) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;
  const { itemId } = await ctx!.params;

  const body = await req.json().catch(() => ({}));
  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json({ ok: false, error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 })
    );
  }

  const { data, error } = await db
    .from("link_items")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error || !data) {
    logger.error("links/items PATCH error", { error: error?.message, itemId, workspaceId });
    return withCookies(NextResponse.json({ ok: false, error: error?.message ?? "not_found" }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ ok: true, item: data }));
});

/** DELETE — remove a single link item */
export const DELETE = withErrorHandler(async (req: NextRequest, ctx?: RouteCtx) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;
  const { itemId } = await ctx!.params;

  const { error } = await db
    .from("link_items")
    .delete()
    .eq("id", itemId)
    .eq("workspace_id", workspaceId);

  if (error) {
    logger.error("links/items DELETE error", { error: error.message, itemId, workspaceId });
    return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ ok: true }));
});
