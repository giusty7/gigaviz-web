/**
 * PATCH /api/meta/whatsapp/contacts/[id]
 * Update contact
 * 
 * DELETE /api/meta/whatsapp/contacts/[id]
 * Delete contact
 */

import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import type { UpdateContactRequest } from "@/types/wa-contacts";
import { sanitizeTags } from "@/lib/meta/wa-contacts-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const body = (await request.json()) as UpdateContactRequest & {
      workspaceId: string;
    };

    if (!body.workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    // Verify workspace access & contact ownership
    const { data: contact } = await supabase
      .from("wa_contacts")
      .select("workspace_id")
      .eq("id", id)
      .single();

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    if (contact.workspace_id !== body.workspaceId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("workspace_id", body.workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      logger.error("[Contacts API PUT] Membership query error:", {
        error: membershipError,
        workspaceId: body.workspaceId,
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
        workspaceId: body.workspaceId,
        userId: user.id,
        contactId: id,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build update object
    const updates: Record<string, unknown> = {};

    if (body.display_name !== undefined) {
      updates.display_name = body.display_name;
    }

    if (body.tags !== undefined) {
      updates.tags = sanitizeTags(body.tags);
    }

    if (body.custom_fields !== undefined) {
      updates.custom_fields = body.custom_fields;
    }

    if (body.opt_in_status !== undefined) {
      updates.opt_in_status = body.opt_in_status;
      
      if (body.opt_in_status === "opted_in") {
        updates.opt_in_at = new Date().toISOString();
        updates.opt_out_at = null;
      } else if (body.opt_in_status === "opted_out") {
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
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

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
}
