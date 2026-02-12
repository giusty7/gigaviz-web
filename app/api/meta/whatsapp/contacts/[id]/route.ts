/**
 * PATCH /api/meta/whatsapp/contacts/[id]
 * Update contact
 * 
 * DELETE /api/meta/whatsapp/contacts/[id]
 * Delete contact
 */

import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { sanitizeTags } from "@/lib/meta/wa-contacts-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const updateContactSchema = z.object({
  workspaceId: z.string().uuid(),
  display_name: z.string().max(200).optional(),
  tags: z.array(z.string().max(50)).max(50).optional(),
  custom_fields: z.record(z.string(), z.unknown()).optional(),
  opt_in_status: z.enum(["opted_in", "opted_out", "unknown"]).optional(),
});

const deleteQuerySchema = z.object({
  workspaceId: z.string().uuid("Invalid workspaceId"),
});

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await supabaseServer();
    const { id } = await params;

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "invalid_input" },
        { status: 400 }
      );
    }

    const workspaceId = parsed.data.workspaceId;

    // Verify workspace access & contact ownership
    const { data: contact } = await supabase
      .from("wa_contacts")
      .select("workspace_id")
      .eq("id", id)
      .single();

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    if (contact.workspace_id !== workspaceId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      logger.error("[Contacts API PUT] Membership query error:", {
        error: membershipError,
        workspaceId,
        userId: user.id,
        contactId: id,
      });
      return NextResponse.json(
        { error: "Database error checking workspace access" },
        { status: 500 }
      );
    }

    if (!membership) {
      logger.warn("[Contacts API PUT] Access denied:", {
        workspaceId,
        userId: user.id,
        contactId: id,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build update object
    const updates: Record<string, unknown> = {};

    if (parsed.data.display_name !== undefined) {
      updates.display_name = parsed.data.display_name;
    }

    if (parsed.data.tags !== undefined) {
      updates.tags = sanitizeTags(parsed.data.tags);
    }

    if (parsed.data.custom_fields !== undefined) {
      updates.custom_fields = parsed.data.custom_fields;
    }

    if (parsed.data.opt_in_status !== undefined) {
      updates.opt_in_status = parsed.data.opt_in_status;
      
      if (parsed.data.opt_in_status === "opted_in") {
        updates.opt_in_at = new Date().toISOString();
        updates.opt_out_at = null;
      } else if (parsed.data.opt_in_status === "opted_out") {
        updates.opt_out_at = new Date().toISOString();
        updates.opt_in_at = null;
      }
    }

    // Update contact
    const { data: updated, error } = await supabase
      .from("wa_contacts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error("[Contacts API] Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    logger.error("[Contacts API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await supabaseServer();
    const { id } = await params;

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const parsed = deleteQuerySchema.safeParse({
      workspaceId: searchParams.get("workspaceId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "workspaceId required" },
        { status: 400 }
      );
    }

    const workspaceId = parsed.data.workspaceId;

    // Verify workspace access & contact ownership
    const { data: contact } = await supabase
      .from("wa_contacts")
      .select("workspace_id")
      .eq("id", id)
      .single();

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    if (contact.workspace_id !== workspaceId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      logger.error("[Contacts API DELETE] Membership query error:", {
        error: membershipError,
        workspaceId,
        userId: user.id,
        contactId: id,
      });
      return NextResponse.json(
        { error: "Database error checking workspace access" },
        { status: 500 }
      );
    }

    if (!membership) {
      logger.warn("[Contacts API DELETE] Access denied:", {
        workspaceId,
        userId: user.id,
        contactId: id,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete contact
    const { error } = await supabase.from("wa_contacts").delete().eq("id", id);

    if (error) {
      logger.error("[Contacts API] Delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("[Contacts API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
