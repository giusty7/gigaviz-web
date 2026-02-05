/**
 * AI Reply Service
 * 
 * Core service for AI-powered WhatsApp auto-replies
 * Integrates Gigaviz Helper AI with Meta Hub
 */

// Note: This module is server-side only. It's imported by API route handlers
// and webhook processors. Do NOT import from client components.
import OpenAI from "openai";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";

// ============================================================================
// TYPES
// ============================================================================

export interface AIReplySettings {
  id: string;
  workspaceId: string;
  enabled: boolean;
  aiModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string | null;
  greetingMessage: string | null;
  fallbackMessage: string;
  useKnowledgeBase: boolean;
  knowledgeConfidenceThreshold: number;
  activeHoursEnabled: boolean;
  activeHoursStart: string | null;
  activeHoursEnd: string | null;
  activeTimezone: string;
  cooldownSeconds: number;
  maxMessagesPerThread: number | null;
  maxMessagesPerDay: number;
  handoffKeywords: string[];
  handoffMessage: string;
  autoHandoffAfterMessages: number | null;
}

export interface ThreadState {
  id: string;
  workspaceId: string;
  threadId: string;
  aiEnabled: boolean;
  messageCount: number;
  lastAiReplyAt: string | null;
  handedOff: boolean;
  handedOffAt: string | null;
  handedOffReason: string | null;
  contextWindow: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface AIReplyResult {
  success: boolean;
  response?: string;
  action: "replied" | "handoff" | "skipped" | "error";
  reason?: string;
  tokensUsed?: number;
  responseTimeMs?: number;
}

export interface KnowledgeContext {
  content: string;
  source: string;
  confidence: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapSettings(row: Record<string, unknown>): AIReplySettings {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    enabled: row.enabled as boolean,
    aiModel: row.ai_model as string,
    temperature: Number(row.temperature),
    maxTokens: row.max_tokens as number,
    systemPrompt: row.system_prompt as string | null,
    greetingMessage: row.greeting_message as string | null,
    fallbackMessage: row.fallback_message as string,
    useKnowledgeBase: row.use_knowledge_base as boolean,
    knowledgeConfidenceThreshold: Number(row.knowledge_confidence_threshold),
    activeHoursEnabled: row.active_hours_enabled as boolean,
    activeHoursStart: row.active_hours_start as string | null,
    activeHoursEnd: row.active_hours_end as string | null,
    activeTimezone: row.active_timezone as string,
    cooldownSeconds: row.cooldown_seconds as number,
    maxMessagesPerThread: row.max_messages_per_thread as number | null,
    maxMessagesPerDay: row.max_messages_per_day as number,
    handoffKeywords: (row.handoff_keywords as string[]) || [],
    handoffMessage: row.handoff_message as string,
    autoHandoffAfterMessages: row.auto_handoff_after_messages as number | null,
  };
}

function mapThreadState(row: Record<string, unknown>): ThreadState {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    threadId: row.thread_id as string,
    aiEnabled: row.ai_enabled as boolean,
    messageCount: row.message_count as number,
    lastAiReplyAt: row.last_ai_reply_at as string | null,
    handedOff: row.handed_off as boolean,
    handedOffAt: row.handed_off_at as string | null,
    handedOffReason: row.handed_off_reason as string | null,
    contextWindow: (row.context_window as Array<{ role: "user" | "assistant"; content: string }>) || [],
  };
}

// ============================================================================
// SETTINGS MANAGEMENT
// ============================================================================

