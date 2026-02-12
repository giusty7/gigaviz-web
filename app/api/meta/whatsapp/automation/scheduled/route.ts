/**
 * Automation Scheduled Actions API
 * GET  /api/meta/whatsapp/automation/scheduled - List scheduled actions
 * POST /api/meta/whatsapp/automation/scheduled - Create scheduled action
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseRouteClient } from '@/lib/supabase/app-route';
import { recordAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logging';
import { withErrorHandler } from "@/lib/api/with-error-handler";

// ========================================
// Validation Schemas
// ========================================

const ActionParamsSchema = z.record(z.string(), z.unknown());

const CreateScheduledActionSchema = z.object({
  workspaceId: z.string().uuid(),
  threadId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  actionType: z.enum([
    'send_template',
    'send_message',
    'change_status',
    'add_tag',
    'remove_tag',
    'assign_to',
    'notify_agent',
    'close_thread',
  ]),
  actionParams: ActionParamsSchema,
  scheduledFor: z.string().datetime(),
  trigger: z.enum([
    'time_delay',          // X minutes/hours after event
    'scheduled_time',      // Specific date/time
    'inactivity',          // No response for X time
    'follow_up',           // Scheduled follow-up
    'recurring',           // Recurring schedule
  ]),
  triggerConfig: z.object({
    delayMinutes: z.number().optional(),
    recurrencePattern: z.string().optional(), // cron-like pattern
    timezone: z.string().optional(),
  }).optional(),
  priority: z.number().int().min(0).max(100).default(50),
  maxRetries: z.number().int().min(0).max(10).default(3),
  ruleId: z.string().uuid().optional(), // Link to automation rule if triggered by one
});

// ========================================
// GET - List Scheduled Actions
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
    const status = searchParams.get('status'); // pending, executing, completed, failed, cancelled
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!workspaceId) {
      return withCookies(NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      ));
    }

    // Verify workspace access
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return withCookies(NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      ));
    }

    let query = supabase
      .from('automation_scheduled_actions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('scheduled_for', { ascending: true })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: actions, error } = await query;

    if (error) {
      logger.error('[Scheduled Actions] Failed to fetch:', { error });
      throw error;
    }

    // Group by status for summary
    const summary = {
      pending: 0,
      executing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    actions?.forEach((action) => {
      if (action.status in summary) {
        summary[action.status as keyof typeof summary]++;
      }
    });

    return withCookies(NextResponse.json({
      actions: actions || [],
      summary,
    }));
  } catch (error) {
    logger.error('[Scheduled Actions] GET error:', { error });
    const message = error instanceof Error ? error.message : 'Unknown error';
    const { withCookies } = createSupabaseRouteClient(request);
    return withCookies(NextResponse.json(
      { error: message },
      { status: 500 }
    ));
  }
});

// ========================================
// POST - Create Scheduled Action
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
    const validated = CreateScheduledActionSchema.parse(body);

    // Verify admin access
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', validated.workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return withCookies(NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      ));
    }

    // Create scheduled action
    const { data: action, error } = await supabase
      .from('automation_scheduled_actions')
      .insert({
        workspace_id: validated.workspaceId,
        thread_id: validated.threadId,
        contact_id: validated.contactId,
        action_type: validated.actionType,
        action_params: validated.actionParams,
        scheduled_for: validated.scheduledFor,
        trigger: validated.trigger,
        trigger_config: validated.triggerConfig,
        priority: validated.priority,
        max_retries: validated.maxRetries,
        rule_id: validated.ruleId,
        status: 'pending',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      logger.error('[Scheduled Actions] Failed to create:', { error });
      throw error;
    }

    await recordAuditEvent({
      workspaceId: validated.workspaceId,
      actorUserId: user.id,
      action: 'automation_action_scheduled',
      meta: {
        actionId: action.id,
        actionType: validated.actionType,
        scheduledFor: validated.scheduledFor,
        trigger: validated.trigger,
      },
    });

    logger.info('[Scheduled Actions] Created:', {
      actionId: action.id,
      workspaceId: validated.workspaceId,
    });

    return withCookies(NextResponse.json({ action, created: true }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      const { withCookies } = createSupabaseRouteClient(request);
      return withCookies(NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      ));
    }

    logger.error('[Scheduled Actions] POST error:', { error });
    const message = error instanceof Error ? error.message : 'Unknown error';
    const { withCookies } = createSupabaseRouteClient(request);
    return withCookies(NextResponse.json(
      { error: message },
      { status: 500 }
    ));
  }
});

// ========================================
// DELETE - Cancel Scheduled Action
// ========================================

export const DELETE = withErrorHandler(async (request: NextRequest) => {
  try {
    const { supabase, withCookies } = createSupabaseRouteClient(request);
    const { searchParams } = new URL(request.url);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return withCookies(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const actionId = searchParams.get('actionId');
    if (!actionId) {
      return withCookies(NextResponse.json(
        { error: 'actionId is required' },
        { status: 400 }
      ));
    }

    // Get action to verify workspace access
    const { data: action } = await supabase
      .from('automation_scheduled_actions')
      .select('workspace_id, status')
      .eq('id', actionId)
      .single();

    if (!action) {
      return withCookies(NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      ));
    }

    // Verify admin access
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', action.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return withCookies(NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      ));
    }

    if (action.status !== 'pending') {
      return withCookies(NextResponse.json(
        { error: 'Only pending actions can be cancelled' },
        { status: 400 }
      ));
    }

    // Cancel the action
    const { error } = await supabase
      .from('automation_scheduled_actions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', actionId);

    if (error) throw error;

    await recordAuditEvent({
      workspaceId: action.workspace_id,
      actorUserId: user.id,
      action: 'automation_action_cancelled',
      meta: { actionId },
    });

    return withCookies(NextResponse.json({ success: true, cancelled: true }));
  } catch (error) {
    logger.error('[Scheduled Actions] DELETE error:', { error });
    const message = error instanceof Error ? error.message : 'Unknown error';
    const { withCookies } = createSupabaseRouteClient(request);
    return withCookies(NextResponse.json(
      { error: message },
      { status: 500 }
    ));
  }
});
