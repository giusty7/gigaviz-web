import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace } from "@/lib/auth/guard";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

const createPageSchema = z.object({
  title: z.string().min(1).max(100),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Slug must be lowercase alphanumeric with hyphens"),
  bio: z.string().max(300).optional(),
  avatar_url: z.string().url().optional(),
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

/** GET  — list all link pages for workspace */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  const { data, error } = await db
    .from("link_pages")
    .select("*, link_items(count), link_clicks(count)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("links/pages GET error", { error: error.message, workspaceId });
    return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
  }

  const pages = (data ?? []).map((p: Record<string, unknown>) => ({
    ...p,
    items_count: Array.isArray(p.link_items) ? (p.link_items[0] as { count: number })?.count ?? 0 : 0,
    clicks_count: Array.isArray(p.link_clicks) ? (p.link_clicks[0] as { count: number })?.count ?? 0 : 0,
    link_items: undefined,
    link_clicks: undefined,
  }));

  return withCookies(NextResponse.json({ ok: true, pages }));
});

/** POST — create a new link page */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  const body = await req.json().catch(() => ({}));
  const parsed = createPageSchema.safeParse(body);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json({ ok: false, error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 })
    );
  }

  // Check slug uniqueness
  const { data: existing } = await db
    .from("link_pages")
    .select("id")
    .eq("slug", parsed.data.slug)
    .maybeSingle();

  if (existing) {
    return withCookies(
      NextResponse.json({ ok: false, error: "slug_taken", message: "This slug is already in use" }, { status: 409 })
    );
  }

  const { data, error } = await db
    .from("link_pages")
    .insert({
      workspace_id: workspaceId,
      title: parsed.data.title,
      slug: parsed.data.slug,
      bio: parsed.data.bio ?? null,
      avatar_url: parsed.data.avatar_url ?? null,
      ...(parsed.data.theme ? { theme: parsed.data.theme } : {}),
    })
    .select()
    .single();

  if (error) {
    logger.error("links/pages POST error", { error: error.message, workspaceId });
    return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ ok: true, page: data }, { status: 201 }));
});
