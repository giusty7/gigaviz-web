import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";

// ============================================================================
// TYPES
// ============================================================================

export type AutoReplyTrigger = "new_message" | "outside_hours" | "keyword" | "unassigned";

export interface AutoReplyRule {
  id: string;
  workspaceId: string;
  name: string;
  triggerType: AutoReplyTrigger;
  triggerConfig: Record<string, unknown>;
  messageContent: string;
  templateId: string | null;
  isActive: boolean;
  cooldownMinutes: number;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SCHEMAS
// ============================================================================

const createSchema = z.object({
  name: z.string().min(1).max(100),
  triggerType: z.enum(["new_message", "outside_hours", "keyword", "unassigned"]),
  triggerConfig: z.record(z.string(), z.unknown()).default({}),
  messageContent: z.string().min(1).max(4096).optional(),
  templateId: z.string().uuid().optional().nullable(),
  cooldownMinutes: z.number().int().min(0).max(1440).default(30),
  priority: z.number().int().default(0),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  triggerType: z.enum(["new_message", "outside_hours", "keyword", "unassigned"]).optional(),
  triggerConfig: z.record(z.string(), z.unknown()).optional(),
  messageContent: z.string().min(1).max(4096).optional(),
  templateId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
  cooldownMinutes: z.number().int().min(0).max(1440).optional(),
  priority: z.number().int().optional(),
});

// ============================================================================
// HELPERS
// ============================================================================

function mapRule(row: Record<string, unknown>): AutoReplyRule {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    name: row.name as string,
    triggerType: row.trigger_type as AutoReplyTrigger,
    triggerConfig: (row.trigger_config as Record<string, unknown>) || {},
    messageContent: row.message_content as string,
    templateId: row.template_id as string | null,
    isActive: row.is_active as boolean,
    cooldownMinutes: row.cooldown_minutes as number,
    priority: row.priority as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ============================================================================
// GET - List auto-reply rules
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const ctx = await getAppContext();
    if (!ctx.user || !ctx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const triggerType = searchParams.get("triggerType");

    const db = await supabaseServer();
    let query = db
      .from("auto_reply_rules")
      .select("*")
      .eq("workspace_id", ctx.currentWorkspace.id)
      .order("priority", { ascending: false })
      .order("created_at");

    if (triggerType) {
      query = query.eq("trigger_type", triggerType);
    }

    const { data, error } = await query;

    if (error) {
      logger.error("Failed to fetch auto-reply rules", { error: error.message });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ rules: (data || []).map(mapRule) });
  } catch (err) {
    logger.error("Auto-reply rules GET error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================================================
// POST - Create auto-reply rule
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAppContext();
    if (!ctx.user || !ctx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = createSchema.parse(body);

    // Must have either messageContent or templateId
    if (!validated.messageContent && !validated.templateId) {
      return NextResponse.json(
        { error: "Either messageContent or templateId is required" },
        { status: 400 }
      );
    }

    const db = await supabaseServer();
    const { data, error } = await db
      .from("auto_reply_rules")
      .insert({
        workspace_id: ctx.currentWorkspace.id,
        name: validated.name,
        trigger_type: validated.triggerType,
        trigger_config: validated.triggerConfig,
        message_content: validated.messageContent || "",
        template_id: validated.templateId || null,
        cooldown_minutes: validated.cooldownMinutes,
        priority: validated.priority,
      })
      .select()
      .single();

    if (error) {
      logger.error("Failed to create auto-reply rule", { error: error.message });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    logger.info("Auto-reply rule created", { 
      ruleId: data.id, 
      workspaceId: ctx.currentWorkspace.id,
      triggerType: validated.triggerType,
    });

    return NextResponse.json({ rule: mapRule(data) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    logger.error("Auto-reply rules POST error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================================================
// PATCH - Update auto-reply rule
// ============================================================================

export async function PATCH(req: NextRequest) {
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
    if (validated.triggerType !== undefined) updates.trigger_type = validated.triggerType;
    if (validated.triggerConfig !== undefined) updates.trigger_config = validated.triggerConfig;
    if (validated.messageContent !== undefined) updates.message_content = validated.messageContent;
    if (validated.templateId !== undefined) updates.template_id = validated.templateId;
    if (validated.isActive !== undefined) updates.is_active = validated.isActive;
    if (validated.cooldownMinutes !== undefined) updates.cooldown_minutes = validated.cooldownMinutes;
    if (validated.priority !== undefined) updates.priority = validated.priority;

    const { data, error } = await db
      .from("auto_reply_rules")
      .update(updates)
      .eq("id", validated.id)
      .eq("workspace_id", ctx.currentWorkspace.id)
      .select()
      .single();

    if (error) {
      logger.error("Failed to update auto-reply rule", { error: error.message });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ rule: mapRule(data) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    logger.error("Auto-reply rules PATCH error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================================================
// DELETE - Delete auto-reply rule
// ============================================================================

export async function DELETE(req: NextRequest) {
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
      .from("auto_reply_rules")
      .delete()
      .eq("id", id)
      .eq("workspace_id", ctx.currentWorkspace.id);

    if (error) {
      logger.error("Failed to delete auto-reply rule", { error: error.message });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Auto-reply rules DELETE error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================================================
// Utility: Check cooldown and execute auto-reply
// (Called from webhook handlers)
// ============================================================================

export async function checkAndExecuteAutoReply(params: {
  workspaceId: string;
  contactId: string;
  threadId: string;
  messageText?: string;
  channel: "whatsapp" | "instagram" | "messenger";
}): Promise<{ triggered: boolean; ruleId?: string; message?: string }> {
  const db = supabaseAdmin();

  // Get active rules ordered by priority
  const { data: rules, error } = await db
    .from("auto_reply_rules")
    .select("*")
    .eq("workspace_id", params.workspaceId)
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (error || !rules?.length) {
    return { triggered: false };
  }

  for (const rule of rules) {
    const shouldTrigger = evaluateTrigger(rule, params);
    if (!shouldTrigger) continue;

    // Check cooldown
    const { data: cooldown } = await db
      .from("auto_reply_cooldowns")
      .select("expires_at")
      .eq("rule_id", rule.id)
      .eq("contact_id", params.contactId)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cooldown) {
      // Still in cooldown, skip this rule
      continue;
    }

    // Set cooldown
    const expiresAt = new Date(Date.now() + rule.cooldown_minutes * 60 * 1000);
    await db.from("auto_reply_cooldowns").upsert({
      rule_id: rule.id,
      contact_id: params.contactId,
      workspace_id: params.workspaceId,
      expires_at: expiresAt.toISOString(),
    }, {
      onConflict: "rule_id,contact_id",
    });

    logger.info("Auto-reply triggered", {
      ruleId: rule.id,
      ruleName: rule.name,
      contactId: params.contactId,
      workspaceId: params.workspaceId,
    });

    return {
      triggered: true,
      ruleId: rule.id,
      message: rule.message_content,
    };
  }

  return { triggered: false };
}

function evaluateTrigger(
  rule: Record<string, unknown>,
  params: { messageText?: string }
): boolean {
  const triggerType = rule.trigger_type as string;
  const config = (rule.trigger_config as Record<string, unknown>) || {};

  switch (triggerType) {
    case "new_message":
      // Always trigger on new message (if not in cooldown)
      return true;

    case "keyword": {
      const keywords = (config.keywords as string[]) || [];
      const text = (params.messageText || "").toLowerCase();
      return keywords.some(kw => text.includes(kw.toLowerCase()));
    }

    case "outside_hours": {
      const schedule = config.schedule as { 
        days?: number[]; 
        startHour?: number; 
        endHour?: number;
        timezone?: string;
      } | undefined;
      
      if (!schedule) return true;
      
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();
      
      const activeDays = schedule.days || [1, 2, 3, 4, 5]; // Mon-Fri default
      const startHour = schedule.startHour ?? 9;
      const endHour = schedule.endHour ?? 18;
      
      // If outside business hours, trigger
      const isBusinessDay = activeDays.includes(day);
      const isBusinessHour = hour >= startHour && hour < endHour;
      
      return !isBusinessDay || !isBusinessHour;
    }

    case "unassigned":
      // Would need thread info to check - typically handled separately
      return true;

    default:
      return false;
  }
}
