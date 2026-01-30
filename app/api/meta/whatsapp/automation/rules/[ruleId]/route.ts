/**
 * Automation Rule API - Get, Update, Delete
 * GET    /api/meta/whatsapp/automation/rules/[ruleId]
 * PATCH  /api/meta/whatsapp/automation/rules/[ruleId]
 * DELETE /api/meta/whatsapp/automation/rules/[ruleId]
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

const UpdateRuleSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  trigger_type: z.enum(['new_message', 'tag_added', 'status_changed', 'assigned']).optional(),
  trigger_config: z.record(z.string(), z.unknown()).optional(),
  conditions: z.array(ConditionSchema).optional(),
  actions: z.array(ActionSchema).min(1).optional(),
  enabled: z.boolean().optional(),
  priority: z.number().int().min(0).optional(),
});

// ========================================
// GET - Fetch Single Rule
// ========================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const { ruleId } = await params;
    const { supabase } = createSupabaseRouteClient(request);

    // Fetch rule with workspace membership check (RLS handles this)
    const { data: rule, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('id', ruleId)
      .single();

    if (error || !rule) {
      return NextResponse.json(
        { error: 'Automation rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ rule });

  } catch (err) {
    console.error('[Automation API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ========================================
// PATCH - Update Rule
// ========================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const { ruleId } = await params;
    const body = await request.json();
    const parsed = UpdateRuleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { supabase } = createSupabaseRouteClient(request);

    // Update rule (RLS ensures user has access)
    const { data: updatedRule, error } = await supabase
      .from('automation_rules')
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ruleId)
      .select()
      .single();

    if (error || !updatedRule) {
      console.error('[Automation API] Failed to update rule:', error);
      return NextResponse.json(
        { error: 'Failed to update automation rule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ rule: updatedRule });

  } catch (err) {
    console.error('[Automation API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ========================================
// DELETE - Delete Rule
// ========================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const { ruleId } = await params;
    const { supabase } = createSupabaseRouteClient(request);

    // Delete rule (RLS ensures user has access)
    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', ruleId);

    if (error) {
      console.error('[Automation API] Failed to delete rule:', error);
      return NextResponse.json(
        { error: 'Failed to delete automation rule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err) {
    console.error('[Automation API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