export async function getAIReplySettings(workspaceId: string): Promise<AIReplySettings | null> {
  const db = supabaseAdmin();
  
  const { data, error } = await db
    .from("ai_reply_settings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapSettings(data);
}

export async function upsertAIReplySettings(
  workspaceId: string,
  settings: Partial<Omit<AIReplySettings, "id" | "workspaceId">>
): Promise<AIReplySettings> {
  const db = supabaseAdmin();

  const dbSettings: Record<string, unknown> = {
    workspace_id: workspaceId,
    updated_at: new Date().toISOString(),
  };

  if (settings.enabled !== undefined) dbSettings.enabled = settings.enabled;
  if (settings.aiModel !== undefined) dbSettings.ai_model = settings.aiModel;
  if (settings.temperature !== undefined) dbSettings.temperature = settings.temperature;
  if (settings.maxTokens !== undefined) dbSettings.max_tokens = settings.maxTokens;
  if (settings.systemPrompt !== undefined) dbSettings.system_prompt = settings.systemPrompt;
  if (settings.greetingMessage !== undefined) dbSettings.greeting_message = settings.greetingMessage;
  if (settings.fallbackMessage !== undefined) dbSettings.fallback_message = settings.fallbackMessage;
  if (settings.useKnowledgeBase !== undefined) dbSettings.use_knowledge_base = settings.useKnowledgeBase;
  if (settings.knowledgeConfidenceThreshold !== undefined) dbSettings.knowledge_confidence_threshold = settings.knowledgeConfidenceThreshold;
  if (settings.activeHoursEnabled !== undefined) dbSettings.active_hours_enabled = settings.activeHoursEnabled;
  if (settings.activeHoursStart !== undefined) dbSettings.active_hours_start = settings.activeHoursStart;
  if (settings.activeHoursEnd !== undefined) dbSettings.active_hours_end = settings.activeHoursEnd;
  if (settings.activeTimezone !== undefined) dbSettings.active_timezone = settings.activeTimezone;
  if (settings.cooldownSeconds !== undefined) dbSettings.cooldown_seconds = settings.cooldownSeconds;
  if (settings.maxMessagesPerThread !== undefined) dbSettings.max_messages_per_thread = settings.maxMessagesPerThread;
  if (settings.maxMessagesPerDay !== undefined) dbSettings.max_messages_per_day = settings.maxMessagesPerDay;
  if (settings.handoffKeywords !== undefined) dbSettings.handoff_keywords = settings.handoffKeywords;
  if (settings.handoffMessage !== undefined) dbSettings.handoff_message = settings.handoffMessage;
  if (settings.autoHandoffAfterMessages !== undefined) dbSettings.auto_handoff_after_messages = settings.autoHandoffAfterMessages;

  const { data, error } = await db
    .from("ai_reply_settings")
    .upsert(dbSettings, { onConflict: "workspace_id" })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert AI settings: ${error.message}`);
  }

  return mapSettings(data);
}

// ============================================================================
// THREAD STATE MANAGEMENT
// ============================================================================

export async function getThreadState(
  workspaceId: string,
  threadId: string
): Promise<ThreadState | null> {
  const db = supabaseAdmin();

  const { data, error } = await db
    .from("ai_reply_thread_state")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("thread_id", threadId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapThreadState(data);
}

export async function upsertThreadState(
  workspaceId: string,
  threadId: string,
  updates: Partial<Omit<ThreadState, "id" | "workspaceId" | "threadId">>
): Promise<ThreadState> {
  const db = supabaseAdmin();

  const dbUpdates: Record<string, unknown> = {
    workspace_id: workspaceId,
    thread_id: threadId,
    updated_at: new Date().toISOString(),
  };

  if (updates.aiEnabled !== undefined) dbUpdates.ai_enabled = updates.aiEnabled;
  if (updates.messageCount !== undefined) dbUpdates.message_count = updates.messageCount;
  if (updates.lastAiReplyAt !== undefined) dbUpdates.last_ai_reply_at = updates.lastAiReplyAt;
  if (updates.handedOff !== undefined) dbUpdates.handed_off = updates.handedOff;
  if (updates.handedOffAt !== undefined) dbUpdates.handed_off_at = updates.handedOffAt;
  if (updates.handedOffReason !== undefined) dbUpdates.handed_off_reason = updates.handedOffReason;
  if (updates.contextWindow !== undefined) dbUpdates.context_window = updates.contextWindow;

  const { data, error } = await db
    .from("ai_reply_thread_state")
    .upsert(dbUpdates, { onConflict: "workspace_id,thread_id" })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert thread state: ${error.message}`);
  }

  return mapThreadState(data);
}

