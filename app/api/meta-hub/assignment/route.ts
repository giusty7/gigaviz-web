import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

// ============================================================================
// TYPES
// ============================================================================

export type AssignmentStrategy = "round_robin" | "load_balance" | "manual";

export interface AssignmentRule {
  id: string;
  workspaceId: string;
  name: string;
  strategy: AssignmentStrategy;
  agentIds: string[];
  isActive: boolean;
  maxChatsPerAgent: number | null;
  priority: number;
  conditions: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SCHEMAS
// ============================================================================

const createSchema = z.object({
  name: z.string().min(1).max(100),
  strategy: z.enum(["round_robin", "load_balance", "manual"]),
  agentIds: z.array(z.string().uuid()).min(1),
  maxChatsPerAgent: z.number().int().positive().optional().nullable(),
  priority: z.number().int().default(0),
  conditions: z.record(z.string(), z.unknown()).optional().nullable(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  strategy: z.enum(["round_robin", "load_balance", "manual"]).optional(),
  agentIds: z.array(z.string().uuid()).min(1).optional(),
  isActive: z.boolean().optional(),
  maxChatsPerAgent: z.number().int().positive().optional().nullable(),
  priority: z.number().int().optional(),
  conditions: z.record(z.string(), z.unknown()).optional().nullable(),
});

const assignSchema = z.object({
  threadId: z.string().uuid(),
  agentId: z.string().uuid().optional(), // If not provided, use auto-assignment
  threadType: z.enum(["whatsapp", "instagram", "messenger"]).default("whatsapp"),
});

// ============================================================================
// HELPERS
// ============================================================================

function mapRule(row: Record<string, unknown>): AssignmentRule {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    name: row.name as string,
    strategy: row.strategy as AssignmentStrategy,
    agentIds: row.agent_ids as string[],
    isActive: row.is_active as boolean,
    maxChatsPerAgent: row.max_chats_per_agent as number | null,
    priority: row.priority as number,
    conditions: row.conditions as Record<string, unknown> | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ============================================================================
// GET - List assignment rules
// ============================================================================

export const GET = withErrorHandler(async () => {
  try {
    const ctx = await getAppContext();
    if (!ctx.user || !ctx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await supabaseServer();
    const { data, error } = await db
      .from("assignment_rules")
      .select("*")
      .eq("workspace_id", ctx.currentWorkspace.id)
      .order("priority", { ascending: false })
      .order("created_at");

    if (error) {
      logger.error("Failed to fetch assignment rules", { error: error.message });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ rules: (data || []).map(mapRule) });
  } catch (err) {
    logger.error("Assignment rules GET error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// ============================================================================
// POST - Create assignment rule OR assign thread
// ============================================================================

export const POST = withErrorHandler(async (req: NextRequest) => {
  try {
    const ctx = await getAppContext();
    if (!ctx.user || !ctx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Check if this is an assignment request
    if (body.threadId) {
      return handleAssignment(body, { 
        user: { id: ctx.user.id }, 
        currentWorkspace: { id: ctx.currentWorkspace.id } 
      });
    }

    // Otherwise create a rule
    const validated = createSchema.parse(body);

    const db = await supabaseServer();
    const { data, error } = await db
      .from("assignment_rules")
      .insert({
        workspace_id: ctx.currentWorkspace.id,
        name: validated.name,
        strategy: validated.strategy,
        agent_ids: validated.agentIds,
        max_chats_per_agent: validated.maxChatsPerAgent || null,
        priority: validated.priority,
        conditions: validated.conditions || null,
      })
      .select()
      .single();

    if (error) {
      logger.error("Failed to create assignment rule", { error: error.message });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    logger.info("Assignment rule created", { 
      ruleId: data.id, 
      workspaceId: ctx.currentWorkspace.id 
    });

    return NextResponse.json({ rule: mapRule(data) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    logger.error("Assignment rules POST error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// ============================================================================
// Handle thread assignment
// ============================================================================

async function handleAssignment(
  body: unknown,
  ctx: { user: { id: string }; currentWorkspace: { id: string } }
) {
  const validated = assignSchema.parse(body);
  const db = supabaseAdmin();
  
  // Determine thread table
  const tableMap = {
    whatsapp: "wa_threads",
    instagram: "ig_threads",
    messenger: "messenger_threads",
  };
  const tableName = tableMap[validated.threadType];

  let agentId = validated.agentId;

  // If no agent specified, use auto-assignment
  if (!agentId) {
    // Get active assignment rule
    const { data: rule } = await db
      .from("assignment_rules")
      .select("*")
      .eq("workspace_id", ctx.currentWorkspace.id)
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rule) {
      if (rule.strategy === "round_robin") {
        // Use round-robin function
        const { data: nextAgent } = await db.rpc("get_next_round_robin_agent", {
          p_rule_id: rule.id,
        });
        agentId = nextAgent as string;
      } else if (rule.strategy === "load_balance") {
        // Use load balance function
        const { data: leastLoaded } = await db.rpc("get_least_loaded_agent", {
          p_agent_ids: rule.agent_ids,
          p_workspace_id: ctx.currentWorkspace.id,
          p_max_chats: rule.max_chats_per_agent || 50,
        });
        agentId = leastLoaded as string;
      } else {
        // Manual - pick first available
        agentId = rule.agent_ids[0];
      }
    }
  }

  if (!agentId) {
    return NextResponse.json(
      { error: "No agent available for assignment" },
      { status: 400 }
    );
  }

  // Update thread assignment
  const { error } = await db
    .from(tableName)
    .update({ 
      assigned_to: agentId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", validated.threadId)
    .eq("workspace_id", ctx.currentWorkspace.id);

  if (error) {
    logger.error("Failed to assign thread", { error: error.message });
    return NextResponse.json({ error: "Assignment failed" }, { status: 500 });
  }

  logger.info("Thread assigned", {
    threadId: validated.threadId,
    agentId,
    threadType: validated.threadType,
    workspaceId: ctx.currentWorkspace.id,
  });

  return NextResponse.json({ 
    success: true, 
    assignedTo: agentId,
  });
}

// ============================================================================
// PATCH - Update assignment rule
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

    // Build updates
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (validated.name !== undefined) updates.name = validated.name;
    if (validated.strategy !== undefined) updates.strategy = validated.strategy;
    if (validated.agentIds !== undefined) updates.agent_ids = validated.agentIds;
    if (validated.isActive !== undefined) updates.is_active = validated.isActive;
    if (validated.maxChatsPerAgent !== undefined) updates.max_chats_per_agent = validated.maxChatsPerAgent;
    if (validated.priority !== undefined) updates.priority = validated.priority;
    if (validated.conditions !== undefined) updates.conditions = validated.conditions;

    const { data, error } = await db
      .from("assignment_rules")
      .update(updates)
      .eq("id", validated.id)
      .eq("workspace_id", ctx.currentWorkspace.id)
      .select()
      .single();

    if (error) {
      logger.error("Failed to update assignment rule", { error: error.message });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ rule: mapRule(data) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    logger.error("Assignment rules PATCH error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// ============================================================================
// DELETE - Delete assignment rule
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
      .from("assignment_rules")
      .delete()
      .eq("id", id)
      .eq("workspace_id", ctx.currentWorkspace.id);

    if (error) {
      logger.error("Failed to delete assignment rule", { error: error.message });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Assignment rules DELETE error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
