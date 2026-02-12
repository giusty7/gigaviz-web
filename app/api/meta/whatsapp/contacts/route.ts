/**
 * GET /api/meta/whatsapp/contacts
 * List contacts with filters
 * 
 * POST /api/meta/whatsapp/contacts
 * Create a new contact
 */

import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import type {
  ContactsListResponse,
  WaContact,
} from "@/types/wa-contacts";
import {
  validatePhone,
  sanitizeTags,
} from "@/lib/meta/wa-contacts-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const getQuerySchema = z.object({
  workspaceId: z.string().uuid(),
  search: z.string().max(200).optional().default(""),
  tag: z.string().max(100).optional().default(""),
  segmentId: z.string().uuid().optional(),
  optInStatus: z.enum(["opted_in", "opted_out", "unknown", ""]).optional().default(""),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

const createContactSchema = z.object({
  workspaceId: z.string().uuid(),
  phone: z.string().min(1).max(20),
  display_name: z.string().max(200).optional(),
  tags: z.array(z.string().max(50)).max(50).optional(),
  custom_fields: z.record(z.string(), z.unknown()).optional().default({}),
  opt_in_status: z.enum(["opted_in", "opted_out", "unknown"]).optional().default("unknown"),
  source: z.string().max(50).optional().default("manual"),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
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

    // Parse and validate query params
    const searchParams = request.nextUrl.searchParams;
    const queryParsed = getQuerySchema.safeParse({
      workspaceId: searchParams.get("workspaceId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      tag: searchParams.get("tag") ?? undefined,
      segmentId: searchParams.get("segmentId") ?? undefined,
      optInStatus: searchParams.get("optInStatus") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!queryParsed.success) {
      return NextResponse.json(
        { error: queryParsed.error.issues[0]?.message ?? "invalid_query" },
        { status: 400 }
      );
    }

    const { workspaceId, search, tag, segmentId, optInStatus, page, limit } = queryParsed.data;

    // Verify workspace access
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      logger.error("[Contacts API GET] Membership query error:", {
        error: membershipError,
        workspaceId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: "Database error checking workspace access" },
        { status: 500 }
      );
    }

    if (!membership) {
      logger.warn("[Contacts API GET] Access denied:", {
        workspaceId,
        userId: user.id,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("wa_contacts")
      .select("*", { count: "exact" })
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(
        `display_name.ilike.%${search}%,normalized_phone.ilike.%${search}%`
      );
    }

    if (tag) {
      query = query.contains("tags", [tag]);
    }

    if (optInStatus) {
      query = query.eq("opt_in_status", optInStatus);
    }

    // Handle segment filtering
    if (segmentId) {
      const { data: segment } = await supabase
        .from("wa_contact_segments")
        .select("rules")
        .eq("id", segmentId)
        .eq("workspace_id", workspaceId)
        .single();

      if (segment && segment.rules) {
        const rules = segment.rules as {
          includeTags?: string[];
          excludeTags?: string[];
          optInOnly?: boolean;
        };

        if (rules.includeTags && rules.includeTags.length > 0) {
          query = query.overlaps("tags", rules.includeTags);
        }

        if (rules.excludeTags && rules.excludeTags.length > 0) {
          // Filter out contacts with excluded tags
          query = query.not("tags", "&&", rules.excludeTags);
        }

        if (rules.optInOnly) {
          query = query.eq("opt_in_status", "opted_in");
        }
      }
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: contacts, error, count } = await query;

    if (error) {
      logger.error("[Contacts API] Query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const response: ContactsListResponse = {
      contacts: contacts || [],
      total: count || 0,
      page,
      limit,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error("[Contacts API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

/**
 * POST - Create new contact
 */
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

    const body = await request.json().catch(() => null);
    const parsed = createContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "invalid_input" },
        { status: 400 }
      );
    }

    const workspaceId = parsed.data.workspaceId;

    // Verify workspace access
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      logger.error("[Contacts API POST] Membership query error:", {
        error: membershipError,
        workspaceId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: "Database error checking workspace access" },
        { status: 500 }
      );
    }

    if (!membership) {
      logger.warn("[Contacts API POST] Access denied:", {
        workspaceId,
        userId: user.id,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate phone
    const phoneValidation = validatePhone(parsed.data.phone);
    if (!phoneValidation.valid) {
      return NextResponse.json(
        { error: phoneValidation.error },
        { status: 400 }
      );
    }

    const normalized = phoneValidation.normalized!;
    const wa_id = phoneValidation.wa_id!;

    // Check for duplicate
    const { data: existing } = await supabase
      .from("wa_contacts")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("wa_id", wa_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Contact already exists" },
        { status: 409 }
      );
    }

    // Sanitize tags
    const tags = parsed.data.tags ? sanitizeTags(parsed.data.tags) : [];

    // Create contact
    const { data: contact, error } = await supabase
      .from("wa_contacts")
      .insert({
        workspace_id: workspaceId,
        wa_id,
        normalized_phone: normalized,
        display_name: parsed.data.display_name || null,
        tags,
        custom_fields: parsed.data.custom_fields,
        opt_in_status: parsed.data.opt_in_status,
        opt_in_at:
          parsed.data.opt_in_status === "opted_in" ? new Date().toISOString() : null,
        source: parsed.data.source,
      })
      .select()
      .single();

    if (error) {
      logger.error("[Contacts API] Create error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(contact as WaContact, { status: 201 });
  } catch (error) {
    logger.error("[Contacts API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