export async function setThreadAIEnabled(
  workspaceId: string,
  threadId: string,
  enabled: boolean
): Promise<void> {
  await upsertThreadState(workspaceId, threadId, { aiEnabled: enabled });
}

export async function handoffThread(
  workspaceId: string,
  threadId: string,
  reason: string
): Promise<void> {
  await upsertThreadState(workspaceId, threadId, {
    handedOff: true,
    handedOffAt: new Date().toISOString(),
    handedOffReason: reason,
  });
}

// ============================================================================
// KNOWLEDGE BASE SEARCH
// ============================================================================

async function searchKnowledgeBase(
  workspaceId: string,
  query: string,
  threshold: number
): Promise<KnowledgeContext[]> {
  try {
    const db = supabaseAdmin();

    // Get OpenAI client for embeddings — use ada-002 to match stored embeddings
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    // Search helper_knowledge_sources directly (sources store embeddings)
    // Using raw SQL via RPC since Supabase JS client doesn't support vector ops
    const { data: sources, error } = await db.rpc("match_knowledge_sources", {
      query_embedding: embeddingStr,
      match_threshold: threshold,
      match_count: 5,
      p_workspace_id: workspaceId,
    });

    if (error) {
      // Fallback: if RPC doesn't exist, do a simple text search
      logger.warn("[ai-reply] Knowledge RPC search failed, trying direct query", { 
        error: error.message, workspaceId 
      });
      
      // Direct fallback: just get all active sources for this workspace
      const { data: fallbackSources } = await db
        .from("helper_knowledge_sources")
        .select("id, title, content_text")
        .eq("workspace_id", workspaceId)
        .eq("is_active", true)
        .not("content_text", "is", null)
        .order("created_at", { ascending: false })
        .limit(5);

      if (fallbackSources && fallbackSources.length > 0) {
        return fallbackSources.map((s: { title: string | null; content_text: string }) => ({
          content: s.content_text,
          source: s.title || "knowledge base",
          confidence: 0.8,
        }));
      }
      return [];
    }

    return (sources || []).map((s: { content_text: string; title: string; similarity: number }) => ({
      content: s.content_text,
      source: s.title || "knowledge base",
      confidence: s.similarity,
    }));
  } catch (err) {
    logger.error("[ai-reply] Knowledge search error", { error: err, workspaceId });
    return [];
  }
}

// ============================================================================
// CHECK CONDITIONS
// ============================================================================

function isWithinActiveHours(settings: AIReplySettings): boolean {
  if (!settings.activeHoursEnabled) {
    return true;
  }

  if (!settings.activeHoursStart || !settings.activeHoursEnd) {
    return true;
  }

  try {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      timeZone: settings.activeTimezone,
    });

    const currentMinutes = timeToMinutes(timeStr);
    const startMinutes = timeToMinutes(settings.activeHoursStart);
    const endMinutes = timeToMinutes(settings.activeHoursEnd);

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight hours (e.g., 22:00 to 06:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  } catch {
    return true;
  }
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function containsHandoffKeyword(message: string, keywords: string[]): boolean {
  const lowerMessage = message.toLowerCase();
  return keywords.some((keyword) => lowerMessage.includes(keyword.toLowerCase()));
}

async function isWithinCooldown(
  settings: AIReplySettings,
  threadState: ThreadState | null
): Promise<boolean> {
  if (settings.cooldownSeconds === 0) {
    return false;
  }

  if (!threadState?.lastAiReplyAt) {
    return false;
  }

  const lastReply = new Date(threadState.lastAiReplyAt);
  const cooldownMs = settings.cooldownSeconds * 1000;
  const timeSinceLastReply = Date.now() - lastReply.getTime();

  return timeSinceLastReply < cooldownMs;
}

async function getDailyReplyCount(workspaceId: string): Promise<number> {
  const db = supabaseAdmin();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count, error } = await db
    .from("ai_reply_logs")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("status", "success")
    .gte("created_at", today.toISOString());

  if (error) {
    return 0;
  }

  return count || 0;
}

