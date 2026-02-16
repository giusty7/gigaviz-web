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
  chart_type: z.enum(["bar", "line", "pie", "area", "scatter", "radar", "heatmap"]),
  config_json: z.unknown().optional(),
  data_source: z.enum(["manual", "api", "database", "csv"]).optional(),
  data_json: z.unknown().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

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
    { plan_id: plan.plan_id, is_admin: Boolean(ctx.profile?.is_admin), effectiveEntitlements: ents },
    "graph"
  );

  return hasAccess ? { ctx, db } : null;
}

export const GET = withErrorHandler(async () => {
  const auth = await requireGraphAccess();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const { data, error } = await db
    .from("graph_charts")
    .select("id, title, chart_type, tags, data_source, updated_at")
    .eq("workspace_id", ctx.currentWorkspace!.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    logger.error("Failed to fetch charts", { error, workspace: ctx.currentWorkspace!.id });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ data });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireGraphAccess();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const body = await req.json();
  const validated = createSchema.parse(body);

  const { data, error } = await db
    .from("graph_charts")
    .insert({
      workspace_id: ctx.currentWorkspace!.id,
      title: validated.title,
      description: validated.description ?? null,
      chart_type: validated.chart_type,
      config_json: validated.config_json ?? null,
      data_source: validated.data_source ?? "manual",
      data_json: validated.data_json ?? null,
      tags: validated.tags ?? [],
      created_by: ctx.user!.id,
    })
    .select("id, title, chart_type, created_at")
    .single();

  if (error) {
    logger.error("Failed to create chart", { error, workspace: ctx.currentWorkspace!.id });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  logger.info("Chart created", { chartId: data.id, workspace: ctx.currentWorkspace!.id });
  return NextResponse.json({ data }, { status: 201 });
});
