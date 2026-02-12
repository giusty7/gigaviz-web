import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  guardWorkspace,
  requireWorkspaceRole,
} from "@/lib/auth/guard";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

const patchSchema = z.object({
  workspaceId: z.string().uuid(),
  displayName: z.string().min(1).max(100).optional(),
  notes: z.string().max(500).optional().nullable(),
});

type RouteContext = {
  params: Promise<{ phoneNumberId: string }>;
};

export const PATCH = withErrorHandler(async (req: NextRequest, context: RouteContext) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, role, withCookies } = guard;

  if (!requireWorkspaceRole(role, ["owner", "admin"])) {
    return withCookies(NextResponse.json({ error: "forbidden" }, { status: 403 }));
  }

  const params = await context.params;
  const phoneNumberId = params.phoneNumberId;
  if (!phoneNumberId || phoneNumberId.length < 3) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", message: "Invalid phone_number_id" },
        { status: 400 }
      )
    );
  }

  const db = supabaseAdmin();

  // Validate body
  const parsed = patchSchema.safeParse(guard.body);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", reason: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { displayName, notes } = parsed.data;

  // Verify connection exists and belongs to workspace
  const { data: existing, error: findErr } = await db
    .from("wa_phone_numbers")
    .select("id, display_name")
    .eq("workspace_id", workspaceId)
    .eq("phone_number_id", phoneNumberId)
    .maybeSingle();

  if (findErr || !existing) {
    logger.warn("[meta-hub-connections-patch] connection not found", {
      phoneNumberId,
      workspaceId,
      message: findErr?.message,
    });
    return withCookies(
      NextResponse.json(
        { error: "not_found", message: "Connection not found" },
        { status: 404 }
      )
    );
  }

  // Build update payload
  const updatePayload: Record<string, unknown> = {};
  if (displayName !== undefined) {
    updatePayload.display_name = displayName;
  }
  if (notes !== undefined) {
    updatePayload.notes = notes;
  }

  if (Object.keys(updatePayload).length === 0) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", message: "No fields to update" },
        { status: 400 }
      )
    );
  }

  const { data: updated, error: updateErr } = await db
    .from("wa_phone_numbers")
    .update(updatePayload)
    .eq("id", existing.id)
    .select("id, phone_number_id, waba_id, display_name, notes, status")
    .single();

  if (updateErr || !updated) {
    logger.error("[meta-hub-connections-patch] update failed", {
      phoneNumberId,
      message: updateErr?.message,
    });
    return withCookies(
      NextResponse.json(
        { error: "update_failed", message: "Failed to update connection" },
        { status: 500 }
      )
    );
  }

  return withCookies(
    NextResponse.json({
      ok: true,
      connection: {
        id: updated.id,
        phoneNumberId: updated.phone_number_id,
        wabaId: updated.waba_id,
        displayName: updated.display_name,
        notes: updated.notes,
        status: updated.status,
      },
    })
  );
});
