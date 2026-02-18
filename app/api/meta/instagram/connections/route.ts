// Instagram Connections API
// GET /api/meta/instagram/connections - List connections
// POST /api/meta/instagram/connections - Create connection

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardWorkspace, requireWorkspaceRole } from '@/lib/auth/guard';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { recordAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logging';
import { withErrorHandler } from "@/lib/api/with-error-handler";

const createConnectionSchema = z.object({
  instagram_business_account_id: z.string().min(1),
  username: z.string().min(1),
  profile_picture_url: z.string().url().optional().nullable(),
  access_token: z.string().min(1),
  page_id: z.string().optional().nullable(),
  permissions: z.array(z.string()).optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const guard = await guardWorkspace(request);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies } = guard;

  try {
    const db = supabaseAdmin();
    const { data: accounts, error } = await db
      .from('instagram_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[Instagram] Error fetching connections:', { error });
      throw error;
    }

    // Map to connection format and mask access tokens
    const connections = accounts?.map(acct => ({
      id: acct.id,
      instagram_user_id: acct.instagram_business_account_id,
      instagram_username: acct.username,
      profile_picture_url: acct.profile_picture_url,
      is_active: acct.status === 'active',
      access_token: acct.access_token ? '***MASKED***' : null,
      created_at: acct.created_at,
    }));

    return withCookies(NextResponse.json({ connections: connections || [] }));
  } catch (error) {
    logger.error('[Instagram] Error in GET connections:', { error });
    const message = error instanceof Error ? error.message : 'Unknown error';
    return withCookies(NextResponse.json({ error: message }, { status: 500 }));
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const guard = await guardWorkspace(request);
  if (!guard.ok) return guard.response;
  const { workspaceId, user, role, withCookies } = guard;

  if (!requireWorkspaceRole(role, ['owner', 'admin'])) {
    return withCookies(NextResponse.json({ error: 'Admin access required' }, { status: 403 }));
  }

  try {
    const validated = createConnectionSchema.parse(guard.body);

    const db = supabaseAdmin();

    // Check for existing account with same instagram_business_account_id
    const { data: existing } = await db
      .from('instagram_accounts')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('instagram_business_account_id', validated.instagram_business_account_id)
      .single();

    if (existing) {
      // Update existing account
      const { data: updated, error } = await db
        .from('instagram_accounts')
        .update({
          username: validated.username,
          profile_picture_url: validated.profile_picture_url,
          access_token: validated.access_token,
          status: 'active',
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
        meta: { connectionId: existing.id, username: validated.username },
      });

      return withCookies(NextResponse.json({ connection: updated, updated: true }));
    }

    // Create new account
    const { data: connection, error } = await db
      .from('instagram_accounts')
      .insert({
        workspace_id: workspaceId,
        instagram_business_account_id: validated.instagram_business_account_id,
        username: validated.username,
        profile_picture_url: validated.profile_picture_url,
        access_token: validated.access_token,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    await recordAuditEvent({
      workspaceId,
      actorUserId: user.id,
      action: 'instagram_connection_created',
      meta: { connectionId: connection.id, username: validated.username },
    });

    logger.info('[Instagram] Connection created:', {
      workspaceId,
      username: validated.username,
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
});
