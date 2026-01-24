import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  forbiddenResponse,
  requireWorkspaceMember,
  requireWorkspaceRole,
  unauthorizedResponse,
} from "@/lib/auth/guard";
import { logger } from "@/lib/logging";

export const runtime = "nodejs";

const patchSchema = z.object({
  workspaceId: z.string().uuid(),
  displayName: z.string().min(1).max(100).optional(),
  notes: z.string().max(500).optional().nullable(),
});

type RouteContext = {
  params: Promise<{ phoneNumberId: string }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
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

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", reason: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { workspaceId, displayName, notes } = parsed.data;

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin"])) {
    return forbiddenResponse(withCookies);
  }

  const db = supabaseAdmin();

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
}
