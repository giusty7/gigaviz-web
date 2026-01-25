/**
 * POST /api/meta/whatsapp/contacts/bulk-paste
 * Import contacts from pasted text (one phone per line)
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import type { BulkPasteRequest, BulkPasteResponse } from "@/types/wa-contacts";
import {
  validatePhone,
  sanitizeTags,
  parseBulkPaste,
} from "@/lib/meta/wa-contacts-utils";

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as BulkPasteRequest & {
      workspaceId: string;
    };

    if (!body.workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    // Verify workspace access
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("workspace_id", body.workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      console.error("[Bulk Paste API] Membership query error:", {
        error: membershipError,
        workspaceId: body.workspaceId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: "Database error checking workspace access" },
        { status: 500 }
      );
    }

    if (!membership) {
      console.warn("[Bulk Paste API] Access denied:", {
        workspaceId: body.workspaceId,
        userId: user.id,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tags = body.tags ? sanitizeTags(body.tags) : [];
    const parsed = parseBulkPaste(body.lines.join("\n"));

    const response: BulkPasteResponse = {
      valid: 0,
      invalid: 0,
      duplicates: 0,
      created: [],
      errors: [],
    };

    // Get existing contacts
    const normalizedPhones = parsed
      .map((p) => validatePhone(p.phone))
      .filter((v) => v.valid)
      .map((v) => v.normalized!);

    const { data: existingContacts } = await supabase
      .from("wa_contacts")
      .select("normalized_phone")
      .eq("workspace_id", body.workspaceId)
      .in("normalized_phone", normalizedPhones);

    const existingSet = new Set(
      existingContacts?.map((c: { normalized_phone: string }) => c.normalized_phone) || []
    );

    // Process each line
    for (const item of parsed) {
      const validation = validatePhone(item.phone);

      if (!validation.valid) {
        response.invalid++;
        response.errors.push({
          line: item.line,
          error: validation.error || "Invalid phone",
        });
        continue;
      }

      const normalized = validation.normalized!;

      // Check duplicate
      if (existingSet.has(normalized)) {
        response.duplicates++;
        continue;
      }

      // Insert
      const { data: contact, error } = await supabase
        .from("wa_contacts")
        .insert({
          workspace_id: body.workspaceId,
          normalized_phone: normalized,
          display_name: item.name || null,
          tags,
          custom_fields: {},
          opt_in_status: "unknown",
          source: body.source || "bulk_paste",
        })
        .select("id")
        .single();

      if (error) {
        // Likely race condition duplicate
        if (error.code === "23505") {
          response.duplicates++;
        } else {
          response.errors.push({
            line: item.line,
            error: error.message,
          });
        }
      } else {
        response.valid++;
        response.created.push(contact.id);
        existingSet.add(normalized); // Prevent duplicates within same batch
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Bulk Paste API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
