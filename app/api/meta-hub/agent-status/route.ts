import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logging";

// ============================================================================
// TYPES
// ============================================================================

export type AgentStatusType = "online" | "away" | "busy" | "offline";

export interface AgentStatus {
  userId: string;
  workspaceId: string;
  status: AgentStatusType;
  statusMessage: string | null;
  lastActiveAt: string;
  autoAwayAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined data
  profile?: {
    fullName: string | null;
    avatarUrl: string | null;
    email: string;
  };
}

// ============================================================================
// SCHEMAS
// ============================================================================

const updateSchema = z.object({
  status: z.enum(["online", "away", "busy", "offline"]),
  statusMessage: z.string().max(100).optional().nullable(),
});

// ============================================================================
// HELPERS
// ============================================================================

function mapAgentStatus(row: Record<string, unknown>): AgentStatus {
  const profile = row.profiles as Record<string, unknown> | null;
  
  return {
    userId: row.user_id as string,
    workspaceId: row.workspace_id as string,
    status: row.status as AgentStatusType,
    statusMessage: row.status_message as string | null,
    lastActiveAt: row.last_active_at as string,
    autoAwayAt: row.auto_away_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    profile: profile ? {
      fullName: profile.full_name as string | null,
      avatarUrl: profile.avatar_url as string | null,
      email: profile.email as string,
    } : undefined,
  };
}

// ============================================================================
// GET - Get agent statuses for workspace
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const ctx = await getAppContext();
    if (!ctx.user || !ctx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const db = await supabaseServer();

    // If userId provided, get single status
    if (userId) {
      const { data, error } = await db
        .from("agent_status")
        .select("*")
        .eq("workspace_id", ctx.currentWorkspace.id)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        logger.error("Failed to fetch agent status", { error: error.message });
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }

      // Fetch profile separately if status exists
      if (data) {
        const { data: profile } = await db
          .from("profiles")
          .select("full_name, avatar_url, email")
          .eq("id", userId)
          .maybeSingle();
        if (profile) {
          (data as Record<string, unknown>).profiles = profile;
        }
      }

      return NextResponse.json({ 
        status: data ? mapAgentStatus(data) : null 
      });
    }

    // Get all workspace agent statuses
    const { data, error } = await db
      .from("agent_status")
      .select("*")
      .eq("workspace_id", ctx.currentWorkspace.id)
      .order("status");

    // Fetch profiles for all users
    if (data && data.length > 0) {
      const userIds = data.map(d => d.user_id);
      const { data: profiles } = await db
        .from("profiles")
        .select("id, full_name, avatar_url, email")
        .in("id", userIds);
      
      // Merge profiles into data
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      for (const row of data) {
        const profile = profileMap.get(row.user_id);
        if (profile) {
          (row as Record<string, unknown>).profiles = profile;
        }
      }
    }

    if (error) {
      logger.error("Failed to fetch agent statuses", { error: error.message });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const agents = (data || []).map(mapAgentStatus);

    // Also get online count
    const onlineCount = agents.filter(a => a.status === "online").length;
    const availableCount = agents.filter(a => ["online", "away"].includes(a.status)).length;

    return NextResponse.json({ 
      agents,
      stats: {
        total: agents.length,
        online: onlineCount,
        available: availableCount,
      }
    });
  } catch (err) {
    logger.error("Agent status GET error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================================================
// POST - Update current user's agent status
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAppContext();
    if (!ctx.user || !ctx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = updateSchema.parse(body);

    const db = await supabaseServer();

    // Upsert status
    const { data, error } = await db
      .from("agent_status")
      .upsert({
        user_id: ctx.user.id,
        workspace_id: ctx.currentWorkspace.id,
        status: validated.status,
        status_message: validated.statusMessage || null,
        last_active_at: new Date().toISOString(),
        auto_away_at: null, // Reset auto-away when manually changing status
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,workspace_id",
      })
      .select("*")
      .single();

    // Fetch profile separately
    if (data) {
      const { data: profile } = await db
        .from("profiles")
        .select("full_name, avatar_url, email")
        .eq("id", ctx.user.id)
        .maybeSingle();
      if (profile) {
        (data as Record<string, unknown>).profiles = profile;
      }
    }

    if (error) {
      logger.error("Failed to update agent status", { error: error.message });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    logger.info("Agent status updated", { 
      userId: ctx.user.id,
      workspaceId: ctx.currentWorkspace.id,
      status: validated.status,
    });

    return NextResponse.json({ status: mapAgentStatus(data) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    logger.error("Agent status POST error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================================================
// PATCH - Heartbeat / activity ping (updates last_active_at)
// ============================================================================

export async function PATCH() {
  try {
    const ctx = await getAppContext();
    if (!ctx.user || !ctx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await supabaseServer();

    // Update last_active_at or create status if doesn't exist
    const { error } = await db
      .from("agent_status")
      .upsert({
        user_id: ctx.user.id,
        workspace_id: ctx.currentWorkspace.id,
        status: "online",
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,workspace_id",
        ignoreDuplicates: false,
      });

    if (error) {
      // If upsert fails, try just updating
      await db
        .from("agent_status")
        .update({ 
          last_active_at: new Date().toISOString(),
          status: "online",
        })
        .eq("user_id", ctx.user.id)
        .eq("workspace_id", ctx.currentWorkspace.id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Agent status PATCH error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
