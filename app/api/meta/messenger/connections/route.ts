// Messenger Connections API
// GET /api/meta/messenger/connections - List connections
// POST /api/meta/messenger/connections - Create connection

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseRouteClient } from '@/lib/supabase/app-route';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { resolveWorkspaceId } from '@/lib/workspaces/resolve';
import { requireWorkspaceMember, requireWorkspaceRole } from '@/lib/auth/guard';
import { recordAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logging';
import { withErrorHandler } from "@/lib/api/with-error-handler";

const createConnectionSchema = z.object({
  workspace_id: z.string().uuid(),
  page_id: z.string().min(1),
  page_name: z.string().min(1),
  page_picture_url: z.string().url().optional().nullable(),
  access_token: z.string().min(1),
  permissions: z.array(z.string()).optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  try {
    const { supabase, withCookies } = createSupabaseRouteClient(request);
    const { searchParams } = new URL(request.url);

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return withCookies(NextResponse.json({ connections: [] }));
    }

    const workspaceIdOrSlug = searchParams.get('workspace_id');
    if (!workspaceIdOrSlug) {
      return withCookies(NextResponse.json(
        { error: 'workspace_id required' },
        { status: 400 }
      ));
    }

    const workspaceId = await resolveWorkspaceId(supabase, workspaceIdOrSlug);
    if (!workspaceId) {
      return withCookies(NextResponse.json({ connections: [] }));
    }

    // Verify workspace membership (use admin client to bypass RLS on membership table)
    const membership = await requireWorkspaceMember(user.id, workspaceId);
    if (!membership.ok) {
      return withCookies(NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      ));
    }

    const db = supabaseAdmin();
    const { data: pages, error } = await db
      .from('messenger_pages')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[Messenger] Error fetching connections:', { error });
      throw error;
    }

    // Map to connection format and mask access tokens
    const connections = pages?.map(pg => ({
      id: pg.id,
      page_id: pg.page_id,
      page_name: pg.page_name,
      page_picture_url: pg.profile_picture_url,
      is_active: pg.status === 'active',
      access_token: pg.access_token ? '***MASKED***' : null,
      created_at: pg.created_at,
    }));

    return withCookies(NextResponse.json({ connections: connections || [] }));
  } catch (error) {
    logger.error('[Messenger] Error in GET connections:', { error });
    const message = error instanceof Error ? error.message : 'Unknown error';
    const { withCookies } = createSupabaseRouteClient(request);
    return withCookies(NextResponse.json(
      { error: message },
      { status: 500 }
    ));
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  try {
    const { supabase, withCookies } = createSupabaseRouteClient(request);

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return withCookies(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const body = await request.json();
    const validated = createConnectionSchema.parse(body);

    // Verify workspace membership with edit permission (use admin client to bypass RLS)
    const membership = await requireWorkspaceMember(user.id, validated.workspace_id);
    if (!membership.ok || !requireWorkspaceRole(membership.role, ['owner', 'admin'])) {
      return withCookies(NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      ));
    }

    const db = supabaseAdmin();

    // Check for existing page with same page_id
    const { data: existing } = await db
      .from('messenger_pages')
      .select('id')
      .eq('workspace_id', validated.workspace_id)
      .eq('page_id', validated.page_id)
      .single();

    if (existing) {
      // Update existing page
      const { data: updated, error } = await db
        .from('messenger_pages')
        .update({
          page_name: validated.page_name,
          profile_picture_url: validated.page_picture_url,
          access_token: validated.access_token,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;

      await recordAuditEvent({
        workspaceId: validated.workspace_id,
        actorUserId: user.id,
        action: 'messenger_connection_updated',
        meta: { connectionId: existing.id, pageName: validated.page_name },
      });

      return withCookies(NextResponse.json({ connection: updated, updated: true }));
    }

    // Create new page
    const { data: connection, error } = await db
      .from('messenger_pages')
      .insert({
        workspace_id: validated.workspace_id,
        page_id: validated.page_id,
        page_name: validated.page_name,
        profile_picture_url: validated.page_picture_url,
        access_token: validated.access_token,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    await recordAuditEvent({
      workspaceId: validated.workspace_id,
      actorUserId: user.id,
      action: 'messenger_connection_created',
      meta: { connectionId: connection.id, pageName: validated.page_name },
    });

    logger.info('[Messenger] Connection created:', {
      workspaceId: validated.workspace_id,
      pageName: validated.page_name,
    });

    return withCookies(NextResponse.json({ connection, created: true }));
  } catch (error) {
    logger.error('[Messenger] Error in POST connections:', { error });
    
    if (error instanceof z.ZodError) {
      const { withCookies } = createSupabaseRouteClient(request);
      return withCookies(NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      ));
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    const { withCookies } = createSupabaseRouteClient(request);
    return withCookies(NextResponse.json(
      { error: message },
      { status: 500 }
    ));
  }
});
