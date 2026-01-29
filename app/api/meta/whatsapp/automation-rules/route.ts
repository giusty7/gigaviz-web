import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseRouteClient } from '@/lib/supabase/app-route';
import {
  forbiddenResponse,
  getWorkspaceId,
  requireWorkspaceMember,
  requireWorkspaceRole,
  unauthorizedResponse,
  workspaceRequiredResponse,
} from '@/lib/auth/guard';
import { supabaseAdmin } from '@/lib/supabase/admin';

const conditionSchema = z.object({
  field: z.string(),
  operator: z.string(),
  value: z.unknown(),
});

const actionSchema = z.object({
  type: z.string(),
  params: z.record(z.string(), z.unknown()),
});

const createSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  trigger_type: z.string(),
  trigger_config: z.record(z.string(), z.unknown()).optional(),
  conditions: z.array(conditionSchema).default([]),
  actions: z.array(actionSchema).min(1),
  enabled: z.boolean().default(true),
  priority: z.number().int().min(0).max(100).default(0),
});

const updateSchema = z.object({
  workspaceId: z.string().uuid(),
  ruleId: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  trigger_type: z.string().optional(),
  trigger_config: z.record(z.string(), z.unknown()).optional(),
  conditions: z.array(conditionSchema).optional(),
  actions: z.array(actionSchema).optional(),
  enabled: z.boolean().optional(),
  priority: z.number().int().min(0).max(100).optional(),
});

const deleteSchema = z.object({
  workspaceId: z.string().uuid(),
  ruleId: z.string().uuid(),
});

export const runtime = 'nodejs';

/**
 * GET /api/meta/whatsapp/automation-rules
 * List automation rules for a workspace
 */
export async function GET(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const { searchParams } = new URL(req.url);
  const bodyWorkspaceId = searchParams.get('workspaceId');
  const workspaceId = getWorkspaceId(req, undefined, bodyWorkspaceId ?? undefined);

  if (!workspaceId) {
    return workspaceRequiredResponse(withCookies);
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ['owner', 'admin', 'member'])) {
    return forbiddenResponse(withCookies);
  }

  const db = supabaseAdmin();
  const { data: rules, error } = await db
    .from('automation_rules')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('priority', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    return withCookies(
      NextResponse.json(
        { error: 'db_error', reason: 'fetch_rules_failed', message: error.message },
        { status: 500 }
      )
    );
  }

  return withCookies(NextResponse.json({ rules: rules || [] }));
}

/**
 * POST /api/meta/whatsapp/automation-rules
 * Create a new automation rule
 */
export async function POST(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: 'bad_request', reason: 'invalid_payload', issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { workspaceId, ...ruleData } = parsed.data;
  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  
  if (!membership.ok || !requireWorkspaceRole(membership.role, ['owner', 'admin'])) {
    return forbiddenResponse(withCookies);
  }

  const db = supabaseAdmin();
  const { data: rule, error } = await db
    .from('automation_rules')
    .insert({
      workspace_id: workspaceId,
      ...ruleData,
      created_by: userData.user.id,
    })
    .select()
    .single();

  if (error) {
    return withCookies(
      NextResponse.json(
        { error: 'db_error', reason: 'create_rule_failed', message: error.message },
        { status: 500 }
      )
    );
  }

  return withCookies(NextResponse.json({ rule }, { status: 201 }));
}

/**
 * PATCH /api/meta/whatsapp/automation-rules
 * Update an existing automation rule
 */
export async function PATCH(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: 'bad_request', reason: 'invalid_payload', issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { workspaceId, ruleId, ...updateData } = parsed.data;
  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  
  if (!membership.ok || !requireWorkspaceRole(membership.role, ['owner', 'admin'])) {
    return forbiddenResponse(withCookies);
  }

  // Remove undefined fields
  const cleanedData = Object.fromEntries(
    Object.entries(updateData).filter(([, v]) => v !== undefined)
  );

  if (Object.keys(cleanedData).length === 0) {
    return withCookies(
      NextResponse.json({ error: 'bad_request', reason: 'no_fields_to_update' }, { status: 400 })
    );
  }

  const db = supabaseAdmin();
  const { data: rule, error } = await db
    .from('automation_rules')
    .update(cleanedData)
    .eq('id', ruleId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    return withCookies(
      NextResponse.json(
        { error: 'db_error', reason: 'update_rule_failed', message: error.message },
        { status: 500 }
      )
    );
  }

  if (!rule) {
    return withCookies(
      NextResponse.json({ error: 'not_found', reason: 'rule_not_found' }, { status: 404 })
    );
  }

  return withCookies(NextResponse.json({ rule }));
}

/**
 * DELETE /api/meta/whatsapp/automation-rules
 * Delete an automation rule
 */
export async function DELETE(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const body = await req.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);

  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: 'bad_request', reason: 'invalid_payload', issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { workspaceId, ruleId } = parsed.data;
  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  
  if (!membership.ok || !requireWorkspaceRole(membership.role, ['owner', 'admin'])) {
    return forbiddenResponse(withCookies);
  }

  const db = supabaseAdmin();
  const { error } = await db
    .from('automation_rules')
    .delete()
    .eq('id', ruleId)
    .eq('workspace_id', workspaceId);

  if (error) {
    return withCookies(
      NextResponse.json(
        { error: 'db_error', reason: 'delete_rule_failed', message: error.message },
        { status: 500 }
      )
    );
  }

  return withCookies(NextResponse.json({ success: true }));
}
