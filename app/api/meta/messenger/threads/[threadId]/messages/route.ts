// Messenger Thread Messages API
// GET /api/meta/messenger/threads/[threadId]/messages - Get messages for thread

import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/app-route';
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) => {
  try {
    const { supabase, withCookies } = createSupabaseRouteClient(request);
    const { threadId } = await params;

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return withCookies(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    // Get messages
    const { data: messages, error } = await supabase
      .from('messenger_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return withCookies(
      NextResponse.json({
        messages: messages || [],
      })
    );
  } catch (error) {
    logger.error('[Messenger] Error fetching messages:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const { withCookies } = createSupabaseRouteClient(request);
    return withCookies(
      NextResponse.json({ error: message }, { status: 500 })
    );
  }
});
