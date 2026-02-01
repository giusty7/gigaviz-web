import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type FunctionDefinition = {
  id: string;
  functionName: string;
  displayName: string;
  description: string;
  icon?: string;
  productSlug: string;
  category: string;
  parametersSchema: Record<string, unknown>;
  requiredParams: string[];
  requiresConfirmation: boolean;
  handlerType: "api" | "direct" | "webhook";
  handlerEndpoint?: string;
};

export type FunctionCall = {
  id: string;
  workspaceId: string;
  functionId: string;
  functionName: string;
  conversationId?: string;
  messageId?: string;
  initiatedBy?: string;
  parameters: Record<string, unknown>;
  status: "pending" | "confirmed" | "executing" | "completed" | "failed" | "cancelled" | "timeout";
  result?: Record<string, unknown>;
  errorMessage?: string;
  confirmedAt?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  createdAt: string;
};

/**
 * Get all available functions for workspace
 */
export async function getAvailableFunctions(
  workspaceId: string,
  userRole: string = "member"
): Promise<FunctionDefinition[]> {
  const db = supabaseAdmin();
  const { data, error } = await db.rpc("get_available_functions", {
    p_workspace_id: workspaceId,
    p_user_role: userRole,
  });

  if (error) {
    console.error("Failed to get available functions:", error);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id,
    functionName: row.function_name,
    displayName: row.display_name,
    description: row.description,
    icon: row.icon,
    productSlug: row.product_slug,
    category: row.category,
    parametersSchema: row.parameters_schema ?? {},
    requiredParams: row.required_params ?? [],
    requiresConfirmation: row.requires_confirmation ?? true,
    handlerType: row.handler_type,
    handlerEndpoint: row.handler_endpoint,
  }));
}

/**
 * Get function definition by name
 */
export async function getFunctionByName(functionName: string): Promise<FunctionDefinition | null> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("helper_functions")
    .select("*")
    .eq("function_name", functionName)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    functionName: data.function_name,
    displayName: data.display_name,
    description: data.description,
    icon: data.icon,
    productSlug: data.product_slug,
    category: data.category,
    parametersSchema: data.parameters_schema ?? {},
    requiredParams: data.required_params ?? [],
    requiresConfirmation: data.requires_confirmation ?? true,
    handlerType: data.handler_type,
    handlerEndpoint: data.handler_endpoint,
  };
}

/**
 * Create function call record
 */
export async function createFunctionCall(
  workspaceId: string,
  functionName: string,
  parameters: Record<string, unknown>,
  context: {
    conversationId?: string;
    messageId?: string;
    initiatedBy?: string;
  }
): Promise<FunctionCall | null> {
  const func = await getFunctionByName(functionName);
  if (!func) {
    throw new Error(`Function not found: ${functionName}`);
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("helper_function_calls")
    .insert({
      workspace_id: workspaceId,
      function_id: func.id,
      function_name: functionName,
      conversation_id: context.conversationId ?? null,
      message_id: context.messageId ?? null,
      initiated_by: context.initiatedBy ?? null,
      parameters,
      status: func.requiresConfirmation ? "pending" : "confirmed",
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to create function call:", error);
    return null;
  }

  return mapCallRecord(data);
}

/**
 * Update function call status
 */
export async function updateFunctionCallStatus(
  callId: string,
  status: FunctionCall["status"],
  result?: Record<string, unknown>,
  errorMessage?: string
): Promise<void> {
  const db = supabaseAdmin();
  const updates: Record<string, unknown> = { status };

  if (status === "confirmed") updates.confirmed_at = new Date().toISOString();
  if (status === "executing") updates.started_at = new Date().toISOString();
  if (status === "completed" || status === "failed") {
    updates.completed_at = new Date().toISOString();
    if (result) updates.result = result;
    if (errorMessage) updates.error_message = errorMessage;
  }

  await db
    .from("helper_function_calls")
    .update(updates)
    .eq("id", callId);
}

/**
 * Get function call by ID
 */
export async function getFunctionCall(callId: string): Promise<FunctionCall | null> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("helper_function_calls")
    .select("*")
    .eq("id", callId)
    .maybeSingle();

  if (!data) return null;
  return mapCallRecord(data);
}

/**
 * Get function calls for workspace
 */
export async function getFunctionCalls(
  workspaceId: string,
  options: {
    conversationId?: string;
    status?: FunctionCall["status"];
    limit?: number;
  } = {}
): Promise<FunctionCall[]> {
  const db = supabaseAdmin();
  let query = db
    .from("helper_function_calls")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (options.conversationId) {
    query = query.eq("conversation_id", options.conversationId);
  }
  if (options.status) {
    query = query.eq("status", options.status);
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data } = await query;
  return (data ?? []).map(mapCallRecord);
}

/**
 * Validate function parameters
 */
export function validateParameters(
  func: FunctionDefinition,
  parameters: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required parameters
  for (const param of func.requiredParams) {
    if (!(param in parameters) || parameters[param] === null || parameters[param] === undefined) {
      errors.push(`Missing required parameter: ${param}`);
    }
  }

  // Validate parameters against JSON schema
  if (func.parametersSchema && typeof func.parametersSchema === "object") {
    const schema = func.parametersSchema as Record<string, unknown>;
    const properties = schema.properties as Record<string, Record<string, unknown>> | undefined;
    
    if (properties) {
      for (const [paramName, value] of Object.entries(parameters)) {
        const paramSchema = properties[paramName];
        if (!paramSchema) {
          // Parameter not in schema - allow for flexibility
          continue;
        }
        
        const expectedType = paramSchema.type as string | undefined;
        if (expectedType && value !== null && value !== undefined) {
          const actualType = Array.isArray(value) ? "array" : typeof value;
          if (expectedType !== actualType) {
            errors.push(
              `Parameter '${paramName}' should be type '${expectedType}' but got '${actualType}'`
            );
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function mapCallRecord(data: Record<string, unknown>): FunctionCall {
  return {
    id: data.id as string,
    workspaceId: data.workspace_id as string,
    functionId: data.function_id as string,
    functionName: data.function_name as string,
    conversationId: data.conversation_id as string | undefined,
    messageId: data.message_id as string | undefined,
    initiatedBy: data.initiated_by as string | undefined,
    parameters: (data.parameters as Record<string, unknown>) ?? {},
    status: data.status as FunctionCall["status"],
    result: data.result as Record<string, unknown> | undefined,
    errorMessage: data.error_message as string | undefined,
    confirmedAt: data.confirmed_at as string | undefined,
    startedAt: data.started_at as string | undefined,
    completedAt: data.completed_at as string | undefined,
    durationMs: data.duration_ms as number | undefined,
    createdAt: data.created_at as string,
  };
}
