import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

// ============================================================================
// TYPES
// ============================================================================

export interface QuickReply {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  shortcut: string | null;
  category: string;
  hasVariables: boolean;
  useCount: number;
  lastUsedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SCHEMAS
// ============================================================================

const createSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(4000),
  shortcut: z.string().max(50).optional().nullable(),
  category: z.string().max(50).default("general"),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100).optional(),
  content: z.string().min(1).max(4000).optional(),
  shortcut: z.string().max(50).optional().nullable(),
  category: z.string().max(50).optional(),
});

// ============================================================================
// HELPERS
// ============================================================================

function mapQuickReply(row: Record<string, unknown>): QuickReply {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    title: row.title as string,
    content: row.content as string,
    shortcut: row.shortcut as string | null,
    category: row.category as string,
    hasVariables: row.has_variables as boolean,
    useCount: row.use_count as number,
    lastUsedAt: row.last_used_at as string | null,
    createdBy: row.created_by as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function detectVariables(content: string): boolean {
  // Check for variable placeholders like {{contact_name}}, {{agent_name}}, etc.
  return /\{\{[a-z_]+\}\}/i.test(content);
}

// ============================================================================
// GET - List quick replies for workspace
// ============================================================================

export const GET = withErrorHandler(async (req: NextRequest) => {
  try {
    const ctx = await getAppContext();
    if (!ctx.user || !ctx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const db = await supabaseServer();
    let query = db
      .from("inbox_quick_replies")
      .select("*")
      .eq("workspace_id", ctx.currentWorkspace.id)
      .order("category")
      .order("use_count", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      logger.error("Failed to fetch quick replies", { error: error.message });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const quickReplies = (data || []).map(mapQuickReply);

    return NextResponse.json({ quickReplies });
  } catch (err) {
    logger.error("Quick replies GET error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// ============================================================================
// POST - Create quick reply
// ============================================================================

export const POST = withErrorHandler(async (req: NextRequest) => {
  try {
    const ctx = await getAppContext();
    if (!ctx.user || !ctx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = createSchema.parse(body);

    const db = await supabaseServer();

    // Check for duplicate shortcut
    if (validated.shortcut) {
      const { data: existing } = await db
        .from("inbox_quick_replies")
        .select("id")
        .eq("workspace_id", ctx.currentWorkspace.id)
        .eq("shortcut", validated.shortcut)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: `Shortcut "/${validated.shortcut}" already exists` },
          { status: 400 }
        );
      }
    }

    const { data, error } = await db
      .from("inbox_quick_replies")
      .insert({
        workspace_id: ctx.currentWorkspace.id,
        title: validated.title,
        content: validated.content,
        shortcut: validated.shortcut || null,
        category: validated.category,
        has_variables: detectVariables(validated.content),
        created_by: ctx.user.id,
      })
      .select()
      .single();

    if (error) {
      logger.error("Failed to create quick reply", { error: error.message });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    logger.info("Quick reply created", { 
      quickReplyId: data.id, 
      workspaceId: ctx.currentWorkspace.id 
    });

    return NextResponse.json({ quickReply: mapQuickReply(data) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    logger.error("Quick replies POST error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// ============================================================================
// PATCH - Update quick reply
// ============================================================================

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  try {
    const ctx = await getAppContext();
    if (!ctx.user || !ctx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = updateSchema.parse(body);

    const db = await supabaseServer();

    // Check ownership
    const { data: existing } = await db
      .from("inbox_quick_replies")
      .select("id")
      .eq("id", validated.id)
      .eq("workspace_id", ctx.currentWorkspace.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Quick reply not found" }, { status: 404 });
    }

    // Check for duplicate shortcut if updating
    if (validated.shortcut) {
      const { data: duplicate } = await db
        .from("inbox_quick_replies")
        .select("id")
        .eq("workspace_id", ctx.currentWorkspace.id)
        .eq("shortcut", validated.shortcut)
        .neq("id", validated.id)
        .maybeSingle();

      if (duplicate) {
        return NextResponse.json(
          { error: `Shortcut "/${validated.shortcut}" already exists` },
          { status: 400 }
        );
      }
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (validated.title !== undefined) updates.title = validated.title;
    if (validated.content !== undefined) {
      updates.content = validated.content;
      updates.has_variables = detectVariables(validated.content);
    }
    if (validated.shortcut !== undefined) updates.shortcut = validated.shortcut;
    if (validated.category !== undefined) updates.category = validated.category;

    const { data, error } = await db
      .from("inbox_quick_replies")
      .update(updates)
      .eq("id", validated.id)
      .select()
      .single();

    if (error) {
      logger.error("Failed to update quick reply", { error: error.message });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ quickReply: mapQuickReply(data) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    logger.error("Quick replies PATCH error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// ============================================================================
// DELETE - Delete quick reply
// ============================================================================

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  try {
    const ctx = await getAppContext();
    if (!ctx.user || !ctx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    const db = await supabaseServer();

    const { error } = await db
      .from("inbox_quick_replies")
      .delete()
      .eq("id", id)
      .eq("workspace_id", ctx.currentWorkspace.id);

    if (error) {
      logger.error("Failed to delete quick reply", { error: error.message });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Quick replies DELETE error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
