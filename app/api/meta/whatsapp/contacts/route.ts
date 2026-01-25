/**
 * GET /api/meta/whatsapp/contacts
 * List contacts with filters
 * 
 * POST /api/meta/whatsapp/contacts
 * Create a new contact
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import type {
  ContactsListResponse,
  OptInStatus,
  CreateContactRequest,
  WaContact,
} from "@/types/wa-contacts";
import {
  validatePhone,
  sanitizeTags,
} from "@/lib/meta/wa-contacts-utils";

export async function GET(request: NextRequest) {
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

    // Get workspace from query or headers
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    // Verify workspace access
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      console.error("[Contacts API GET] Membership query error:", {
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
      console.warn("[Contacts API GET] Access denied:", {
        workspaceId,
        userId: user.id,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse filters
    const search = searchParams.get("search") || "";
    const tag = searchParams.get("tag") || "";
    const segmentId = searchParams.get("segmentId") || "";
    const optInStatus = searchParams.get("optInStatus") as OptInStatus | "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

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
      console.error("[Contacts API] Query error:", error);
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
    console.error("[Contacts API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new contact
 */
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

    const body = (await request.json()) as CreateContactRequest & {
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
      console.error("[Contacts API POST] Membership query error:", {
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
      console.warn("[Contacts API POST] Access denied:", {
        workspaceId: body.workspaceId,
        userId: user.id,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate phone
    const phoneValidation = validatePhone(body.phone);
    if (!phoneValidation.valid) {
      return NextResponse.json(
        { error: phoneValidation.error },
        { status: 400 }
      );
    }

    const normalized = phoneValidation.normalized!;

    // Check for duplicate
    const { data: existing } = await supabase
      .from("wa_contacts")
      .select("id")
      .eq("workspace_id", body.workspaceId)
      .eq("normalized_phone", normalized)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Contact already exists" },
        { status: 409 }
      );
    }

    // Sanitize tags
    const tags = body.tags ? sanitizeTags(body.tags) : [];

    // Create contact
    const { data: contact, error } = await supabase
      .from("wa_contacts")
      .insert({
        workspace_id: body.workspaceId,
        normalized_phone: normalized,
        display_name: body.display_name || null,
        tags,
        custom_fields: body.custom_fields || {},
        opt_in_status: body.opt_in_status || "unknown",
        opt_in_at:
          body.opt_in_status === "opted_in" ? new Date().toISOString() : null,
        source: body.source || "manual",
      })
      .select()
      .single();

    if (error) {
      console.error("[Contacts API] Create error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(contact as WaContact, { status: 201 });
  } catch (error) {
    console.error("[Contacts API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
