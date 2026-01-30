// Facebook Messenger Webhook Handler
// Processes Messenger messages via Graph API webhooks

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { recordAuditEvent } from '@/lib/audit';

const APP_SECRET = process.env.META_APP_SECRET!;
const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN!;

// Verify webhook signature
function verifySignature(payload: string, signature: string): boolean {
  if (!signature) return false;
  const [alg, hash] = signature.split('=');
  if (alg !== 'sha256') return false;

  const expectedHash = crypto
    .createHmac('sha256', APP_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(expectedHash)
  );
}

// GET: Webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Messenger] Webhook verified');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// POST: Process webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256') || '';

    // Verify signature
    if (!verifySignature(body, signature)) {
      console.error('[Messenger] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const payload = JSON.parse(body);

    // Process each entry
    for (const entry of payload.entry || []) {
      const pageId = entry.id;

      for (const messaging of entry.messaging || []) {
        if (messaging.message) {
          await handleMessageEvent(pageId, messaging);
        } else if (messaging.delivery) {
          await handleDeliveryEvent(pageId, messaging);
        } else if (messaging.read) {
          await handleReadEvent(pageId, messaging);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Messenger] Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// Handle incoming message event
async function handleMessageEvent(
  pageId: string,
  messaging: {
    sender: { id: string };
    message: {
      mid: string;
      text?: string;
      quick_reply?: { payload?: string };
      attachments?: Array<{ type: string; payload?: { url?: string } }>;
    };
  }
) {
  const supabase = supabaseAdmin();

  try {
    // Find Messenger page by page_id
    const { data: page } = await supabase
      .from('messenger_pages')
      .select('id, workspace_id')
      .eq('page_id', pageId)
      .single();

    if (!page) {
      console.warn('[Messenger] Page not found:', pageId);
      return;
    }

    const { workspace_id, id: page_id } = page;
    const senderId = messaging.sender.id;
    const message = messaging.message;
    const messageId = message.mid;

    // Check if message already exists
    const { data: existing } = await supabase
      .from('messenger_messages')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('message_id', messageId)
      .single();

    if (existing) return; // Skip duplicates

    // Get or create thread
    const threadId = await getOrCreateThread(
      workspace_id,
      page_id,
      senderId
    );

    // Insert message
    const messageData: {
      workspace_id: string;
      thread_id: string;
      page_id: string;
      message_id: string;
      direction: string;
      text_content: string | null;
      quick_reply_payload: string | null;
      status: string;
      payload_json: unknown;
      message_type?: string;
      media_url?: string | null;
      media_type?: string;
    } = {
      workspace_id,
      thread_id: threadId,
      page_id,
      message_id: messageId,
      direction: 'inbound',
      text_content: message.text || null,
      quick_reply_payload: message.quick_reply?.payload || null,
      status: 'sent',
      payload_json: message,
    };

    // Handle media attachments
    if (message.attachments && message.attachments.length > 0) {
      const attachment = message.attachments[0];
      messageData.message_type = attachment.type; // image, video, audio, file
      messageData.media_url = attachment.payload?.url || null;
      messageData.media_type = attachment.type;
    } else {
      messageData.message_type = 'text';
    }

    await supabase.from('messenger_messages').insert(messageData);

    // Update thread last_message
    await supabase
      .from('messenger_threads')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: message.text?.substring(0, 100) || '[Media]',
        unread_count: supabase.rpc('increment', { x: 1 }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', threadId);

    // Log audit
    await recordAuditEvent({
      workspaceId: workspace_id,
      action: 'messenger_message_received',
      meta: {
        thread_id: threadId,
        sender_id: senderId,
      },
    });
  } catch (error) {
    console.error('[Messenger] Error processing message:', error);
    throw error;
  }
}

// Handle delivery confirmation
async function handleDeliveryEvent(
  pageId: string,
  messaging: { delivery: { mids?: string[] } }
) {
  const supabase = supabaseAdmin();

  try {
    const { data: page } = await supabase
      .from('messenger_pages')
      .select('workspace_id')
      .eq('page_id', pageId)
      .single();

    if (!page) return;

    // Update message status
    const mids = messaging.delivery.mids || [];
    for (const mid of mids) {
      await supabase
        .from('messenger_messages')
        .update({
          status: 'delivered',
          status_updated_at: new Date().toISOString(),
        })
        .eq('workspace_id', page.workspace_id)
        .eq('message_id', mid);
    }
  } catch (error) {
    console.error('[Messenger] Error processing delivery:', error);
  }
}

// Handle read confirmation
async function handleReadEvent(
  pageId: string,
  messaging: { sender: { id: string } }
) {
  const supabase = supabaseAdmin();

  try {
    const { data: page } = await supabase
      .from('messenger_pages')
      .select('id, workspace_id')
      .eq('page_id', pageId)
      .single();

    if (!page) return;

    const senderId = messaging.sender.id;

    // Find thread
    const { data: thread } = await supabase
      .from('messenger_threads')
      .select('id')
      .eq('workspace_id', page.workspace_id)
      .eq('page_id', page.id)
      .eq('participant_id', senderId)
      .single();

    if (!thread) return;

    // Update thread unread count
    await supabase
      .from('messenger_threads')
      .update({ unread_count: 0 })
      .eq('id', thread.id);

    // Mark messages as read
    await supabase
      .from('messenger_messages')
      .update({
        status: 'read',
        status_updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', page.workspace_id)
      .eq('thread_id', thread.id)
      .eq('direction', 'outbound')
      .neq('status', 'read');
  } catch (error) {
    console.error('[Messenger] Error processing read:', error);
  }
}

// Get or create conversation thread
async function getOrCreateThread(
  workspaceId: string,
  pageId: string,
  participantId: string
): Promise<string> {
  const supabase = supabaseAdmin();

  // Try to find existing thread
  const { data: existing } = await supabase
    .from('messenger_threads')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('page_id', pageId)
    .eq('participant_id', participantId)
    .single();

  if (existing) return existing.id;

  // Create new thread
  const threadData = {
    workspace_id: workspaceId,
    page_id: pageId,
    thread_id: `messenger_${participantId}`,
    participant_id: participantId,
    status: 'open',
    unread_count: 0,
  };

  const { data: thread, error } = await supabase
    .from('messenger_threads')
    .insert(threadData)
    .select('id')
    .single();

  if (error) throw error;

  return thread.id;
}
