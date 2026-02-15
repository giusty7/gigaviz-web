import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace } from "@/lib/auth/guard";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ pageId: string }> };

const updatePageSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/)
    .optional(),
  bio: z.string().max(300).nullish(),
  avatar_url: z.string().url().nullish(),
  seo_title: z.string().max(120).nullish(),
  seo_description: z.string().max(300).nullish(),
  published: z.boolean().optional(),
  theme: z
    .object({
      bg: z.string().optional(),
      text: z.string().optional(),
      accent: z.string().optional(),
      buttonStyle: z.enum(["filled", "outline", "soft"]).optional(),
      radius: z.enum(["none", "sm", "md", "lg", "full"]).optional(),
    })
    .optional(),
});

/** GET — fetch single page with items */
export const GET = withErrorHandler(async (req: NextRequest, ctx?: RouteCtx) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;
  const { pageId } = await ctx!.params;

  const { data, error } = await db
    .from("link_pages")
    .select("*, link_items(*)")
    .eq("id", pageId)
    .eq("workspace_id", workspaceId)
    .order("sort_order", { referencedTable: "link_items", ascending: true })
    .single();

  if (error || !data) {
    return withCookies(NextResponse.json({ ok: false, error: "not_found" }, { status: 404 }));
  }

  return withCookies(NextResponse.json({ ok: true, page: data }));
});

/** PATCH — update page metadata */
export const PATCH = withErrorHandler(async (req: NextRequest, ctx?: RouteCtx) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;
  const { pageId } = await ctx!.params;

  const body = await req.json().catch(() => ({}));
  const parsed = updatePageSchema.safeParse(body);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json({ ok: false, error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 })
    );
  }

  // If slug changed, check uniqueness
  if (parsed.data.slug) {
    const { data: existing } = await db
      .from("link_pages")
      .select("id")
      .eq("slug", parsed.data.slug)
      .neq("id", pageId)
      .maybeSingle();

    if (existing) {
      return withCookies(
        NextResponse.json({ ok: false, error: "slug_taken" }, { status: 409 })
      );
    }
  }

  const { data, error } = await db
    .from("link_pages")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", pageId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error || !data) {
    logger.error("links/pages PATCH error", { error: error?.message, pageId, workspaceId });
    return withCookies(NextResponse.json({ ok: false, error: error?.message ?? "not_found" }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ ok: true, page: data }));
});

/** DELETE — remove page and cascade items/clicks */
export const DELETE = withErrorHandler(async (req: NextRequest, ctx?: RouteCtx) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;
  const { pageId } = await ctx!.params;

  const { error } = await db
    .from("link_pages")
    .delete()
    .eq("id", pageId)
    .eq("workspace_id", workspaceId);

  if (error) {
    logger.error("links/pages DELETE error", { error: error.message, pageId, workspaceId });
    return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ ok: true }));
});
