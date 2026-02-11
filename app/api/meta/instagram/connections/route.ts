// Instagram Connections API
// GET /api/meta/instagram/connections - List connections
// POST /api/meta/instagram/connections - Create connection

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardWorkspace, requireWorkspaceRole } from '@/lib/auth/guard';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { recordAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logging';

const createConnectionSchema = z.object({
  instagram_user_id: z.string().min(1),
  instagram_username: z.string().min(1),
  profile_picture_url: z.string().url().optional().nullable(),
  access_token: z.string().min(1),
  page_id: z.string().optional().nullable(),
  permissions: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  const guard = await guardWorkspace(request);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies } = guard;

  try {
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
    return withCookies(NextResponse.json({ error: message }, { status: 500 }));
  }
}

export async function POST(request: NextRequest) {
  const guard = await guardWorkspace(request);
  if (!guard.ok) return guard.response;
  const { workspaceId, user, role, withCookies } = guard;

  if (!requireWorkspaceRole(role, ['owner', 'admin'])) {
    return withCookies(NextResponse.json({ error: 'Admin access required' }, { status: 403 }));
  }

  try {
    const validated = createConnectionSchema.parse(guard.body);

    const db = supabaseAdmin();

    // Check for existing connection with same instagram_user_id
    const { data: existing } = await db
      .from('instagram_connections')
      .select('id')
      .eq('workspace_id', workspaceId)
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
        workspaceId,
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
        workspace_id: workspaceId,
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
      workspaceId,
      actorUserId: user.id,
      action: 'instagram_connection_created',
      meta: { connectionId: connection.id, username: validated.instagram_username },
    });

    logger.info('[Instagram] Connection created:', {
      workspaceId,
      username: validated.instagram_username,
    });

    return withCookies(NextResponse.json({ connection, created: true }));
  } catch (error) {
    logger.error('[Instagram] Error in POST connections:', { error });

    if (error instanceof z.ZodError) {
      return withCookies(NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      ));
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return withCookies(NextResponse.json({ error: message }, { status: 500 }));
  }
}
