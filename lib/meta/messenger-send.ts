/**
 * Messenger Messaging - Send Logic
 * 
 * Handles sending messages to Messenger threads via Meta Graph API
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logging';
import { META_CONFIG } from './config';

export type MessengerMessageType = 'text' | 'image' | 'video' | 'audio' | 'file';

export interface SendMessengerMessageParams {
  threadId: string;
  recipientId: string;
  message: {
    text?: string;
    attachment?: {
      type: MessengerMessageType;
      payload: {
        url?: string;
        is_reusable?: boolean;
      };
    };
  };
  accessToken: string;
}

export interface MessengerSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
  details?: unknown;
}

/**
 * Send a message to a Messenger thread via Graph API
 */
export async function sendMessengerMessage(
  params: SendMessengerMessageParams
): Promise<MessengerSendResult> {
  const { recipientId, message, accessToken } = params;

  try {
    // Messenger Send API endpoint
    const url = META_CONFIG.getGraphUrl('/me/messages');

    const body: Record<string, unknown> = {
      recipient: { id: recipientId },
      message: {},
      messaging_type: 'RESPONSE', // or 'UPDATE' for proactive messages
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
      logger.error('[Messenger Send] API error', { data, status: response.status });
      return {
        ok: false,
        error: data.error?.message || 'Messenger API request failed',
        details: data.error,
      };
    }

    return {
      ok: true,
      messageId: data.message_id,
    };
  } catch (error) {
    logger.error('[Messenger Send] Unexpected error:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error,
    };
  }
}

/**
 * Send a text message via Messenger (simplified wrapper)
 */
export async function sendMessengerTextMessage(params: {
  supabase: SupabaseClient;
  workspaceId: string;
  threadId: string;
  text: string;
}): Promise<MessengerSendResult> {
  const { supabase, workspaceId, threadId, text } = params;

  try {
    // Get thread details
    const { data: thread, error: threadError } = await supabase
      .from('messenger_threads')
      .select('*, messenger_pages!inner(page_id, access_token)')
      .eq('id', threadId)
      .eq('workspace_id', workspaceId)
      .single();

    if (threadError || !thread) {
      return {
        ok: false,
        error: 'Thread not found or access denied',
      };
    }

    // Validate page structure with type guard
    const page = thread.messenger_pages as unknown;
    if (!page || typeof page !== 'object') {
      return {
        ok: false,
        error: 'Messenger page not connected',
      };
    }
    
    // Type narrowing after validation
    const pageData = page as Record<string, unknown>;
    if (!pageData.access_token || !pageData.page_id) {
      return {
        ok: false,
        error: 'Messenger page missing required credentials',
      };
    }

    // Send message via Graph API
    const result = await sendMessengerMessage({
      threadId: thread.id,
      recipientId: thread.recipient_psid,
      message: { text },
      accessToken: pageData.access_token as string,
    });

    if (!result.ok) {
      return result;
    }

    // Store message in database
    const { error: insertError } = await supabase
      .from('messenger_messages')
      .insert({
        thread_id: threadId,
        messenger_page_id: pageData.id,
        workspace_id: workspaceId,
        message_id: result.messageId,
        direction: 'outbound',
        message_type: 'text',
        text_body: text,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

    if (insertError) {
      logger.error('[Messenger Send] Failed to store message:', insertError);
      // Message sent but not stored - non-fatal
    }

    return result;
  } catch (error) {
    logger.error('[Messenger Send] Unexpected error:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send an image via Messenger
 */
export async function sendMessengerImageMessage(params: {
  supabase: SupabaseClient;
  workspaceId: string;
  threadId: string;
  imageUrl: string;
  isReusable?: boolean;
}): Promise<MessengerSendResult> {
  const { supabase, workspaceId, threadId, imageUrl, isReusable = false } = params;

  try {
    // Get thread details
    const { data: thread, error: threadError } = await supabase
      .from('messenger_threads')
      .select('*, messenger_pages!inner(page_id, access_token)')
      .eq('id', threadId)
      .eq('workspace_id', workspaceId)
      .single();

    if (threadError || !thread) {
      return {
        ok: false,
        error: 'Thread not found or access denied',
      };
    }

    const page = thread.messenger_pages as { id: string; page_id: string; access_token: string } | null;
    if (!page?.access_token) {
      return {
        ok: false,
        error: 'Messenger page not connected',
      };
    }

    // Send image via Graph API
    const result = await sendMessengerMessage({
      threadId: thread.id,
      recipientId: thread.recipient_psid,
      message: {
        attachment: {
          type: 'image',
          payload: {
            url: imageUrl,
            is_reusable: isReusable,
          },
        },
      },
      accessToken: page.access_token,
    });

    if (!result.ok) {
      return result;
    }

    // Store message in database
    const { error: insertError } = await supabase
      .from('messenger_messages')
      .insert({
        thread_id: threadId,
        messenger_page_id: page.id,
        workspace_id: workspaceId,
        message_id: result.messageId,
        direction: 'outbound',
        message_type: 'image',
        media_url: imageUrl,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

    if (insertError) {
      logger.error('[Messenger Send] Failed to store image message:', insertError);
    }

    return result;
  } catch (error) {
    logger.error('[Messenger Send] Image send error:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
