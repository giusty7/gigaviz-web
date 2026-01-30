// Instagram Send Message API
// POST /api/meta/instagram/threads/[threadId]/send - Send message via Instagram API

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/app-route';
import { recordAuditEvent } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { supabase, withCookies } = createSupabaseRouteClient(request);
    const { threadId } = await params;
    const body = await request.json();
    const { text } = body;

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return withCookies(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    if (!text?.trim()) {
      return withCookies(
        NextResponse.json({ error: 'text is required' }, { status: 400 })
      );
    }

    // Get thread info
    const { data: thread, error: threadError } = await supabase
      .from('instagram_threads')
      .select(
        `
        *,
        instagram_accounts(instagram_id, access_token)
      `
      )
      .eq('id', threadId)
      .single();

    if (threadError || !thread) {
      return withCookies(NextResponse.json({ error: 'Thread not found' }, { status: 404 }));
    }

    const account = thread.instagram_accounts as unknown as { instagram_id: string; access_token: string } | null;
    if (!account?.access_token) {
      return withCookies(
        NextResponse.json(
          { error: 'Instagram account not connected' },
          { status: 400 }
        )
      );
    }

    // Send via Instagram Graph API
    const graphUrl = `https://graph.facebook.com/v21.0/${account.instagram_id}/messages`;
    const response = await fetch(graphUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: {
          id: thread.participant_id,
        },
        message: {
          text,
        },
        access_token: account.access_token,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Instagram] Send error:', result);
      throw new Error(result.error?.message || 'Failed to send message');
    }

    // Store message in database
    const messageData = {
      workspace_id: thread.workspace_id,
      thread_id: threadId,
      account_id: thread.account_id,
      message_id: result.message_id || `ig_${Date.now()}`,
      direction: 'outbound',
      message_type: 'text',
      text_content: text,
      status: 'sent',
      payload_json: result,
    };

    const { data: message, error: messageError } = await supabase
      .from('instagram_messages')
      .insert(messageData)
      .select()
      .single();

    if (messageError) throw messageError;

    // Update thread
    await supabase
      .from('instagram_threads')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: text.substring(0, 100),
        updated_at: new Date().toISOString(),
      })
      .eq('id', threadId);

    // Audit log
    await recordAuditEvent({
      workspaceId: thread.workspace_id,
      actorUserId: user.id,
      action: 'instagram_message_sent',
      meta: {
        thread_id: threadId,
        text_length: text.length,
      },
    });

    return withCookies(
      NextResponse.json({
        success: true,
        message,
      })
    );
  } catch (error) {
    console.error('[Instagram] Send message error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const { withCookies } = createSupabaseRouteClient(request);
    return withCookies(
      NextResponse.json({ error: message }, { status: 500 })
    );
  }
}
