// Messenger Connections API
// GET /api/meta/messenger/connections - List connections
// POST /api/meta/messenger/connections - Create connection

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseRouteClient } from '@/lib/supabase/app-route';
import { resolveWorkspaceId } from '@/lib/workspaces/resolve';
import { recordAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logging';

const createConnectionSchema = z.object({
  workspace_id: z.string().uuid(),
  page_id: z.string().min(1),
  page_name: z.string().min(1),
  page_picture_url: z.string().url().optional().nullable(),
  access_token: z.string().min(1),
  permissions: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
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

    // Verify workspace membership
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

    const { data: connections, error } = await supabase
      .from('messenger_connections')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[Messenger] Error fetching connections:', { error });
      throw error;
    }

    // Mask access tokens for security
    const safeConnections = connections?.map(conn => ({
      ...conn,
      access_token: conn.access_token ? '***MASKED***' : null,
    }));

    return withCookies(NextResponse.json({ connections: safeConnections || [] }));
  } catch (error) {
    logger.error('[Messenger] Error in GET connections:', { error });
    const message = error instanceof Error ? error.message : 'Unknown error';
    const { withCookies } = createSupabaseRouteClient(request);
    return withCookies(NextResponse.json(
      { error: message },
      { status: 500 }
    ));
  }
}

export async function POST(request: NextRequest) {
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

    // Verify workspace membership with edit permission
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', validated.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return withCookies(NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      ));
    }

    // Check for existing connection with same page_id
    const { data: existing } = await supabase
      .from('messenger_connections')
      .select('id')
      .eq('workspace_id', validated.workspace_id)
      .eq('page_id', validated.page_id)
      .single();

    if (existing) {
      // Update existing connection
      const { data: updated, error } = await supabase
        .from('messenger_connections')
        .update({
          page_name: validated.page_name,
          page_picture_url: validated.page_picture_url,
          access_token: validated.access_token,
          permissions: validated.permissions,
          is_active: true,
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

    // Create new connection
    const { data: connection, error } = await supabase
      .from('messenger_connections')
      .insert({
        workspace_id: validated.workspace_id,
        page_id: validated.page_id,
        page_name: validated.page_name,
        page_picture_url: validated.page_picture_url,
        access_token: validated.access_token,
        permissions: validated.permissions,
        is_active: true,
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
}
