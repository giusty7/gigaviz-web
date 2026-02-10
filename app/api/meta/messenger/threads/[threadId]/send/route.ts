// Messenger Send Message API
// POST /api/meta/messenger/threads/[threadId]/send - Send message via Messenger API

import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/app-route';
import { recordAuditEvent } from '@/lib/audit';
import { sendMessengerTextMessage, sendMessengerImageMessage } from '@/lib/meta/messenger-send';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { supabase, withCookies } = createSupabaseRouteClient(request);
    const { threadId } = await params;
    const body = await request.json();
    const { text, imageUrl } = body;

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return withCookies(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    if (!text?.trim() && !imageUrl) {
      return withCookies(
        NextResponse.json({ error: 'text or imageUrl is required' }, { status: 400 })
      );
    }

    // Get thread info to verify workspace access
    const { data: thread, error: threadError } = await supabase
      .from('messenger_threads')
      .select('workspace_id')
      .eq('id', threadId)
      .single();

    if (threadError || !thread) {
      return withCookies(NextResponse.json({ error: 'Thread not found' }, { status: 404 }));
    }

    // Verify user has access to workspace
    const { data: membership } = await supabase
      .from('workspace_memberships')
      .select('workspace_id')
      .eq('workspace_id', thread.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return withCookies(
        NextResponse.json(
          { error: 'Access denied to this workspace' },
          { status: 403 }
        )
      );
    }

    // Send message based on type
    let result;
    if (imageUrl) {
      result = await sendMessengerImageMessage({
        supabase,
        workspaceId: thread.workspace_id,
        threadId,
        imageUrl,
      });
    } else {
      result = await sendMessengerTextMessage({
        supabase,
        workspaceId: thread.workspace_id,
        threadId,
        text,
      });
    }

    if (!result.ok) {
      return withCookies(
        NextResponse.json(
          { error: result.error, details: result.details },
          { status: 500 }
        )
      );
    }

    // Audit log
    await recordAuditEvent({
      workspaceId: thread.workspace_id,
      actorUserId: user.id,
      action: 'messenger_message_sent',
      meta: {
        threadId,
        messageId: result.messageId,
        messageType: imageUrl ? 'image' : 'text',
      },
    });

    return withCookies(
      NextResponse.json({
        success: true,
        messageId: result.messageId,
      })
    );
  } catch (error) {
    logger.error('[Messenger] Send message error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const { withCookies } = createSupabaseRouteClient(request);
    return withCookies(
      NextResponse.json({ error: message }, { status: 500 })
    );
  }
}