// ============================================================================
// MAIN AI REPLY FUNCTION
// ============================================================================

export async function processAIReply(params: {
  workspaceId: string;
  threadId: string;
  incomingMessage: string;
  contactName?: string;
  connectionId: string;
  phoneNumber: string;
  messageId?: string;
}): Promise<AIReplyResult> {
  const { workspaceId, threadId, incomingMessage, contactName, connectionId, phoneNumber, messageId } = params;
  const startTime = Date.now();

  console.log("[AI-REPLY] Starting processAIReply:", { workspaceId, threadId, messagePreview: incomingMessage.substring(0, 30) });

  try {
    // 1. Get AI settings
    const settings = await getAIReplySettings(workspaceId);
    console.log("[AI-REPLY] Settings loaded:", { 
      hasSettings: !!settings, 
      enabled: settings?.enabled,
      model: settings?.aiModel 
    });
    
    if (!settings || !settings.enabled) {
      console.log("[AI-REPLY] SKIPPED: AI reply disabled");
      return { success: true, action: "skipped", reason: "AI reply disabled" };
    }

    // 2. Get/create thread state
    let threadState = await getThreadState(workspaceId, threadId);
    console.log("[AI-REPLY] Thread state:", { hasState: !!threadState, aiEnabled: threadState?.aiEnabled });
    
    if (!threadState) {
      threadState = await upsertThreadState(workspaceId, threadId, {
        aiEnabled: true,
        messageCount: 0,
        contextWindow: [],
      });
      console.log("[AI-REPLY] Created new thread state");
    }

    // 3. Check if AI is enabled for this thread
    if (!threadState.aiEnabled) {
      console.log("[AI-REPLY] SKIPPED: AI disabled for this thread");
      return { success: true, action: "skipped", reason: "AI disabled for thread" };
    }

    // 4. Check if already handed off
    if (threadState.handedOff) {
      console.log("[AI-REPLY] SKIPPED: Thread handed off to human");
      return { success: true, action: "skipped", reason: "Thread handed off to human" };
    }

    // 5. Check active hours
    if (!isWithinActiveHours(settings)) {
      console.log("[AI-REPLY] SKIPPED: Outside active hours");
      return { success: true, action: "skipped", reason: "Outside active hours" };
    }

    // 6. Check cooldown
    if (await isWithinCooldown(settings, threadState)) {
      console.log("[AI-REPLY] SKIPPED: Cooldown active");
      return { success: true, action: "skipped", reason: "Cooldown active" };
    }

    // 7. Check daily limit
    const dailyCount = await getDailyReplyCount(workspaceId);
    console.log("[AI-REPLY] Daily count:", dailyCount, "Max:", settings.maxMessagesPerDay);
    if (dailyCount >= settings.maxMessagesPerDay) {
      console.log("[AI-REPLY] SKIPPED: Daily limit reached");
      return { success: true, action: "skipped", reason: "Daily limit reached" };
    }

    // 8. Check per-thread limit
    if (settings.maxMessagesPerThread && threadState.messageCount >= settings.maxMessagesPerThread) {
      console.log("[AI-REPLY] SKIPPED: Thread message limit reached");
      return { success: true, action: "skipped", reason: "Thread message limit reached" };
    }

    // 9. Check for handoff keywords
    if (containsHandoffKeyword(incomingMessage, settings.handoffKeywords)) {
      await handoffThread(workspaceId, threadId, "User requested human agent");
      await sendHandoffMessage(workspaceId, threadId, connectionId, phoneNumber, settings.handoffMessage);
      await logAIReply(workspaceId, threadId, incomingMessage, null, "handoff", null, null, undefined, messageId);
      return { success: true, action: "handoff", reason: "User requested human agent" };
    }

    // 10. Check auto-handoff after N messages
    if (settings.autoHandoffAfterMessages && threadState.messageCount >= settings.autoHandoffAfterMessages) {
      await handoffThread(workspaceId, threadId, "Auto-handoff after message limit");
      await sendHandoffMessage(workspaceId, threadId, connectionId, phoneNumber, settings.handoffMessage);
      return { success: true, action: "handoff", reason: "Auto-handoff triggered" };
    }

    console.log("[AI-REPLY] All checks passed, generating AI response...");

    // 11. Search knowledge base for context
    let knowledgeContext: KnowledgeContext[] = [];
    if (settings.useKnowledgeBase) {
      knowledgeContext = await searchKnowledgeBase(
        workspaceId,
        incomingMessage,
        settings.knowledgeConfidenceThreshold
      );
      console.log("[AI-REPLY] Knowledge base results:", knowledgeContext.length);
    }

    // 12. Build conversation context
    const contextWindow = [...threadState.contextWindow];
    contextWindow.push({ role: "user", content: incomingMessage });

    // Keep only last 10 messages for context
    const recentContext = contextWindow.slice(-10);

    // 13. Generate AI response
    console.log("[AI-REPLY] Calling OpenAI API with model:", settings.aiModel);

    if (!process.env.OPENAI_API_KEY) {
      console.error("[AI-REPLY] ERROR: OPENAI_API_KEY is not set!");
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = buildSystemPrompt(settings, contactName, knowledgeContext);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...recentContext.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    console.log("[AI-REPLY] Sending request to OpenAI...");
    const completion = await openai.chat.completions.create({
      model: settings.aiModel,
      messages,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    const tokensUsed = completion.usage?.total_tokens || 0;
    console.log("[AI-REPLY] OpenAI response received:", { 
      hasResponse: !!aiResponse, 
      tokensUsed,
      responsePreview: aiResponse?.substring(0, 50)
    });

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    // 14. Send the response via WhatsApp
    console.log("[AI-REPLY] Sending WhatsApp message to:", phoneNumber);
    await sendWhatsAppMessage(workspaceId, threadId, connectionId, phoneNumber, aiResponse);
    console.log("[AI-REPLY] WhatsApp message queued successfully!");

    // 15. Update thread state
    const updatedContext = [...recentContext, { role: "assistant" as const, content: aiResponse }];
    await upsertThreadState(workspaceId, threadId, {
      messageCount: threadState.messageCount + 1,
      lastAiReplyAt: new Date().toISOString(),
      contextWindow: updatedContext.slice(-10),
    });

    // 16. Log the successful reply
    const responseTimeMs = Date.now() - startTime;
    await logAIReply(workspaceId, threadId, incomingMessage, aiResponse, "success", tokensUsed, responseTimeMs, undefined, messageId);

    console.log("[AI-REPLY] SUCCESS! Response time:", responseTimeMs, "ms");
    return {
      success: true,
      action: "replied",
      response: aiResponse,
      tokensUsed,
      responseTimeMs,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    console.error("[AI-REPLY] FAILED:", error);
    logger.error("[ai-reply] Error processing AI reply", { error, workspaceId, threadId });
    
    await logAIReply(workspaceId, threadId, incomingMessage, null, "failed", null, Date.now() - startTime, error, messageId);
    
    return {
      success: false,
      action: "error",
      reason: error,
    };
  }
}

// ============================================================================
// BUILD SYSTEM PROMPT
// ============================================================================

function buildSystemPrompt(
  settings: AIReplySettings,
  contactName?: string,
  knowledgeContext?: KnowledgeContext[]
): string {
  let prompt = settings.systemPrompt || `You are a friendly and professional virtual assistant for Gigaviz. Answer questions clearly and helpfully based on the knowledge provided to you.`;

  if (contactName) {
    prompt += `\n\nCustomer name: ${contactName}`;
  }

  if (knowledgeContext && knowledgeContext.length > 0) {
    prompt += `\n\n=== KNOWLEDGE BASE (USE THIS TO ANSWER) ===\n`;
    prompt += `IMPORTANT: Prioritize the following information when answering. This is your primary source of truth.\n`;
    knowledgeContext.forEach((ctx, idx) => {
      prompt += `\n[Source ${idx + 1}: ${ctx.source}]\n${ctx.content}\n`;
    });
    prompt += `\n=== END KNOWLEDGE BASE ===`;
  }

  prompt += `\n\nGUIDELINES:
- ALWAYS use the Knowledge Base information above to answer questions when relevant
- If the Knowledge Base contains the answer, use it — do NOT say "I don't know" or "I can't access the internet"
- Reply in the same language the customer uses (Indonesian/English)
- Keep answers concise and WhatsApp-friendly (max 2-3 short paragraphs)
- If the question is genuinely outside your knowledge, politely say you'll check with the team
- Never reveal you are ChatGPT or OpenAI — you are the Gigaviz AI assistant
- Use emojis sparingly for a friendly tone`;

  return prompt;
}

// ============================================================================
// SEND MESSAGES
// ============================================================================

async function sendWhatsAppMessage(
  workspaceId: string,
  threadId: string,
  connectionId: string,
  phoneNumber: string,
  message: string
): Promise<void> {
  const db = supabaseAdmin();
  const now = new Date().toISOString();

  // Get thread's phone_number_id for proper message routing
  const { data: thread } = await db
    .from("wa_threads")
    .select("phone_number_id")
    .eq("id", threadId)
    .single();

  const phoneNumberId = thread?.phone_number_id || connectionId;

  // Create message record with proper column structure
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
      to_wa_id: phoneNumber,
      is_ai_generated: true,
    })
    .select("id")
    .single();

  if (msgError || !msgData) {
    throw new Error(`Failed to create message: ${msgError?.message}`);
  }

  // Queue to outbox
  const idempotencyKey = `ai-reply-${threadId}-${Date.now()}`;
  const { error: outboxError } = await db
    .from("outbox_messages")
    .insert({
      workspace_id: workspaceId,
      thread_id: threadId,
      connection_id: connectionId,
      to_phone: phoneNumber,
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
    throw new Error(`Failed to queue message: ${outboxError.message}`);
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

async function sendHandoffMessage(
  workspaceId: string,
  threadId: string,
  connectionId: string,
  phoneNumber: string,
  message: string
): Promise<void> {
  await sendWhatsAppMessage(workspaceId, threadId, connectionId, phoneNumber, message);
}

// ============================================================================
// LOGGING
// ============================================================================

async function logAIReply(
  workspaceId: string,
  threadId: string,
  inputMessage: string,
  aiResponse: string | null,
  status: "pending" | "success" | "failed" | "handoff" | "skipped",
  tokensUsed: number | null,
  responseTimeMs: number | null,
  errorMessage?: string,
  messageId?: string
): Promise<void> {
  const db = supabaseAdmin();

  await db.from("ai_reply_logs").insert({
    workspace_id: workspaceId,
    thread_id: threadId,
    message_id: messageId || null,
    input_message: inputMessage,
    ai_response: aiResponse,
    status,
    tokens_used: tokensUsed,
    response_time_ms: responseTimeMs,
    error_message: errorMessage,
  });
}

// ============================================================================
// ANALYTICS
// ============================================================================

export async function getAIReplyStats(workspaceId: string, days: number = 7): Promise<{
  totalReplies: number;
  successRate: number;
  avgResponseTime: number;
  tokensUsed: number;
  handoffs: number;
}> {
  const db = supabaseAdmin();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await db
    .from("ai_reply_logs")
    .select("status, tokens_used, response_time_ms")
    .eq("workspace_id", workspaceId)
    .gte("created_at", since.toISOString());

  if (error || !data) {
    return {
      totalReplies: 0,
      successRate: 0,
      avgResponseTime: 0,
      tokensUsed: 0,
      handoffs: 0,
    };
  }

  const total = data.length;
  const successful = data.filter((d) => d.status === "success").length;
  const handoffs = data.filter((d) => d.status === "handoff").length;
  const totalTokens = data.reduce((sum, d) => sum + (d.tokens_used || 0), 0);
  const totalTime = data.reduce((sum, d) => sum + (d.response_time_ms || 0), 0);

  return {
    totalReplies: total,
    successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
    avgResponseTime: successful > 0 ? Math.round(totalTime / successful) : 0,
    tokensUsed: totalTokens,
    handoffs,
  };
}
