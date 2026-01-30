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
  const db = supabaseAdmin();

  // Get phone number ID
  const { data: phoneNumbers } = await db
    .from("wa_phone_numbers")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true)
    .limit(1);

  if (!phoneNumbers || phoneNumbers.length === 0) {
    throw new Error("No active WhatsApp number found");
  }

  // Create outbox message
  const { data: message, error } = await db
    .from("wa_outbox")
    .insert({
      workspace_id: workspaceId,
      connection_id: phoneNumbers[0].id,
      recipient_phone: params.phoneNumber as string,
      message_type: "text",
      text_content: params.message as string,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;

  return {
    success: true,
    messageId: message.id,
    status: "queued",
  };
}

async function createContact(params: Record<string, unknown>, workspaceId: string) {
  const { supabaseAdmin } = await import("@/lib/supabase/admin");
  const db = supabaseAdmin();

  const { data: contact, error } = await db
    .from("wa_contacts")
    .insert({
      workspace_id: workspaceId,
      phone: params.phoneNumber as string,
      name: params.name as string | null,
      email: params.email as string | null,
      tags: (params.tags as string[]) ?? [],
    })
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
  const db = supabaseAdmin();

  const updates: Record<string, unknown> = {};
  if (params.name) updates.name = params.name;
  if (params.email) updates.email = params.email;
  if (params.tags) updates.tags = params.tags;

  const { data: contact, error } = await db
    .from("wa_contacts")
    .update(updates)
    .eq("id", params.contactId as string)
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

  let tags = contact.tags ?? [];
  
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

  if (params.query) {
    const searchTerm = `%${params.query}%`;
    query = query.or(`name.ilike.${searchTerm},phone.ilike.${searchTerm}`);
  }

  if (params.tags && Array.isArray(params.tags)) {
    query = query.contains("tags", params.tags);
  }

  if (params.limit) {
    query = query.limit(params.limit as number);
  } else {
    query = query.limit(10);
  }

  const { data: contacts } = await query;

  return {
    success: true,
    contacts: contacts ?? [],
    count: contacts?.length ?? 0,
  };
}
