/**
 * Instagram Direct Messaging - Send Logic
 * 
 * Handles sending messages to Instagram threads via Meta Graph API
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type InstagramMessageType = 'text' | 'image' | 'video' | 'audio' | 'file';

export interface SendInstagramMessageParams {
  threadId: string;
  recipientIgId: string;
  message: {
    text?: string;
    attachment?: {
      type: InstagramMessageType;
      payload: {
        url?: string;
        is_reusable?: boolean;
      };
    };
  };
  accessToken: string;
}

export interface InstagramSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
  details?: unknown;
}

/**
 * Send a text message to an Instagram thread
 */
export async function sendInstagramMessage(
  params: SendInstagramMessageParams
): Promise<InstagramSendResult> {
  const { recipientIgId, message, accessToken } = params;

  try {
    // Instagram Messaging API endpoint
    const url = `https://graph.facebook.com/v21.0/me/messages`;

    const body: Record<string, unknown> = {
      recipient: { id: recipientIgId },
      message: {},
    };

    // Add text message
    if (message.text) {
      body.message = { text: message.text };
    }

    // Add attachment (image/video/audio/file)
    if (message.attachment) {
      body.message = {
        attachment: message.attachment,
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Instagram Send] API error:', data);
      return {
        ok: false,
        error: data.error?.message || 'Instagram API request failed',
        details: data.error,
      };
    }

    return {
      ok: true,
      messageId: data.message_id,
    };
  } catch (error) {
    console.error('[Instagram Send] Unexpected error:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error,
    };
  }
}

/**
 * Send a text message via Instagram (simplified wrapper)
 */
export async function sendInstagramTextMessage(params: {
  supabase: SupabaseClient;
  workspaceId: string;
  threadId: string;
  text: string;
}): Promise<InstagramSendResult> {
  const { supabase, workspaceId, threadId, text } = params;

  try {
    // Get thread details
    const { data: thread, error: threadError } = await supabase
      .from('instagram_threads')
      .select('*, instagram_accounts!inner(ig_user_id, access_token)')
      .eq('id', threadId)
      .eq('workspace_id', workspaceId)
      .single();

    if (threadError || !thread) {
      return {
        ok: false,
        error: 'Thread not found or access denied',
      };
    }

    const account = thread.instagram_accounts as { id: string; ig_user_id: string; access_token: string } | null;
    if (!account?.access_token) {
      return {
        ok: false,
        error: 'Instagram account not connected or access token missing',
      };
    }

    // Send message via Graph API
    const result = await sendInstagramMessage({
      threadId: thread.id,
      recipientIgId: thread.recipient_ig_id,
      message: { text },
      accessToken: account.access_token,
    });

    if (!result.ok) {
      return result;
    }

    // Store message in database
    const { error: insertError } = await supabase
      .from('instagram_messages')
      .insert({
        thread_id: threadId,
        instagram_account_id: account.id,
        workspace_id: workspaceId,
        ig_message_id: result.messageId,
        direction: 'outbound',
        message_type: 'text',
        text_body: text,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('[Instagram Send] Failed to store message:', insertError);
      // Message sent but not stored - non-fatal
    }

    return result;
  } catch (error) {
    console.error('[Instagram Send] Unexpected error:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send an image via Instagram
 */
export async function sendInstagramImageMessage(params: {
  supabase: SupabaseClient;
  workspaceId: string;
  threadId: string;
  imageUrl: string;
  isReusable?: boolean;
}): Promise<InstagramSendResult> {
  const { supabase, workspaceId, threadId, imageUrl, isReusable = false } = params;

  try {
    // Get thread details
    const { data: thread, error: threadError } = await supabase
      .from('instagram_threads')
      .select('*, instagram_accounts!inner(ig_user_id, access_token)')
      .eq('id', threadId)
      .eq('workspace_id', workspaceId)
      .single();

    if (threadError || !thread) {
      return {
        ok: false,
        error: 'Thread not found or access denied',
      };
    }

    const account = thread.instagram_accounts as { id: string; ig_user_id: string; access_token: string } | null;
    if (!account?.access_token) {
      return {
        ok: false,
        error: 'Instagram account not connected',
      };
    }

    // Send image via Graph API
    const result = await sendInstagramMessage({
      threadId: thread.id,
      recipientIgId: thread.recipient_ig_id,
      message: {
        attachment: {
          type: 'image',
          payload: {
            url: imageUrl,
            is_reusable: isReusable,
          },
        },
      },
      accessToken: account.access_token,
    });

    if (!result.ok) {
      return result;
    }

    // Store message in database
    const { error: insertError } = await supabase
      .from('instagram_messages')
      .insert({
        thread_id: threadId,
        instagram_account_id: account.id,
        workspace_id: workspaceId,
        ig_message_id: result.messageId,
        direction: 'outbound',
        message_type: 'image',
        media_url: imageUrl,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('[Instagram Send] Failed to store image message:', insertError);
    }

    return result;
  } catch (error) {
    console.error('[Instagram Send] Image send error:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
