/**
 * Instagram Direct Messaging - Send Logic
 * 
 * Handles sending messages to Instagram threads via Meta Graph API
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logging';
import { META_CONFIG } from './config';

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
    const url = META_CONFIG.getGraphUrl('/me/messages');

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
      logger.error('[Instagram Send] API error', { data, status: response.status });
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
    logger.error('[Instagram Send] Unexpected error:', error);
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

    // Validate account structure with type guard
    const account = thread.instagram_accounts as unknown;
    if (!account || typeof account !== 'object') {
      return {
        ok: false,
        error: 'Instagram account not connected',
      };
    }
    
    // Type narrowing after validation
    const accountData = account as Record<string, unknown>;
    if (!accountData.access_token || !accountData.ig_user_id) {
      return {
        ok: false,
        error: 'Instagram account missing required credentials',
      };
    }

    // Send message via Graph API
    const result = await sendInstagramMessage({
      threadId: thread.id,
      recipientIgId: thread.recipient_ig_id,
      message: { text },
      accessToken: accountData.access_token as string,
    });

    if (!result.ok) {
      return result;
    }

    // Store message in database
    const { error: insertError } = await supabase
      .from('instagram_messages')
      .insert({
        thread_id: threadId,
        instagram_account_id: accountData.id,
        workspace_id: workspaceId,
        ig_message_id: result.messageId,
        direction: 'outbound',
        message_type: 'text',
        text_body: text,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

    if (insertError) {
      logger.error('[Instagram Send] Failed to store message:', insertError);
      // Message sent but not stored - non-fatal
    }

    return result;
  } catch (error) {
    logger.error('[Instagram Send] Unexpected error:', error);
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

    // Validate account structure with type guard
    const account = thread.instagram_accounts as unknown;
    if (!account || typeof account !== 'object') {
      return {
        ok: false,
        error: 'Instagram account not connected',
      };
    }
    
    // Type narrowing after validation
    const accountData = account as Record<string, unknown>;
    if (!accountData.access_token || !accountData.ig_user_id) {
      return {
        ok: false,
        error: 'Instagram account missing required credentials',
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
      accessToken: accountData.access_token as string,
    });

    if (!result.ok) {
      return result;
    }

    // Store message in database
    const { error: insertError } = await supabase
      .from('instagram_messages')
      .insert({
        thread_id: threadId,
        instagram_account_id: accountData.id,
        workspace_id: workspaceId,
        ig_message_id: result.messageId,
        direction: 'outbound',
        message_type: 'image',
        media_url: imageUrl,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

    if (insertError) {
      logger.error('[Instagram Send] Failed to store image message:', insertError);
    }

    return result;
  } catch (error) {
    logger.error('[Instagram Send] Image send error:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
