// Instagram Connections API
// GET /api/meta/instagram/connections - List connections
// POST /api/meta/instagram/connections - Create connection

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseRouteClient } from '@/lib/supabase/app-route';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { resolveWorkspaceId } from '@/lib/workspaces/resolve';
import { requireWorkspaceMember, requireWorkspaceRole } from '@/lib/auth/guard';
import { recordAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logging';

const createConnectionSchema = z.object({
  workspace_id: z.string().uuid(),
  instagram_user_id: z.string().min(1),
  instagram_username: z.string().min(1),
  profile_picture_url: z.string().url().optional().nullable(),
  access_token: z.string().min(1),
  page_id: z.string().optional().nullable(), // Associated Facebook Page
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

    // Verify workspace membership (use admin client to bypass RLS on membership table)
    const membership = await requireWorkspaceMember(user.id, workspaceId);
    if (!membership.ok) {
      return withCookies(NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      ));
    }

    const db = supabaseAdmin();
    const { data: connections, error } = await db
      .from('instagram_connections')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[Instagram] Error fetching connections:', { error });
      throw error;
    }

    // Mask access tokens for security
    const safeConnections = connections?.map(conn => ({
      ...conn,
      access_token: conn.access_token ? '***MASKED***' : null,
    }));

    return withCookies(NextResponse.json({ connections: safeConnections || [] }));
  } catch (error) {
    logger.error('[Instagram] Error in GET connections:', { error });
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

    // Verify workspace membership with edit permission (use admin client to bypass RLS)
    const membership = await requireWorkspaceMember(user.id, validated.workspace_id);
    if (!membership.ok || !requireWorkspaceRole(membership.role, ['owner', 'admin'])) {
      return withCookies(NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      ));
    }

    const db = supabaseAdmin();

    // Check for existing connection with same instagram_user_id
    const { data: existing } = await db
      .from('instagram_connections')
      .select('id')
      .eq('workspace_id', validated.workspace_id)
      .eq('instagram_user_id', validated.instagram_user_id)
      .single();

    if (existing) {
      // Update existing connection
      const { data: updated, error } = await db
        .from('instagram_connections')
        .update({
          instagram_username: validated.instagram_username,
          profile_picture_url: validated.profile_picture_url,
          access_token: validated.access_token,
          page_id: validated.page_id,
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
        action: 'instagram_connection_updated',
        meta: { connectionId: existing.id, username: validated.instagram_username },
      });

      return withCookies(NextResponse.json({ connection: updated, updated: true }));
    }

    // Create new connection
    const { data: connection, error } = await db
      .from('instagram_connections')
      .insert({
        workspace_id: validated.workspace_id,
        instagram_user_id: validated.instagram_user_id,
        instagram_username: validated.instagram_username,
        profile_picture_url: validated.profile_picture_url,
        access_token: validated.access_token,
        page_id: validated.page_id,
        permissions: validated.permissions,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    await recordAuditEvent({
      workspaceId: validated.workspace_id,
      actorUserId: user.id,
      action: 'instagram_connection_created',
      meta: { connectionId: connection.id, username: validated.instagram_username },
    });

    logger.info('[Instagram] Connection created:', {
      workspaceId: validated.workspace_id,
      username: validated.instagram_username,
    });

    return withCookies(NextResponse.json({ connection, created: true }));
  } catch (error) {
    logger.error('[Instagram] Error in POST connections:', { error });
    
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
