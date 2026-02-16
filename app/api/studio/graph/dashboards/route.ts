import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/lib/app-context";
import { canAccess, getPlanMeta } from "@/lib/entitlements";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const createSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  is_public: z.boolean().optional(),
});

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

async function requireGraphAccess() {
  const ctx = await getAppContext();
  if (!ctx.user || !ctx.currentWorkspace) return null;

  const db = await supabaseServer();
  const { data: sub } = await db
    .from("subscriptions")
    .select("plan_id")
    .eq("workspace_id", ctx.currentWorkspace.id)
    .maybeSingle();

  const plan = getPlanMeta(sub?.plan_id || "free_locked");
  const ents = ctx.effectiveEntitlements ?? [];
  const hasAccess = canAccess(
    {
      plan_id: plan.plan_id,
      is_admin: Boolean(ctx.profile?.is_admin),
      effectiveEntitlements: ents,
    },
    "graph"
  );

  return hasAccess ? { ctx, db } : null;
}

export const GET = withErrorHandler(async () => {
  const auth = await requireGraphAccess();
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const { data, error } = await db
    .from("graph_dashboards")
    .select("id, title, slug, description, is_public, updated_at")
    .eq("workspace_id", ctx.currentWorkspace!.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    logger.error("Failed to fetch dashboards", {
      error,
      workspace: ctx.currentWorkspace!.id,
    });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ data });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireGraphAccess();
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const body = await req.json();
  const validated = createSchema.parse(body);

  const { data, error } = await db
    .from("graph_dashboards")
    .insert({
      workspace_id: ctx.currentWorkspace!.id,
      title: validated.title,
      slug: slugify(validated.title),
      description: validated.description ?? null,
      is_public: validated.is_public ?? false,
      created_by: ctx.user!.id,
    })
    .select("id, title, slug, created_at")
    .single();

  if (error) {
    logger.error("Failed to create dashboard", {
      error,
      workspace: ctx.currentWorkspace!.id,
    });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  logger.info("Dashboard created", {
    dashboardId: data.id,
    workspace: ctx.currentWorkspace!.id,
  });
  return NextResponse.json({ data }, { status: 201 });
});
