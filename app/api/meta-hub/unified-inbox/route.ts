/**
 * Unified Inbox API - Fetch threads from all channels
 * GET /api/meta-hub/unified-inbox?workspaceId=<uuid>&status=<status>&channel=<channel>
 * 
 * Returns threads from WhatsApp, Instagram, and Messenger in unified format
 */

import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from 'next/server';
import { guardWorkspace } from '@/lib/auth/guard';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';
import { withErrorHandler } from "@/lib/api/with-error-handler";

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

export const GET = withErrorHandler(async (request: NextRequest) => {
  try {
    const guard = await guardWorkspace(request);
    if (!guard.ok) return guard.response;
    const { workspaceId, withCookies } = guard;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const channel = searchParams.get('channel') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const parsed = QuerySchema.safeParse({ workspaceId, status, channel, limit, offset });
    if (!parsed.success) {
      return withCookies(NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.issues },
        { status: 400 }
      ));
    }

    // Use admin client for cross-table thread queries (wa_threads, instagram_threads, messenger_threads)
    const adminDb = supabaseAdmin();

    const threads: UnifiedThread[] = [];

    // Fetch WhatsApp threads
    if (channel === 'all' || channel === 'whatsapp') {
      const { data: waThreads } = await adminDb
        .from('wa_threads')
        .select('id, workspace_id, phone_number_id, contact_wa_id, contact_name, last_message_preview, last_message_at, status, unread_count, assigned_to, created_at')
        .eq('workspace_id', workspaceId)
        .order('last_message_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (waThreads) {
        // Filter by status (treat null as 'open')
        const filteredThreads = status && status !== 'all'
          ? waThreads.filter(t => (t.status ?? 'open') === status)
          : waThreads;
          
        threads.push(
          ...filteredThreads.map((t) => ({
            id: t.id,
            channel: 'whatsapp' as const,
            workspace_id: t.workspace_id,
            status: t.status ?? 'open',
            contact_name: t.contact_name || t.contact_wa_id || 'Unknown',
            contact_identifier: t.contact_wa_id,
            last_message_at: t.last_message_at,
            last_message_preview: t.last_message_preview,
            unread_count: t.unread_count || 0,
            assigned_to: t.assigned_to,
            tags: [],
            created_at: t.created_at,
          }))
        );
      }
    }

    // Fetch Instagram threads (use admin client to bypass RLS)
    if (channel === 'all' || channel === 'instagram') {
      const { data: igThreads } = await adminDb
        .from('instagram_threads')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('last_message_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (igThreads) {
        // Filter by status (treat null as 'open')
        const filteredThreads = status && status !== 'all'
          ? igThreads.filter(t => (t.status ?? 'open') === status)
          : igThreads;
          
        threads.push(
          ...filteredThreads.map((t) => ({
            id: t.id,
            channel: 'instagram' as const,
            workspace_id: t.workspace_id,
            status: t.status ?? 'open',
            contact_name: t.participant_name || t.participant_username || 'Unknown',
            contact_identifier: t.participant_username || t.recipient_ig_id,
            last_message_at: t.last_message_at,
            last_message_preview: t.last_message_preview,
            unread_count: t.unread_count || 0,
            assigned_to: t.assigned_to,
            tags: [],
            created_at: t.created_at,
          }))
        );
      }
    }

    // Fetch Messenger threads (use admin client to bypass RLS)
    if (channel === 'all' || channel === 'messenger') {
      const { data: messengerThreads } = await adminDb
        .from('messenger_threads')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('last_message_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (messengerThreads) {
        // Filter by status (treat null as 'open')
        const filteredThreads = status && status !== 'all'
          ? messengerThreads.filter(t => (t.status ?? 'open') === status)
          : messengerThreads;
          
        threads.push(
          ...filteredThreads.map((t) => ({
            id: t.id,
            channel: 'messenger' as const,
            workspace_id: t.workspace_id,
            status: t.status ?? 'open',
            contact_name: t.participant_name || 'Unknown',
            contact_identifier: t.recipient_psid,
            last_message_at: t.last_message_at,
            last_message_preview: t.last_message_preview,
            unread_count: t.unread_count || 0,
            assigned_to: t.assigned_to,
            tags: [],
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

    return withCookies(NextResponse.json({
      threads: paginatedThreads,
      total: threads.length,
      limit,
      offset,
    }));

  } catch (err) {
    logger.error('[Unified Inbox API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
