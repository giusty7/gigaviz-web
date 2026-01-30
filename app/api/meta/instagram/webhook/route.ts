// Instagram Webhook Handler
// Processes Instagram Direct Messages via Graph API webhooks

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
    console.log('[Instagram] Webhook verified');
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
      console.error('[Instagram] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const payload = JSON.parse(body);

    // Process each entry
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === 'messages') {
          await handleMessageEvent(change.value);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Instagram] Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// Handle incoming message event
async function handleMessageEvent(event: {
  account_id: string;
  messages?: Array<{
    from: { id: string; username?: string };
    mid: string;
    text?: string;
    attachments?: Array<{ type: string; payload?: { url?: string } }>;
  }>;
}) {
  const supabase = supabaseAdmin();

  try {
    // Find Instagram account by instagram_id
    const { data: account } = await supabase
      .from('instagram_accounts')
      .select('id, workspace_id')
      .eq('instagram_id', event.account_id)
      .single();

    if (!account) {
      console.warn('[Instagram] Account not found:', event.account_id);
      return;
    }

    const { workspace_id, id: account_id } = account;

    // Process messages
    for (const message of event.messages || []) {
      const senderId = message.from.id;
      const messageId = message.mid;

      // Check if message already exists
      const { data: existing } = await supabase
        .from('instagram_messages')
        .select('id')
        .eq('workspace_id', workspace_id)
        .eq('message_id', messageId)
        .single();

      if (existing) continue; // Skip duplicates

      // Get or create thread
      const threadId = await getOrCreateThread(
        workspace_id,
        account_id,
        senderId,
        message.from.username
      );

      // Insert message
      const messageData: {
        workspace_id: string;
        thread_id: string;
        account_id: string;
        message_id: string;
        direction: string;
        text_content: string | null;
        payload_json: unknown;
        message_type?: string;
        media_url?: string | null;
        media_type?: string;
      } = {
        workspace_id,
        thread_id: threadId,
        account_id,
        message_id: messageId,
        direction: 'inbound',
        text_content: message.text || null,
        payload_json: message,
      };

      // Handle media attachments
      if (message.attachments && message.attachments.length > 0) {
        const attachment = message.attachments[0];
        messageData.message_type = attachment.type; // image, video, audio
        messageData.media_url = attachment.payload?.url || null;
        messageData.media_type = attachment.type;
      } else {
        messageData.message_type = 'text';
      }

      await supabase.from('instagram_messages').insert(messageData);

      // Update thread last_message
      await supabase
        .from('instagram_threads')
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
        action: 'instagram_message_received',
        meta: {
          thread_id: threadId,
          sender_id: senderId,
        },
      });
    }
  } catch (error) {
    console.error('[Instagram] Error processing message:', error);
    throw error;
  }
}

// Get or create conversation thread
async function getOrCreateThread(
  workspaceId: string,
  accountId: string,
  participantId: string,
  participantUsername?: string
): Promise<string> {
  const supabase = supabaseAdmin();

  // Try to find existing thread
  const { data: existing } = await supabase
    .from('instagram_threads')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('account_id', accountId)
    .eq('participant_id', participantId)
    .single();

  if (existing) return existing.id;

  // Create new thread
  const threadData = {
    workspace_id: workspaceId,
    account_id: accountId,
    thread_id: `ig_thread_${participantId}`,
    participant_id: participantId,
    participant_username: participantUsername || null,
    status: 'open',
    unread_count: 0,
  };

  const { data: thread, error } = await supabase
    .from('instagram_threads')
    .insert(threadData)
    .select('id')
    .single();

  if (error) throw error;

  return thread.id;
}
