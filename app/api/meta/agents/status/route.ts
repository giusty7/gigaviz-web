/**
 * Agent Status API - Multi-agent collaboration
 * GET  /api/meta/agents/status - Get all agent statuses
 * POST /api/meta/agents/status - Update current agent status
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseRouteClient } from '@/lib/supabase/app-route';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';
import { withErrorHandler } from "@/lib/api/with-error-handler";

// ========================================
// Validation Schemas
// ========================================

const UpdateStatusSchema = z.object({
  workspaceId: z.string().uuid(),
  status: z.enum(['online', 'away', 'busy', 'offline']),
  currentThreadId: z.string().uuid().optional().nullable(),
  isTyping: z.boolean().optional(),
  lastActivity: z.string().datetime().optional(),
});

// ========================================
// GET - Get All Agent Statuses
// ========================================

export const GET = withErrorHandler(async (request: NextRequest) => {
  try {
    const { supabase, withCookies } = createSupabaseRouteClient(request);
    const { searchParams } = new URL(request.url);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return withCookies(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const workspaceId = searchParams.get('workspaceId');
    if (!workspaceId) {
      return withCookies(NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      ));
    }

    // Verify workspace access using admin client to bypass RLS
    const db = supabaseAdmin();
    const { data: membership, error: membershipError } = await db
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      logger.warn('[Agent Status] Access denied', { userId: user.id, workspaceId, error: membershipError?.message });
      return withCookies(NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      ));
    }

    // Get all agent statuses for this workspace (without embedded profile query)
    const { data: agents, error } = await db
      .from('agent_status')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('last_activity', { ascending: false });

    // Handle table not existing or schema issues gracefully
    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST200' || error.message?.includes('does not exist')) {
        // Table doesn't exist or schema issue - return empty state
        logger.warn('[Agent Status] Table/schema issue, returning empty state:', { code: error.code });
        return withCookies(NextResponse.json({
          agents: [],
          summary: { online: 0, away: 0, busy: 0, offline: 0, total: 0 },
          currentUserId: user.id,
        }));
      }
      logger.error('[Agent Status] Failed to fetch:', { error });
      throw error;
    }

    // Fetch profiles separately for the agent user IDs
    const userIds = agents?.map((a) => a.user_id).filter(Boolean) || [];
    let profilesMap: Record<string, { id: string; display_name: string | null; avatar_url: string | null }> = {};
    
    if (userIds.length > 0) {
      const { data: profiles } = await db
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);
      
      profilesMap = (profiles || []).reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as typeof profilesMap);
    }

    // Merge agents with profiles
    const agentsWithProfiles = agents?.map((a) => ({
      ...a,
      profiles: profilesMap[a.user_id] || { id: a.user_id, display_name: null, avatar_url: null },
    })) || [];

    // Filter out stale offline agents (no activity in 24h)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const activeAgents = agentsWithProfiles.filter(
      (a) => a.status !== 'offline' || a.last_activity > cutoff
    );

    // Summary stats
    const summary = {
      online: activeAgents?.filter((a) => a.status === 'online').length || 0,
      away: activeAgents?.filter((a) => a.status === 'away').length || 0,
      busy: activeAgents?.filter((a) => a.status === 'busy').length || 0,
      offline: activeAgents?.filter((a) => a.status === 'offline').length || 0,
      total: activeAgents?.length || 0,
    };

    return withCookies(NextResponse.json({
      agents: activeAgents || [],
      summary,
      currentUserId: user.id,
    }));
  } catch (error) {
    logger.error('[Agent Status] GET error:', { error });
    const message = error instanceof Error ? error.message : 'Unknown error';
    const { withCookies } = createSupabaseRouteClient(request);
    return withCookies(NextResponse.json(
      { error: message },
      { status: 500 }
    ));
  }
});

// ========================================
// POST - Update Agent Status
// ========================================

export const POST = withErrorHandler(async (request: NextRequest) => {
  try {
    const { supabase, withCookies } = createSupabaseRouteClient(request);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return withCookies(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const body = await request.json();
    const validated = UpdateStatusSchema.parse(body);

    // Verify workspace access
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('workspace_id', validated.workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return withCookies(NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      ));
    }

    const db = supabaseAdmin();
    const now = new Date().toISOString();

    // Upsert agent status
    const { data: status, error } = await db
      .from('agent_status')
      .upsert({
        workspace_id: validated.workspaceId,
        user_id: user.id,
        status: validated.status,
        current_thread_id: validated.currentThreadId ?? null,
        is_typing: validated.isTyping ?? false,
        last_activity: validated.lastActivity ?? now,
        updated_at: now,
      }, {
        onConflict: 'workspace_id,user_id',
      })
      .select()
      .single();

    if (error) {
      logger.error('[Agent Status] Failed to update:', { error });
      throw error;
    }

    return withCookies(NextResponse.json({ status, updated: true }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      const { withCookies } = createSupabaseRouteClient(request);
      return withCookies(NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      ));
    }

    logger.error('[Agent Status] POST error:', { error });
    const message = error instanceof Error ? error.message : 'Unknown error';
    const { withCookies } = createSupabaseRouteClient(request);
    return withCookies(NextResponse.json(
      { error: message },
      { status: 500 }
    ));
  }
});
