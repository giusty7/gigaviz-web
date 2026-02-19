import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { requireStudioAccess } from "@/lib/studio/require-access";

const cloneSchema = z.object({
  title: z.string().min(1).max(255).optional(),
});

export const POST = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ templateId: string }> }
  ) => {
    const auth = await requireStudioAccess("office");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ctx, db } = auth;
    const { templateId } = await params;
    const workspaceId = ctx.currentWorkspace!.id;

    // Fetch template (own workspace OR public templates)
    const { data: template, error: fetchErr } = await db
      .from("office_templates")
      .select("*")
      .eq("id", templateId)
      .or(`workspace_id.eq.${workspaceId},is_public.eq.true`)
      .single();

    if (fetchErr || !template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Parse optional title override
    const body = await req.json().catch(() => ({}));
    const validated = cloneSchema.parse(body);
    const title = validated.title || `${template.title} (Copy)`;

    // Create document from template
    const { data: doc, error: insertErr } = await db
      .from("office_documents")
      .insert({
        workspace_id: workspaceId,
        title,
        category: template.category,
        template_id: template.id,
        content_json: template.template_json,
        created_by: ctx.user!.id,
        last_edited_by: ctx.user!.id,
      })
      .select("id, title, category, created_at")
      .single();

    if (insertErr) {
      logger.error("Failed to clone template", { error: insertErr, templateId, workspace: workspaceId });
      return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
    }

    // Increment template usage count (best effort)
    try {
      const { error: rpcErr } = await db.rpc("increment_template_usage", { p_template_id: templateId });
      if (rpcErr) {
        // Fallback: raw update
        await db
          .from("office_templates")
          .update({ usage_count: (template.usage_count || 0) + 1 })
          .eq("id", templateId);
      }
    } catch {
      // Don't fail the clone if counter update fails
    }

    logger.info("Template cloned", { templateId, docId: doc.id, workspace: workspaceId });
    return NextResponse.json({ data: doc }, { status: 201 });
  }
);
