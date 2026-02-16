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
  steps_json: z.unknown().optional(),
  triggers_json: z.unknown().optional(),
  estimated_tokens_per_run: z.number().positive().optional(),
});

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

async function requireTracksAccess() {
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
    "tracks"
  );

  return hasAccess ? { ctx, db } : null;
}

export const GET = withErrorHandler(async () => {
  const auth = await requireTracksAccess();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const { data, error } = await db
    .from("tracks_workflows")
    .select("id, title, slug, status, runs_count, success_count, failure_count, updated_at")
    .eq("workspace_id", ctx.currentWorkspace!.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    logger.error("Failed to fetch workflows", { error, workspace: ctx.currentWorkspace!.id });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ data });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireTracksAccess();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const body = await req.json();
  const validated = createSchema.parse(body);

  const { data, error } = await db
    .from("tracks_workflows")
    .insert({
      workspace_id: ctx.currentWorkspace!.id,
      title: validated.title,
      slug: slugify(validated.title),
      description: validated.description ?? null,
      steps_json: validated.steps_json ?? null,
      triggers_json: validated.triggers_json ?? null,
      estimated_tokens_per_run: validated.estimated_tokens_per_run ?? null,
      status: "draft",
      created_by: ctx.user!.id,
    })
    .select("id, title, slug, status, created_at")
    .single();

  if (error) {
    logger.error("Failed to create workflow", { error, workspace: ctx.currentWorkspace!.id });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  logger.info("Workflow created", { workflowId: data.id, workspace: ctx.currentWorkspace!.id });
  return NextResponse.json({ data }, { status: 201 });
});
