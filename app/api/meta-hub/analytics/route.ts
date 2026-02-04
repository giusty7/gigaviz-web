/**
 * Meta Hub Usage Analytics API
 * GET /api/meta-hub/analytics - Get usage analytics
 * POST /api/meta-hub/analytics - Track usage event
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseRouteClient } from '@/lib/supabase/app-route';
import { resolveWorkspaceId } from '@/lib/workspaces/resolve';
import {
  trackMetaHubUsage,
  getMetaHubUsageStats,
  getMetaHubInsightsSummary,
  type UsageEventType,
  type UsagePlatform,
} from '@/lib/meta-hub/usage-analytics';
import { logger } from '@/lib/logging';

// ========================================
// Validation Schemas
// ========================================

const TrackEventSchema = z.object({
  workspaceId: z.string().uuid(),
  eventType: z.string() as z.ZodType<UsageEventType>,
  platform: z.enum(['whatsapp', 'instagram', 'messenger', 'ads', 'automation', 'general']) as z.ZodType<UsagePlatform>,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ========================================
// GET - Get Usage Analytics
// ========================================

export async function GET(request: NextRequest) {
  try {
    const { supabase, withCookies } = createSupabaseRouteClient(request);
    const { searchParams } = new URL(request.url);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return withCookies(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const workspaceIdOrSlug = searchParams.get('workspace_id');
    const view = searchParams.get('view') || 'summary'; // summary | detailed | insights
    const days = parseInt(searchParams.get('days') || '30');
    const platform = searchParams.get('platform') as UsagePlatform | null;

    if (!workspaceIdOrSlug) {
      return withCookies(NextResponse.json(
        { error: 'workspace_id required' },
        { status: 400 }
      ));
    }

    const workspaceId = await resolveWorkspaceId(supabase, workspaceIdOrSlug);
    if (!workspaceId) {
      return withCookies(NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      ));
    }

    // Verify workspace access
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return withCookies(NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      ));
    }

    // Get analytics based on view type
    if (view === 'insights') {
      const insights = await getMetaHubInsightsSummary(workspaceId, days);
      return withCookies(NextResponse.json({ insights }));
    }

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const stats = await getMetaHubUsageStats(workspaceId, {
      startDate,
      endDate: new Date(),
      platform: platform || undefined,
    });

    return withCookies(NextResponse.json({
      stats,
      period: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
        days,
      },
    }));
  } catch (error) {
    logger.error('[Usage Analytics API] GET error:', { error });
    const message = error instanceof Error ? error.message : 'Unknown error';
    const { withCookies } = createSupabaseRouteClient(request);
    return withCookies(NextResponse.json(
      { error: message },
      { status: 500 }
    ));
  }
}

// ========================================
// POST - Track Usage Event
// ========================================

export async function POST(request: NextRequest) {
  try {
    const { supabase, withCookies } = createSupabaseRouteClient(request);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return withCookies(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const body = await request.json();
    const validated = TrackEventSchema.parse(body);

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

    // Track the event
    const tracked = await trackMetaHubUsage({
      workspaceId: validated.workspaceId,
      userId: user.id,
      eventType: validated.eventType,
      platform: validated.platform,
      metadata: validated.metadata,
    });

    return withCookies(NextResponse.json({ tracked, success: tracked }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      const { withCookies } = createSupabaseRouteClient(request);
      return withCookies(NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      ));
    }

    logger.error('[Usage Analytics API] POST error:', { error });
    const message = error instanceof Error ? error.message : 'Unknown error';
    const { withCookies } = createSupabaseRouteClient(request);
    return withCookies(NextResponse.json(
      { error: message },
      { status: 500 }
    ));
  }
}
