/**
 * POST /api/meta/whatsapp/audience/preview
 * Preview audience count and sample contacts based on filters
 */

import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import type {
  AudiencePreviewRequest,
  AudiencePreviewResponse,
} from "@/types/wa-contacts";
import { withErrorHandler } from "@/lib/api/with-error-handler";

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

    const body = (await request.json()) as AudiencePreviewRequest & {
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
      logger.error("[Audience Preview API] Membership query error:", {
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
      logger.warn("[Audience Preview API] Access denied:", {
        workspaceId: body.workspaceId,
        userId: user.id,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let rules = body.rules || {};

    // If segmentId provided, fetch segment rules
    if (body.segmentId) {
      const { data: segment } = await supabase
        .from("wa_contact_segments")
        .select("rules")
        .eq("id", body.segmentId)
        .eq("workspace_id", body.workspaceId)
        .single();

      if (segment && segment.rules) {
        rules = segment.rules;
      }
    }

    // If tags provided, merge with rules
    if (body.tags && body.tags.length > 0) {
      rules.includeTags = [...(rules.includeTags || []), ...body.tags];
    }

    // Build query
    let query = supabase
      .from("wa_contacts")
      .select("*")
      .eq("workspace_id", body.workspaceId);

    // Apply rules
    if (rules.includeTags && rules.includeTags.length > 0) {
      query = query.overlaps("tags", rules.includeTags);
    }

    if (rules.excludeTags && rules.excludeTags.length > 0) {
      query = query.not("tags", "&&", rules.excludeTags);
    }

    if (rules.optInOnly) {
      query = query.eq("opt_in_status", "opted_in");
    }

    // Apply custom field filters
    if (rules.customFieldFilters && rules.customFieldFilters.length > 0) {
      for (const filter of rules.customFieldFilters) {
        if (filter.operator === "equals" && filter.value) {
          query = query.eq(`custom_fields->${filter.field}`, filter.value);
        } else if (filter.operator === "contains" && filter.value) {
          query = query.ilike(
            `custom_fields->${filter.field}`,
            `%${filter.value}%`
          );
        } else if (filter.operator === "exists") {
          query = query.not(`custom_fields->${filter.field}`, "is", null);
        }
      }
    }

    // Get total count
    const { count: totalCount } = await query;

    // Get sample (first 10)
    const { data: sample } = await query.limit(10);

    // Get opt-in status breakdown
    let optInQuery = supabase
      .from("wa_contacts")
      .select("opt_in_status")
      .eq("workspace_id", body.workspaceId);

    // Apply same filters for opt-in breakdown
    if (rules.includeTags && rules.includeTags.length > 0) {
      optInQuery = optInQuery.overlaps("tags", rules.includeTags);
    }

    if (rules.excludeTags && rules.excludeTags.length > 0) {
      optInQuery = optInQuery.not("tags", "&&", rules.excludeTags);
    }

    if (rules.customFieldFilters && rules.customFieldFilters.length > 0) {
      for (const filter of rules.customFieldFilters) {
        if (filter.operator === "equals" && filter.value) {
          optInQuery = optInQuery.eq(
            `custom_fields->${filter.field}`,
            filter.value
          );
        } else if (filter.operator === "contains" && filter.value) {
          optInQuery = optInQuery.ilike(
            `custom_fields->${filter.field}`,
            `%${filter.value}%`
          );
        } else if (filter.operator === "exists") {
          optInQuery = optInQuery.not(
            `custom_fields->${filter.field}`,
            "is",
            null
          );
        }
      }
    }

    const { data: optInData } = await optInQuery;

    const estimation = {
      opted_in: optInData?.filter((c: { opt_in_status: string }) => c.opt_in_status === "opted_in")
        .length || 0,
      opted_out: optInData?.filter((c: { opt_in_status: string }) => c.opt_in_status === "opted_out")
        .length || 0,
      unknown: optInData?.filter((c: { opt_in_status: string }) => c.opt_in_status === "unknown")
        .length || 0,
    };

    const response: AudiencePreviewResponse = {
      count: totalCount || 0,
      sample: sample || [],
      estimation,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error("[Audience Preview API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
