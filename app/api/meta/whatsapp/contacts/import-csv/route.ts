/**
 * POST /api/meta/whatsapp/contacts/import-csv
 * Import contacts from CSV file
 */

import { logger } from "@/lib/logging";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import type { CSVImportResponse } from "@/types/wa-contacts";
import {
  sanitizeTags,
  parseCSV,
  extractPhoneFromRow,
  validatePhone,
} from "@/lib/meta/wa-contacts-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const csvImportSchema = z.object({
  workspaceId: z.string().uuid("workspaceId required"),
  csvData: z.string().min(1, "csvData required").max(5_000_000),
  mapping: z.object({
    phoneColumn: z.string().min(1, "phoneColumn mapping required"),
    nameColumn: z.string().optional(),
    customFieldMappings: z.array(z.object({
      csvColumn: z.string(),
      fieldName: z.string(),
    })).optional(),
    tagColumns: z.array(z.string()).optional(),
  }),
  tags: z.array(z.string()).optional(),
  source: z.string().max(100).optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
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

    const rawBody = await request.json();
    const body = csvImportSchema.parse(rawBody);

    // Verify workspace access
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("workspace_id", body.workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      logger.error("[CSV Import API] Membership query error:", {
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
      logger.warn("[CSV Import API] Access denied:", {
        workspaceId: body.workspaceId,
        userId: user.id,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tags = body.tags ? sanitizeTags(body.tags) : [];
    const rows = parseCSV(body.csvData);

    const response: CSVImportResponse = {
      valid: 0,
      invalid: 0,
      duplicates: 0,
      created: [],
      errors: [],
    };

    // Get existing contacts with wa_id
    const validatedPhones = rows
      .map((row, idx) => ({
        idx,
        phone: extractPhoneFromRow(row, body.mapping.phoneColumn),
      }))
      .filter((item) => item.phone !== null)
      .map((item) => {
        const validation = validatePhone(item.phone!);
        return validation.valid ? validation.wa_id! : null;
      })
      .filter((wa_id) => wa_id !== null) as string[];

    const { data: existingContacts } = await supabase
      .from("wa_contacts")
      .select("wa_id")
      .eq("workspace_id", body.workspaceId)
      .in("wa_id", validatedPhones);

    const existingSet = new Set(
      existingContacts?.map((c: { wa_id: string }) => c.wa_id) || []
    );

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +1 for 0-index, +1 for header row

      const phoneStr = extractPhoneFromRow(row, body.mapping.phoneColumn);

      if (!phoneStr) {
        response.invalid++;
        response.errors.push({
          row: rowNumber,
          error: "Invalid or missing phone number",
        });
        continue;
      }

      // Validate and get wa_id
      const validation = validatePhone(phoneStr);
      if (!validation.valid) {
        response.invalid++;
        response.errors.push({
          row: rowNumber,
          error: validation.error || "Invalid phone format",
        });
        continue;
      }

      const phone = validation.normalized!;
      const wa_id = validation.wa_id!;

      // Check duplicate
      if (existingSet.has(wa_id)) {
        response.duplicates++;
        continue;
      }

      // Extract other fields
      const display_name = body.mapping.nameColumn
        ? row[body.mapping.nameColumn] || null
        : null;

      // Extract custom fields
      const custom_fields: Record<string, unknown> = {};
      if (body.mapping.customFieldMappings) {
        for (const mapping of body.mapping.customFieldMappings) {
          const value = row[mapping.csvColumn];
          if (value) {
            custom_fields[mapping.fieldName] = value;
          }
        }
      }

      // Extract tags from columns
      const rowTags = [...tags];
      if (body.mapping.tagColumns) {
        for (const tagCol of body.mapping.tagColumns) {
          const tagValue = row[tagCol];
          if (tagValue && tagValue.trim().length > 0) {
            rowTags.push(tagValue.trim().toLowerCase());
          }
        }
      }

      const sanitizedTags = sanitizeTags(rowTags);

      // Insert
      const { data: contact, error } = await supabase
        .from("wa_contacts")
        .insert({
          workspace_id: body.workspaceId,
          wa_id,
          normalized_phone: phone,
          display_name,
          tags: sanitizedTags,
          custom_fields,
          opt_in_status: "unknown",
          source: body.source || "csv_import",
        })
        .select("id")
        .single();

      if (error) {
        // Likely race condition duplicate
        if (error.code === "23505") {
          response.duplicates++;
        } else {
          response.errors.push({
            row: rowNumber,
            error: error.message,
          });
        }
      } else {
        response.valid++;
        response.created.push(contact.id);
        existingSet.add(wa_id); // Prevent duplicates within same batch
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    logger.error("[CSV Import API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
