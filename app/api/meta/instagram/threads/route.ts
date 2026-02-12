// Instagram Threads API
// GET /api/meta/instagram/threads - List threads

import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/app-route';
import { resolveWorkspaceId } from '@/lib/workspaces/resolve';
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const GET = withErrorHandler(async (request: NextRequest) => {
  try {
    const { supabase, withCookies } = createSupabaseRouteClient(request);
    const { searchParams } = new URL(request.url);

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      // In dev without auth, keep UI usable by returning empty threads
      return withCookies(NextResponse.json({ threads: [] }));
    }

    const workspaceIdOrSlug = searchParams.get('workspace_id');
    if (!workspaceIdOrSlug) {
      return withCookies(NextResponse.json(
        { error: 'workspace_id required' },
        { status: 400 }
      ));
    }

    // Resolve workspace: support both UUID and slug
    const workspaceId = await resolveWorkspaceId(supabase, workspaceIdOrSlug);
    
    if (!workspaceId) {
      // Gracefully return empty list for dev instances without workspace seed
      return withCookies(NextResponse.json({ threads: [] }));
    }

    // Filters
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const assigned_to = searchParams.get('assigned_to');

    let query = supabase
      .from('instagram_threads')
      .select(
        `
        *,
        instagram_thread_tags(tag)
      `
      )
      .eq('workspace_id', workspaceId)
      .order('last_message_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }

    if (search) {
      query = query.or(
        `participant_username.ilike.%${search}%,last_message_preview.ilike.%${search}%`
      );
    }

    const { data: threads, error } = await query;

    if (error) throw error;

    // Transform tags
    const threadsWithTags = threads?.map((thread) => ({
      ...thread,
      tags: thread.instagram_thread_tags?.map((t: { tag: string }) => t.tag) || [],
      instagram_thread_tags: undefined,
    }));

    return withCookies(NextResponse.json({
      threads: threadsWithTags || [],
    }));
  } catch (error) {
    logger.error('[Instagram] Error fetching threads:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const { withCookies } = createSupabaseRouteClient(request);
    return withCookies(NextResponse.json(
      { error: message },
      { status: 500 }
    ));
  }
});
