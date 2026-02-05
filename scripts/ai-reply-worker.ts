/**
 * AI Reply Worker — Polls for new inbound WhatsApp messages and triggers AI auto-replies.
 *
 * This worker runs independently of the Next.js server and handles AI replies
 * even when webhooks go to production while development runs locally.
 *
 * Usage: npx tsx scripts/ai-reply-worker.ts
 * Or:    npm run worker:ai
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  dotenv.config({ path: ".env" });
}

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// ============================================================================
// CONFIG
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

const POLL_INTERVAL_MS = 5_000; // Check every 5 seconds
const LOOKBACK_SECONDS = 120;   // Look at messages from last 2 minutes

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("[ai-worker] ❌ Missing SUPABASE env vars");
  process.exit(1);
}
if (!OPENAI_API_KEY) {
  console.error("[ai-worker] ❌ Missing OPENAI_API_KEY");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Track processed message IDs to avoid re-processing within same session
const processedMessages = new Set<string>();

// ============================================================================
// MAIN LOOP
// ============================================================================

let running = true;

process.on("SIGINT", () => {
  console.log("[ai-worker] Shutting down...");
  running = false;
});

process.on("SIGTERM", () => {
  console.log("[ai-worker] Shutting down...");
  running = false;
});

async function main() {
  console.log("[ai-worker] 🤖 AI Reply Worker starting...");
  console.log(`[ai-worker] Poll interval: ${POLL_INTERVAL_MS}ms, Lookback: ${LOOKBACK_SECONDS}s`);
  console.log("[ai-worker] Listening for new inbound messages...\n");

  while (running) {
    try {
      await checkAndReply();
    } catch (err) {
      console.error("[ai-worker] ❌ Error in check loop:", err instanceof Error ? err.message : err);
    }
    await sleep(POLL_INTERVAL_MS);
  }
}

async function checkAndReply() {
  // 1. Find all workspaces with AI reply enabled
  const { data: settings, error: settingsErr } = await db
    .from("ai_reply_settings")
    .select("workspace_id, ai_model, temperature, max_tokens, system_prompt, fallback_message, use_knowledge_base, knowledge_confidence_threshold, cooldown_seconds, max_messages_per_day, max_messages_per_thread, handoff_keywords, handoff_message, active_hours_enabled, active_hours_start, active_hours_end, active_timezone")
    .eq("enabled", true);

  if (settingsErr || !settings || settings.length === 0) {
    return; // No workspaces with AI reply enabled
  }

  for (const ws of settings) {
    await processWorkspace(ws);
  }
}

async function processWorkspace(settings: any) {
  const workspaceId = settings.workspace_id;
  const lookbackTime = new Date(Date.now() - LOOKBACK_SECONDS * 1000).toISOString();

  // Find recent inbound text messages
  const { data: messages, error: msgErr } = await db
    .from("wa_messages")
    .select("id, thread_id, text_body, from_wa_id, created_at")
    .eq("workspace_id", workspaceId)
    .eq("direction", "inbound")
    .eq("type", "text")
    .gte("created_at", lookbackTime)
    .order("created_at", { ascending: true })
    .limit(20);

  if (msgErr || !messages || messages.length === 0) return;

  for (const msg of messages) {
    if (!msg.text_body || !msg.from_wa_id || !msg.thread_id) continue;
    if (processedMessages.has(msg.id)) continue; // Already processed this session

    // Check for existing AI reply log (dedup across sessions)
    const { data: existingLog } = await db
      .from("ai_reply_logs")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("thread_id", msg.thread_id)
      .gte("created_at", new Date(new Date(msg.created_at).getTime() - 10_000).toISOString())
      .limit(1)
      .maybeSingle();

    if (existingLog) {
      processedMessages.add(msg.id);
      continue;
    }

    // Check for any outbound message after this inbound message (someone already replied)
    const { data: existingReply } = await db
      .from("wa_messages")
      .select("id")
      .eq("thread_id", msg.thread_id)
      .eq("direction", "outbound")
      .gte("created_at", msg.created_at)
      .limit(1)
      .maybeSingle();

    if (existingReply) {
      processedMessages.add(msg.id);
      continue;
    }

    // Get thread details
    const { data: thread } = await db
      .from("wa_threads")
      .select("id, connection_id, phone_number_id, contact_name")
      .eq("id", msg.thread_id)
      .single();

    if (!thread) {
      processedMessages.add(msg.id);
      continue;
    }

    const connectionId = thread.connection_id ?? thread.phone_number_id;
    if (!connectionId) {
      processedMessages.add(msg.id);
      continue;
    }

    // Check active hours
    if (settings.active_hours_enabled) {
      const tz = settings.active_timezone || "Asia/Jakarta";
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz });
      const currentTime = formatter.format(now);
      if (settings.active_hours_start && settings.active_hours_end) {
        if (currentTime < settings.active_hours_start || currentTime > settings.active_hours_end) {
          processedMessages.add(msg.id);
          continue; // Outside active hours
        }
      }
    }

    // Check handoff keywords
    const handoffKeywords = settings.handoff_keywords || [];
    const msgLower = msg.text_body.toLowerCase();
    const isHandoff = handoffKeywords.some((kw: string) => msgLower.includes(kw.toLowerCase()));

    if (isHandoff) {
      console.log(`[ai-worker] 🤝 Handoff keyword detected in: "${msg.text_body.substring(0, 30)}"`);
      // Queue handoff message instead
      if (settings.handoff_message) {
        await sendReply(workspaceId, msg.thread_id, connectionId, msg.from_wa_id, settings.handoff_message, thread.contact_name);
        await logReply(workspaceId, msg.thread_id, msg.text_body, settings.handoff_message, "handoff", settings.ai_model, 0);
      }
      processedMessages.add(msg.id);
      continue;
    }

    // Check daily limit
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: dailyCount } = await db
      .from("ai_reply_logs")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", "sent")
      .gte("created_at", todayStart.toISOString());

    if (dailyCount && dailyCount >= (settings.max_messages_per_day || 100)) {
      processedMessages.add(msg.id);
      continue;
    }

    // Generate AI reply!
    console.log(`[ai-worker] 📩 New message from ${msg.from_wa_id}: "${msg.text_body.substring(0, 50)}"`);

    try {
      const model = settings.ai_model || "gpt-4o-mini";
      const systemPrompt = settings.system_prompt || `You are a helpful customer service assistant for Gigaviz Platform. Reply professionally and helpfully in the same language as the user. Keep replies concise.`;

      // Get conversation context (last 5 messages from this thread)
      const { data: contextMsgs } = await db
        .from("wa_messages")
        .select("direction, text_body, created_at")
        .eq("thread_id", msg.thread_id)
        .order("created_at", { ascending: false })
        .limit(6);

      const contextMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
      ];

      // Add recent messages as context (oldest first)
      if (contextMsgs) {
        for (const cm of contextMsgs.reverse()) {
          if (!cm.text_body) continue;
          contextMessages.push({
            role: cm.direction === "inbound" ? "user" : "assistant",
            content: cm.text_body,
          });
        }
      }

      // If the current message isn't already in context, add it
      const lastMsg = contextMessages[contextMessages.length - 1];
      if (lastMsg?.role !== "user" || lastMsg?.content !== msg.text_body) {
        contextMessages.push({ role: "user", content: msg.text_body });
      }

      console.log(`[ai-worker] 🤖 Calling OpenAI (${model})...`);
      const completion = await openai.chat.completions.create({
        model,
        messages: contextMessages,
        temperature: settings.temperature ?? 0.7,
        max_tokens: settings.max_tokens ?? 500,
      });

      const aiReply = completion.choices[0]?.message?.content;
      const tokensUsed = completion.usage?.total_tokens || 0;

      if (!aiReply) {
        console.error("[ai-worker] ❌ No response from OpenAI");
        await logReply(workspaceId, msg.thread_id, msg.text_body, null, "failed", model, 0, "No response from OpenAI");
        processedMessages.add(msg.id);
        continue;
      }

      console.log(`[ai-worker] ✅ AI response (${tokensUsed} tokens): "${aiReply.substring(0, 80)}..."`);

      // Send the reply
      await sendReply(workspaceId, msg.thread_id, connectionId, msg.from_wa_id, aiReply, thread.contact_name);

      // Log success
      await logReply(workspaceId, msg.thread_id, msg.text_body, aiReply, "sent", model, tokensUsed);

      console.log(`[ai-worker] 📤 Reply queued for delivery to ${msg.from_wa_id}`);
    } catch (err: any) {
      console.error(`[ai-worker] ❌ AI reply failed:`, err.message);
      await logReply(workspaceId, msg.thread_id, msg.text_body, null, "failed", settings.ai_model, 0, err.message);
    }

    processedMessages.add(msg.id);
  }
}

// ============================================================================
// SEND MESSAGE
// ============================================================================

async function sendReply(
  workspaceId: string,
  threadId: string,
  connectionId: string,
  toPhone: string,
  message: string,
  contactName?: string | null
) {
  const now = new Date().toISOString();

  // Get thread's phone_number_id
  const { data: thread } = await db
    .from("wa_threads")
    .select("phone_number_id")
    .eq("id", threadId)
    .single();

  const phoneNumberId = thread?.phone_number_id || connectionId;

  // Insert outbound message record
  const { data: msgData, error: msgError } = await db
    .from("wa_messages")
    .insert({
      workspace_id: workspaceId,
      thread_id: threadId,
      phone_number_id: phoneNumberId,
      connection_id: connectionId,
      direction: "outbound",
      type: "text",
      msg_type: "text",
      text_body: message,
      status: "queued",
      status_at: now,
      status_updated_at: now,
      sent_at: now,
      created_at: now,
      from_wa_id: phoneNumberId,
      to_wa_id: toPhone,
      is_ai_generated: true,
    })
    .select("id")
    .single();

  if (msgError || !msgData) {
    throw new Error(`Failed to create wa_message: ${msgError?.message}`);
  }

  // Queue to outbox for the outbox worker to send
  const idempotencyKey = `ai-reply-${threadId}-${Date.now()}`;
  const { error: outboxError } = await db
    .from("outbox_messages")
    .insert({
      workspace_id: workspaceId,
      thread_id: threadId,
      connection_id: connectionId,
      to_phone: toPhone,
      message_type: "text",
      payload: {
        message_id: msgData.id,
        text: message,
      },
      idempotency_key: idempotencyKey,
      status: "queued",
      attempts: 0,
      next_run_at: now,
      next_attempt_at: now,
    });

  if (outboxError) {
    throw new Error(`Failed to queue outbox: ${outboxError.message}`);
  }

  // Update thread with last message info
  await db
    .from("wa_threads")
    .update({
      last_message_at: now,
      last_message_preview: message.substring(0, 100),
      updated_at: now,
    })
    .eq("id", threadId);
}

// ============================================================================
// LOGGING
// ============================================================================

async function logReply(
  workspaceId: string,
  threadId: string,
  inboundMessage: string,
  aiResponse: string | null,
  status: string,
  model: string | null,
  tokensUsed: number,
  errorMessage?: string
) {
  // Map status: "sent" → "success" to match DB CHECK constraint
  const dbStatus = status === "sent" ? "success" : status;

  await db.from("ai_reply_logs").insert({
    workspace_id: workspaceId,
    thread_id: threadId,
    input_message: inboundMessage,     // DB column is input_message
    ai_response: aiResponse,
    model_used: model || "gpt-4o-mini", // DB column is model_used
    status: dbStatus,
    tokens_used: tokensUsed,
    error_message: errorMessage || null,
    response_time_ms: 0,
  });
}

// ============================================================================
// UTILS
// ============================================================================

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Clean up processed set periodically to prevent memory leak
setInterval(() => {
  if (processedMessages.size > 10000) {
    processedMessages.clear();
  }
}, 60_000 * 10);

main().catch((err) => {
  console.error("[ai-worker] Fatal error:", err);
  process.exit(1);
});
