import "server-only";
import {
  getFunctionByName,
  updateFunctionCallStatus,
  validateParameters,
  type FunctionCall,
  type FunctionDefinition,
} from "./functions";

/**
 * Execute a function call
 */
export async function executeFunction(
  callId: string,
  workspaceId: string
): Promise<{ success: boolean; result?: Record<string, unknown>; error?: string }> {
  try {
    // Get call details
    const { getFunctionCall } = await import("./functions");
    const call = await getFunctionCall(callId);
    if (!call) {
      return { success: false, error: "Function call not found" };
    }

    // Get function definition
    const func = await getFunctionByName(call.functionName);
    if (!func) {
      return { success: false, error: "Function not found" };
    }

    // Validate parameters
    const validation = validateParameters(func, call.parameters);
    if (!validation.valid) {
      await updateFunctionCallStatus(callId, "failed", undefined, validation.errors.join(", "));
      return { success: false, error: validation.errors.join(", ") };
    }

    // Update status to executing
    await updateFunctionCallStatus(callId, "executing");

    // Execute based on handler type
    let result: Record<string, unknown> | undefined;
    switch (func.handlerType) {
      case "api":
        result = await executeApiHandler(func, call, workspaceId);
        break;
      case "direct":
        result = await executeDirectHandler(func, call, workspaceId);
        break;
      case "webhook":
        result = await executeWebhookHandler(func, call, workspaceId);
        break;
      default:
        throw new Error(`Unknown handler type: ${func.handlerType}`);
    }

    // Update status to completed
    await updateFunctionCallStatus(callId, "completed", result);

    return { success: true, result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Execution failed";
    await updateFunctionCallStatus(callId, "failed", undefined, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Execute API handler (call internal API endpoint)
 */
async function executeApiHandler(
  func: FunctionDefinition,
  call: FunctionCall,
  workspaceId: string
): Promise<Record<string, unknown>> {
  if (!func.handlerEndpoint) {
    throw new Error("No handler endpoint configured");
  }

  // Map function name to actual API implementation
  switch (func.functionName) {
    case "send_whatsapp_message":
      return await sendWhatsAppMessage(call.parameters, workspaceId);
    
    case "create_contact":
      return await createContact(call.parameters, workspaceId);
    
    case "update_contact":
      return await updateContact(call.parameters, workspaceId);
    
    case "tag_contact":
      return await tagContact(call.parameters, workspaceId);
    
    case "tag_conversation":
      return await tagConversation(call.parameters, workspaceId);
    
    case "search_contacts":
      return await searchContacts(call.parameters, workspaceId);
    
    default:
      throw new Error(`No implementation for function: ${func.functionName}`);
  }
}

/**
 * Execute direct handler (run code directly)
 */
async function executeDirectHandler(
  func: FunctionDefinition,
  call: FunctionCall,
  workspaceId: string
): Promise<Record<string, unknown>> {
  switch (func.functionName) {
    case "search_knowledge":
      const { searchKnowledge } = await import("./rag");
      const results = await searchKnowledge(
        workspaceId,
        call.parameters.query as string,
        {
          maxResults: (call.parameters.maxResults as number) ?? 5,
        }
      );
      return { results };
    
    case "create_note":
      // Store note in conversation metadata or separate table
      return {
        success: true,
        note: {
          title: call.parameters.title,
          content: call.parameters.content,
          tags: call.parameters.tags ?? [],
        },
      };
    
    default:
      throw new Error(`No direct implementation for: ${func.functionName}`);
  }
}

/**
 * Execute webhook handler
 */
async function executeWebhookHandler(
  func: FunctionDefinition,
  call: FunctionCall,
  workspaceId: string
): Promise<Record<string, unknown>> {
  if (!func.handlerEndpoint) {
    throw new Error("No webhook endpoint configured");
  }

  // POST to webhook endpoint
  const response = await fetch(func.handlerEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      workspaceId,
      functionName: func.functionName,
      parameters: call.parameters,
    }),
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.statusText}`);
  }

  return await response.json();
}

// =====================================================
// IMPLEMENTATION FUNCTIONS
// =====================================================

async function sendWhatsAppMessage(params: Record<string, unknown>, workspaceId: string) {
  const { supabaseAdmin } = await import("@/lib/supabase/admin");
  const { normalizePhone } = await import("@/lib/meta/wa-contacts-utils");
  const db = supabaseAdmin();

  const phoneInput = String(params.phoneNumber ?? params.phone ?? "").trim();
  const messageText = String(params.message ?? params.text ?? "").trim();

  if (!phoneInput) {
    throw new Error("phoneNumber is required");
  }
  if (!messageText) {
    throw new Error("message is required");
  }

  const toPhone = normalizePhone(phoneInput);
  const now = new Date().toISOString();

  // Resolve active WhatsApp connection for this workspace
  const { data: connection, error: connectionError } = await db
    .from("wa_phone_numbers")
    .select("id, phone_number_id, status")
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (connectionError || !connection) {
    throw new Error("No active WhatsApp number found");
  }
  if (!connection.phone_number_id) {
    throw new Error("Active WhatsApp connection missing phone_number_id");
  }

  // Ensure thread exists so wa_messages/outbox stay consistent with worker expectations
  const { data: thread, error: threadError } = await db
    .from("wa_threads")
    .upsert(
      {
        workspace_id: workspaceId,
        phone_number_id: connection.phone_number_id,
        contact_wa_id: toPhone,
        status: "open",
        connection_id: connection.id,
      },
      { onConflict: "workspace_id,phone_number_id,contact_wa_id" }
    )
    .select("id")
    .single();

  if (threadError || !thread) {
    throw new Error(threadError?.message ?? "Failed to upsert WhatsApp thread");
  }

  // Create wa_messages row first (required by outbox worker for status updates)
  const { data: queuedMessage, error: queuedMessageError } = await db
    .from("wa_messages")
    .insert({
      workspace_id: workspaceId,
      thread_id: thread.id,
      phone_number_id: connection.phone_number_id,
      connection_id: connection.id,
      wa_message_id: null,
      direction: "outbound",
      type: "text",
      msg_type: "text",
      status: "queued",
      status_at: now,
      status_updated_at: now,
      delivered_at: null,
      read_at: null,
      failed_at: null,
      error_code: null,
      error_message: null,
      text_body: messageText,
      payload_json: { request: { to: toPhone, text: messageText } },
      wa_timestamp: now,
      sent_at: null,
      created_at: now,
      from_wa_id: connection.phone_number_id,
      to_wa_id: toPhone,
    })
    .select("id")
    .single();

  if (queuedMessageError || !queuedMessage) {
    throw new Error(queuedMessageError?.message ?? "Failed to create outbound message");
  }

  const idempotencyKey = `helper-send:${workspaceId}:${thread.id}:${Date.now()}`;

  // Create outbox message
  const { data: outboxItem, error: outboxError } = await db
    .from("outbox_messages")
    .insert({
      workspace_id: workspaceId,
      thread_id: thread.id,
      connection_id: connection.id,
      to_phone: toPhone,
      message_type: "text",
      payload: {
        message_id: queuedMessage.id,
        text: messageText,
        connection_id: connection.id,
        phone_number_id: connection.phone_number_id,
      },
      idempotency_key: idempotencyKey,
      status: "queued",
      attempts: 0,
      next_run_at: now,
      next_attempt_at: now,
    })
    .select()
    .single();

  if (outboxError) throw outboxError;

  return {
    success: true,
    messageId: queuedMessage.id,
    outboxId: outboxItem.id,
    threadId: thread.id,
    status: "queued",
  };
}

async function createContact(params: Record<string, unknown>, workspaceId: string) {
  const { supabaseAdmin } = await import("@/lib/supabase/admin");
  const { normalizePhone } = await import("@/lib/meta/wa-contacts-utils");
  const db = supabaseAdmin();

  const phoneInput = String(params.phoneNumber ?? params.phone ?? "").trim();
  if (!phoneInput) {
    throw new Error("phoneNumber is required");
  }

  const normalizedPhone = normalizePhone(phoneInput);
  const waId = normalizedPhone;
  const displayName = String(params.name ?? params.display_name ?? "").trim() || null;
  const tags = Array.isArray(params.tags)
    ? params.tags.filter((tag): tag is string => typeof tag === "string")
    : [];

  const customFields: Record<string, unknown> = {};
  if (params.custom_fields && typeof params.custom_fields === "object") {
    Object.assign(customFields, params.custom_fields as Record<string, unknown>);
  }
  if (typeof params.email === "string" && params.email.trim().length > 0) {
    customFields.email = params.email.trim();
  }

  const { data: contact, error } = await db
    .from("wa_contacts")
    .upsert(
      {
        workspace_id: workspaceId,
        wa_id: waId,
        normalized_phone: normalizedPhone,
        display_name: displayName,
        tags,
        custom_fields: customFields,
        source: "helper_tool",
      },
      { onConflict: "workspace_id,wa_id" }
    )
    .select()
    .single();

  if (error) throw error;

  return {
    success: true,
    contactId: contact.id,
    contact,
  };
}

async function updateContact(params: Record<string, unknown>, workspaceId: string) {
  const { supabaseAdmin } = await import("@/lib/supabase/admin");
  const { normalizePhone } = await import("@/lib/meta/wa-contacts-utils");
  const db = supabaseAdmin();

  const contactId = String(params.contactId ?? "").trim();
  if (!contactId) {
    throw new Error("contactId is required");
  }

  const updates: Record<string, unknown> = {};
  if (typeof params.name === "string") updates.display_name = params.name;
  if (typeof params.display_name === "string") updates.display_name = params.display_name;

  if (params.tags && Array.isArray(params.tags)) {
    updates.tags = params.tags.filter((tag): tag is string => typeof tag === "string");
  }

  const phoneInput = String(params.phoneNumber ?? params.phone ?? "").trim();
  if (phoneInput) {
    const normalizedPhone = normalizePhone(phoneInput);
    updates.normalized_phone = normalizedPhone;
    updates.wa_id = normalizedPhone;
  }

  if (typeof params.email === "string" || (params.custom_fields && typeof params.custom_fields === "object")) {
    const { data: existingContact } = await db
      .from("wa_contacts")
      .select("custom_fields")
      .eq("id", contactId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    const customFields: Record<string, unknown> =
      existingContact?.custom_fields && typeof existingContact.custom_fields === "object"
        ? { ...(existingContact.custom_fields as Record<string, unknown>) }
        : {};

    if (typeof params.email === "string" && params.email.trim().length > 0) {
      customFields.email = params.email.trim();
    }
    if (params.custom_fields && typeof params.custom_fields === "object") {
      Object.assign(customFields, params.custom_fields as Record<string, unknown>);
    }
    updates.custom_fields = customFields;
  }

  if (Object.keys(updates).length === 0) {
    throw new Error("No valid fields to update");
  }

  const { data: contact, error } = await db
    .from("wa_contacts")
    .update(updates)
    .eq("id", contactId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error) throw error;

  return {
    success: true,
    contact,
  };
}

async function tagContact(params: Record<string, unknown>, workspaceId: string) {
  const { supabaseAdmin } = await import("@/lib/supabase/admin");
  const db = supabaseAdmin();

  // Get current contact
  const { data: contact } = await db
    .from("wa_contacts")
    .select("tags")
    .eq("id", params.contactId as string)
    .eq("workspace_id", workspaceId)
    .single();

  if (!contact) throw new Error("Contact not found");

  let tags = Array.isArray(contact.tags)
    ? contact.tags.filter((tag: unknown): tag is string => typeof tag === "string")
    : [];
  
  // Add tags
  if (params.addTags) {
    tags = [...new Set([...tags, ...(params.addTags as string[])])];
  }
  
  // Remove tags
  if (params.removeTags) {
    const toRemove = new Set(params.removeTags as string[]);
    tags = tags.filter((t: string) => !toRemove.has(t));
  }

  // Update
  const { error } = await db
    .from("wa_contacts")
    .update({ tags })
    .eq("id", params.contactId as string)
    .eq("workspace_id", workspaceId);

  if (error) throw error;

  return {
    success: true,
    tags,
  };
}

async function tagConversation(params: Record<string, unknown>, workspaceId: string) {
  const { supabaseAdmin } = await import("@/lib/supabase/admin");
  const db = supabaseAdmin();

  const { error } = await db
    .from("wa_threads")
    .update({ tags: params.tags as string[] })
    .eq("id", params.threadId as string)
    .eq("workspace_id", workspaceId);

  if (error) throw error;

  return {
    success: true,
    tags: params.tags,
  };
}

async function searchContacts(params: Record<string, unknown>, workspaceId: string) {
  const { supabaseAdmin } = await import("@/lib/supabase/admin");
  const db = supabaseAdmin();

  let query = db
    .from("wa_contacts")
    .select("*")
    .eq("workspace_id", workspaceId);

  const search = typeof params.query === "string" ? params.query.trim() : "";
  if (search) {
    const searchTerm = `%${search}%`;
    query = query.or(`display_name.ilike.${searchTerm},normalized_phone.ilike.${searchTerm}`);
  }

  if (params.tags && Array.isArray(params.tags)) {
    const tags = params.tags.filter((tag): tag is string => typeof tag === "string");
    if (tags.length > 0) {
      query = query.contains("tags", tags);
    }
  }

  const limitRaw = Number(params.limit ?? 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 10;
  query = query.limit(limit);

  const { data: contacts } = await query;

  return {
    success: true,
    contacts: contacts ?? [],
    count: contacts?.length ?? 0,
  };
}
