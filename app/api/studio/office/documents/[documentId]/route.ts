import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/lib/app-context";
import { canAccess, getPlanMeta } from "@/lib/entitlements";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  category: z.enum(["document", "spreadsheet", "presentation", "invoice", "report"]).optional(),
  content_json: z.unknown().optional(),
});

type RouteContext = {
  params: Promise<{ documentId: string }>;
};

async function requireOfficeAccess() {
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
    "office"
  );

  return hasAccess ? { ctx, db } : null;
}

export const GET = withErrorHandler(async (_req: NextRequest, routeCtx: RouteContext) => {
  const { documentId } = await routeCtx.params;
  const auth = await requireOfficeAccess();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const { data, error } = await db
    .from("office_documents")
    .select("*")
    .eq("id", documentId)
    .eq("workspace_id", ctx.currentWorkspace!.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
});

export const PATCH = withErrorHandler(async (req: NextRequest, routeCtx: RouteContext) => {
  const { documentId } = await routeCtx.params;
  const auth = await requireOfficeAccess();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const body = await req.json();
  const validated = updateSchema.parse(body);

  const { data, error } = await db
    .from("office_documents")
    .update({
      ...validated,
      last_edited_by: ctx.user!.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .eq("workspace_id", ctx.currentWorkspace!.id)
    .select("id, title, category, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found or update failed" }, { status: 404 });
  }

  logger.info("Document updated", { docId: data.id, workspace: ctx.currentWorkspace!.id });
  return NextResponse.json({ data });
});

export const DELETE = withErrorHandler(async (_req: NextRequest, routeCtx: RouteContext) => {
  const { documentId } = await routeCtx.params;
  const auth = await requireOfficeAccess();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const { error } = await db
    .from("office_documents")
    .delete()
    .eq("id", documentId)
    .eq("workspace_id", ctx.currentWorkspace!.id);

  if (error) {
    logger.error("Failed to delete document", { error, documentId });
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  logger.info("Document deleted", { docId: documentId, workspace: ctx.currentWorkspace!.id });
  return NextResponse.json({ success: true });
});
