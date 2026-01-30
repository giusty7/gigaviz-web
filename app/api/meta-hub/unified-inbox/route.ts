/**
 * Unified Inbox API - Fetch threads from all channels
 * GET /api/meta-hub/unified-inbox?workspaceId=<uuid>&status=<status>&channel=<channel>
 * 
 * Returns threads from WhatsApp, Instagram, and Messenger in unified format
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/app-route';
import { z } from 'zod';

const QuerySchema = z.object({
  workspaceId: z.string().uuid(),
  status: z.enum(['open', 'pending', 'resolved', 'all']).optional(),
  channel: z.enum(['whatsapp', 'instagram', 'messenger', 'all']).default('all'),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export type UnifiedThread = {
  id: string;
  channel: 'whatsapp' | 'instagram' | 'messenger';
  workspace_id: string;
  status: string;
  contact_name: string;
  contact_identifier: string; // phone / ig_username / psid
  last_message_at: string;
  last_message_preview?: string;
  unread_count: number;
  assigned_to?: string;
  tags: string[];
  created_at: string;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const status = searchParams.get('status') || undefined;
    const channel = searchParams.get('channel') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const parsed = QuerySchema.safeParse({ workspaceId, status, channel, limit, offset });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

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
      .select('workspace_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userData.user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      );
    }

    const threads: UnifiedThread[] = [];

    // Fetch WhatsApp threads
    if (channel === 'all' || channel === 'whatsapp') {
      const waQuery = supabase
        .from('wa_threads')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('last_message_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status && status !== 'all') {
        waQuery.eq('status', status);
      }

      const { data: waThreads } = await waQuery;

      if (waThreads) {
        threads.push(
          ...waThreads.map((t) => ({
            id: t.id,
            channel: 'whatsapp' as const,
            workspace_id: t.workspace_id,
            status: t.status,
            contact_name: t.contact_name || t.contact_phone,
            contact_identifier: t.contact_phone,
            last_message_at: t.last_message_at,
            last_message_preview: t.last_message_preview,
            unread_count: t.unread_count || 0,
            assigned_to: t.assigned_to,
            tags: t.tags || [],
            created_at: t.created_at,
          }))
        );
      }
    }

    // Fetch Instagram threads
    if (channel === 'all' || channel === 'instagram') {
      const igQuery = supabase
        .from('instagram_threads')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('last_message_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status && status !== 'all') {
        igQuery.eq('status', status);
      }

      const { data: igThreads } = await igQuery;

      if (igThreads) {
        threads.push(
          ...igThreads.map((t) => ({
            id: t.id,
            channel: 'instagram' as const,
            workspace_id: t.workspace_id,
            status: t.status,
            contact_name: t.participant_name || t.participant_username,
            contact_identifier: t.participant_username || t.recipient_ig_id,
            last_message_at: t.last_message_at,
            last_message_preview: t.last_message_preview,
            unread_count: t.unread_count || 0,
            assigned_to: t.assigned_to,
            tags: t.tags || [],
            created_at: t.created_at,
          }))
        );
      }
    }

    // Fetch Messenger threads
    if (channel === 'all' || channel === 'messenger') {
      const messengerQuery = supabase
        .from('messenger_threads')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('last_message_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status && status !== 'all') {
        messengerQuery.eq('status', status);
      }

      const { data: messengerThreads } = await messengerQuery;

      if (messengerThreads) {
        threads.push(
          ...messengerThreads.map((t) => ({
            id: t.id,
            channel: 'messenger' as const,
            workspace_id: t.workspace_id,
            status: t.status,
            contact_name: t.participant_name || 'Unknown',
            contact_identifier: t.recipient_psid,
            last_message_at: t.last_message_at,
            last_message_preview: t.last_message_preview,
            unread_count: t.unread_count || 0,
            assigned_to: t.assigned_to,
            tags: t.tags || [],
            created_at: t.created_at,
          }))
        );
      }
    }

    // Sort all threads by last_message_at
    threads.sort((a, b) => {
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });

    // Apply limit
    const paginatedThreads = threads.slice(0, limit);

    return NextResponse.json({
      threads: paginatedThreads,
      total: threads.length,
      limit,
      offset,
    });

  } catch (err) {
    console.error('[Unified Inbox API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
