// Instagram Webhook Handler
// Processes Instagram Direct Messages via Graph API webhooks

import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { recordAuditEvent } from '@/lib/audit';

const APP_SECRET = process.env.META_APP_SECRET ?? "";
const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN ?? "";

// Verify webhook signature
function verifySignature(payload: string, signature: string, appSecret: string): boolean {
  if (!signature) return false;
  const [alg, hash] = signature.split('=');
  if (alg !== 'sha256') return false;
  if (!/^[a-f0-9]{64}$/i.test(hash ?? "")) return false;

  const expectedHash = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest();

  const provided = Buffer.from(hash, "hex");
  if (provided.length !== expectedHash.length) return false;

  return crypto.timingSafeEqual(provided, expectedHash);
}

async function updateThreadUnreadCount(
  supabase: ReturnType<typeof supabaseAdmin>,
  threadId: string,
  preview: string
) {
  const nowIso = new Date().toISOString();
  const { data: existing } = await supabase
    .from("instagram_threads")
    .select("unread_count")
    .eq("id", threadId)
    .maybeSingle();

  const currentUnread = Number(existing?.unread_count ?? 0);
  const nextUnread = Number.isFinite(currentUnread) && currentUnread >= 0
    ? currentUnread + 1
    : 1;

  await supabase
    .from("instagram_threads")
    .update({
      last_message_at: nowIso,
      last_message_preview: preview,
      unread_count: nextUnread,
      updated_at: nowIso,
    })
    .eq("id", threadId);
}

// GET: Webhook verification
export async function GET(request: NextRequest) {
  if (!VERIFY_TOKEN) {
    logger.error("[Instagram] META_WEBHOOK_VERIFY_TOKEN missing");
    return NextResponse.json({ error: "Webhook verify token not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    logger.info('[Instagram] Webhook verified');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// POST: Process webhook events
export async function POST(request: NextRequest) {
  try {
    if (!APP_SECRET) {
      logger.error("[Instagram] META_APP_SECRET missing");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256') || '';

    // Verify signature
    if (!verifySignature(body, signature, APP_SECRET)) {
      logger.error('[Instagram] Invalid signature');
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
    logger.error('[Instagram] Webhook error:', error);
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
    // Find Instagram account by instagram_business_account_id
    const { data: account } = await supabase
      .from('instagram_accounts')
      .select('id, workspace_id')
      .eq('instagram_business_account_id', event.account_id)
      .single();

    if (!account) {
      logger.warn('[Instagram] Account not found:', event.account_id);
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
        instagram_account_id: string;
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
        instagram_account_id: account_id,
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
      await updateThreadUnreadCount(
        supabase,
        threadId,
        message.text?.substring(0, 100) || '[Media]'
      );

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
    logger.error('[Instagram] Error processing message:', error);
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
    .eq('instagram_account_id', accountId)
    .eq('participant_id', participantId)
    .single();

  if (existing) return existing.id;

  // Create new thread
  const threadData = {
    workspace_id: workspaceId,
    instagram_account_id: accountId,
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
