/**
 * Automation Rules API - List & Create
 * GET  /api/meta/whatsapp/automation/rules?workspaceId=<uuid>
 * POST /api/meta/whatsapp/automation/rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/app-route';
import { z } from 'zod';

// ========================================
// Validation Schemas
// ========================================

const ConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'exists', 'not_exists', 'greater_than', 'less_than']),
  value: z.unknown(),
});

const ActionSchema = z.object({
  type: z.enum(['add_tag', 'remove_tag', 'change_status', 'assign_to', 'send_template']),
  params: z.record(z.string(), z.unknown()),
});

const CreateRuleSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  trigger_type: z.enum(['new_message', 'tag_added', 'status_changed', 'assigned']),
  trigger_config: z.record(z.string(), z.unknown()).optional(),
  conditions: z.array(ConditionSchema).default([]),
  actions: z.array(ActionSchema).min(1),
  enabled: z.boolean().default(true),
  priority: z.number().int().min(0).default(0),
});

// ========================================
// GET - List Automation Rules
// ========================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const { supabase } = createSupabaseRouteClient(request);

    // Verify user has access to workspace
    const { data: membership } = await supabase
      .from('workspace_memberships')
      .select('workspace_id')
      .eq('workspace_id', workspaceId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch automation rules
    const { data: rules, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Automation API] Failed to fetch rules:', error);
      return NextResponse.json(
        { error: 'Failed to fetch automation rules' },
        { status: 500 }
      );
    }

    return NextResponse.json({ rules: rules || [] });

  } catch (err) {
    console.error('[Automation API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ========================================
// POST - Create Automation Rule
// ========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateRuleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { workspaceId, ...ruleData } = parsed.data;

    const { supabase } = createSupabaseRouteClient(request);

    // Verify user has access to workspace
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: membership } = await supabase
      .from('workspace_memberships')
      .select('workspace_id, role')
      .eq('workspace_id', workspaceId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      );
    }

    // Create automation rule
    const { data: newRule, error } = await supabase
      .from('automation_rules')
      .insert({
        workspace_id: workspaceId,
        created_by: userData.user.id,
        ...ruleData,
      })
      .select()
      .single();

    if (error) {
      console.error('[Automation API] Failed to create rule:', error);
      return NextResponse.json(
        { error: 'Failed to create automation rule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ rule: newRule }, { status: 201 });

  } catch (err) {
    console.error('[Automation API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
