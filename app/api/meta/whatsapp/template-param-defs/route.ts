import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import {
  forbiddenResponse,
  requireWorkspaceMember,
  requireWorkspaceRole,
  unauthorizedResponse,
} from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const schema = z.object({
  workspaceId: z.string().uuid(),
  templateId: z.string().uuid(),
  mappings: z.array(
    z.object({
      paramIndex: z.number().int().min(1),
      sourceType: z.enum(["manual", "contact_field", "expression"]),
      sourceValue: z.string().optional().default(""),
      defaultValue: z.string().optional().default(""),
    })
  ),
});

export const runtime = "nodejs";

/**
 * POST /api/meta/whatsapp/template-param-defs
 * Save parameter mapping definitions for a template
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", reason: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { workspaceId, templateId, mappings } = parsed.data;

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin"])) {
    return forbiddenResponse(withCookies);
  }

  const db = supabaseAdmin();

  // Verify template exists and belongs to workspace
  const { data: template, error: tplErr } = await db
    .from("wa_templates")
    .select("id, workspace_id")
    .eq("id", templateId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (tplErr || !template) {
    return withCookies(
      NextResponse.json({ error: "not_found", reason: "template_not_found" }, { status: 404 })
    );
  }

  // Delete existing mappings
  const { error: deleteErr } = await db
    .from("wa_template_param_defs")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("template_id", templateId);

  if (deleteErr) {
    logger.error("[wa-template-param-defs] delete failed", {
      workspaceId,
      templateId,
      message: deleteErr.message,
    });
    return withCookies(
      NextResponse.json(
        { error: "db_error", reason: "delete_failed" },
        { status: 500 }
      )
    );
  }

  // Insert new mappings
  if (mappings.length > 0) {
    const rows = mappings.map((m) => ({
      workspace_id: workspaceId,
      template_id: templateId,
      param_index: m.paramIndex,
      source_type: m.sourceType,
      source_value: m.sourceValue || null,
      default_value: m.defaultValue || null,
    }));

    const { error: insertErr } = await db.from("wa_template_param_defs").insert(rows);

    if (insertErr) {
      logger.error("[wa-template-param-defs] insert failed", {
        workspaceId,
        templateId,
        message: insertErr.message,
      });
      return withCookies(
        NextResponse.json(
          { error: "db_error", reason: "insert_failed" },
          { status: 500 }
        )
      );
    }
  }

  return withCookies(
    NextResponse.json({
      ok: true,
      saved: mappings.length,
    })
  );
});
