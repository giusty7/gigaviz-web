/**
 * Automation Engine for WhatsApp Inbox
 * 
 * Evaluates user-defined rules and executes actions automatically
 * based on trigger events (new messages, tag changes, status updates, etc.)
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

// ========================================
// Type Definitions
// ========================================

/**
 * Trigger events that can activate automation rules
 */
export type TriggerType = 
  | 'new_message'      // New inbound message received
  | 'tag_added'        // Tags added to thread
  | 'status_changed'   // Thread status updated
  | 'assigned';        // Thread assigned to user

/**
 * Condition operators for rule evaluation
 */
export type ConditionOperator = 
  | 'equals'          // Exact match
  | 'not_equals'      // Not equal to
  | 'contains'        // String/array contains value
  | 'not_contains'    // String/array does not contain value
  | 'exists'          // Field has a value (not null)
  | 'not_exists'      // Field is null/undefined
  | 'greater_than'    // Numeric comparison
  | 'less_than';      // Numeric comparison

/**
 * Action types that can be executed
 */
export type ActionType = 
  | 'add_tag'         // Add tag to thread
  | 'remove_tag'      // Remove tag from thread
  | 'change_status'   // Update thread status
  | 'assign_to'       // Assign thread to user
  | 'send_template'   // Send WhatsApp template message
  | 'ai_reply';       // Generate AI reply using Helper

/**
 * Automation rule structure
 */
export interface AutomationRule {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  
  trigger_type: TriggerType;
  trigger_config?: Record<string, unknown>;
  
  conditions: Condition[];
  actions: Action[];
  
  enabled: boolean;
  priority: number;
  
  created_by?: string;
  created_at: string;
  updated_at: string;
  last_executed_at?: string;
  execution_count: number;
}

/**
 * Condition for rule evaluation
 * All conditions must be true (AND logic)
 */
export interface Condition {
  field: string;           // "tag", "status", "assigned_to", "unread_count", "contact_name"
  operator: ConditionOperator;
  value: unknown;
}

/**
 * Action to execute when rule matches
 */
export interface Action {
  type: ActionType;
  params: Record<string, unknown>;
}

/**
 * Execution result for audit logging
 */
export interface ExecutionResult {
  executed: number;        // Number of rules executed
  success: number;         // Number of successful rules
  failed: number;          // Number of failed rules
  skipped: number;         // Number of skipped (conditions not met)
  errors: string[];        // Error messages
  executionIds: string[];  // IDs of execution log entries
}

/**
 * Thread data for condition evaluation
 */
interface ThreadContext {
  id: string;
  workspace_id: string;
  status: string;
  assigned_to?: string;
  unread_count: number;
  contact_name?: string;
  contact_wa_id: string;
  tags: string[];          // Array of tag strings
  connection_id?: string;
  last_message_at?: string;
}

// ========================================
// Main Evaluation Function
// ========================================

/**
 * Evaluate and execute automation rules for a thread
 * 
 * @param params - Trigger context
 * @returns Execution summary with counts and errors
 */
export async function evaluateRulesForThread(params: {
  workspaceId: string;
  threadId: string;
  triggerType: TriggerType;
  triggerData?: Record<string, unknown>;
}): Promise<ExecutionResult> {
  const { workspaceId, threadId, triggerType, triggerData = {} } = params;
  
  const result: ExecutionResult = {
    executed: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    executionIds: [],
  };

  try {
    const supabase = supabaseAdmin();
    const startTime = Date.now();

    // 1. Fetch active rules for this trigger type
    const { data: rules, error: rulesError } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('enabled', true)
      .eq('trigger_type', triggerType)
      .order('priority', { ascending: false }); // Higher priority first

    if (rulesError) {
      throw new Error(`Failed to fetch rules: ${rulesError.message}`);
    }

    if (!rules || rules.length === 0) {
      return result; // No rules to execute
    }

    // 2. Fetch thread context with tags
    const threadContext = await fetchThreadContext(supabase, threadId, workspaceId);
    if (!threadContext) {
      throw new Error(`Thread ${threadId} not found`);
    }

    // 3. Evaluate each rule
    for (const rule of rules) {
      const ruleStartTime = Date.now();
      
      try {
        // Check if conditions match
        const conditionsMet = evaluateConditions(threadContext, rule.conditions || []);
        
        if (!conditionsMet) {
          result.skipped++;
          await logExecution(supabase, {
            workspace_id: workspaceId,
            rule_id: rule.id,
            thread_id: threadId,
            trigger_type: triggerType,
            trigger_data: triggerData,
            status: 'skipped',
            actions_attempted: 0,
            actions_succeeded: 0,
            execution_duration_ms: Date.now() - ruleStartTime,
          });
          continue;
        }

        // Execute actions
        const actionResults = await executeActions(
          supabase,
          rule.actions || [],
          threadContext,
          rule.id
        );

        const actionsSucceeded = actionResults.filter(r => r.ok).length;
        const actionsFailed = actionResults.filter(r => !r.ok).length;

        result.executed++;
        
        if (actionsFailed === 0) {
          result.success++;
        } else if (actionsSucceeded > 0) {
          result.failed++; // Partial failure counted as failed
        } else {
          result.failed++;
        }

        // Collect errors
        const actionErrors = actionResults
          .filter(r => !r.ok && r.error)
          .map(r => r.error as string);
        
        if (actionErrors.length > 0) {
          result.errors.push(`Rule "${rule.name}": ${actionErrors.join(', ')}`);
        }

        // Log execution
        const executionId = await logExecution(supabase, {
          workspace_id: workspaceId,
          rule_id: rule.id,
          thread_id: threadId,
          trigger_type: triggerType,
          trigger_data: triggerData,
          status: actionsFailed === 0 ? 'success' : actionsSucceeded > 0 ? 'partial' : 'failed',
          actions_attempted: actionResults.length,
          actions_succeeded: actionsSucceeded,
          error_message: actionErrors.length > 0 ? actionErrors.join('; ') : undefined,
          error_details: actionErrors.length > 0 ? { errors: actionErrors } : undefined,
          execution_duration_ms: Date.now() - ruleStartTime,
        });

        if (executionId) {
          result.executionIds.push(executionId);
        }

        // Increment rule execution count
        await supabase.rpc('increment_rule_execution_count', { p_rule_id: rule.id });

        // Track usage event for analytics (successful automation only)
        if (actionsFailed === 0) {
          try {
            const { trackUsageEvent } = await import('@/lib/meta/usage-tracker');
            await trackUsageEvent({
              workspaceId,
              eventType: 'automation_triggered',
              threadId,
              automationRuleId: rule.id,
              metadata: {
                rule_name: rule.name,
                trigger_type: triggerType,
                actions_count: actionResults.length,
              },
            });
          } catch {
            // Best effort - don't block automation
          }
        }

      } catch (error) {
        result.failed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Rule "${rule.name}" execution failed: ${errorMsg}`);
        
        await logExecution(supabase, {
          workspace_id: workspaceId,
          rule_id: rule.id,
          thread_id: threadId,
          trigger_type: triggerType,
          trigger_data: triggerData,
          status: 'failed',
          actions_attempted: 0,
          actions_succeeded: 0,
          error_message: errorMsg,
          execution_duration_ms: Date.now() - ruleStartTime,
        });
      }
    }

    console.log(`[AutomationEngine] Evaluated ${rules.length} rules for thread ${threadId} in ${Date.now() - startTime}ms`);
    return result;

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[AutomationEngine] Fatal error:', errorMsg);
    result.errors.push(`Fatal error: ${errorMsg}`);
    return result;
  }
}

// ========================================
// Helper Functions
// ========================================

/**
 * Fetch thread data with tags for condition evaluation
 */
async function fetchThreadContext(
  supabase: ReturnType<typeof supabaseAdmin>,
  threadId: string,
  workspaceId: string
): Promise<ThreadContext | null> {
  const { data: thread, error: threadError } = await supabase
    .from('wa_threads')
    .select(`
      id,
      workspace_id,
      status,
      assigned_to,
      unread_count,
      contact_name,
      contact_wa_id,
      connection_id,
      last_message_at,
      wa_thread_tags(tag)
    `)
    .eq('id', threadId)
    .eq('workspace_id', workspaceId)
    .single();

  if (threadError || !thread) {
    console.error('[AutomationEngine] Failed to fetch thread:', threadError);
    return null;
  }

  // Extract tags from relation
  const tags = Array.isArray(thread.wa_thread_tags)
    ? thread.wa_thread_tags.map((t: { tag: string }) => t.tag)
    : [];

  return {
    ...thread,
    tags,
  } as ThreadContext;
}

/**
 * Evaluate all conditions (AND logic - all must be true)
 */
function evaluateConditions(thread: ThreadContext, conditions: Condition[]): boolean {
  if (!conditions || conditions.length === 0) {
    return true; // No conditions = always match
  }

  return conditions.every(condition => evaluateCondition(thread, condition));
}

/**
 * Evaluate a single condition
 */
function evaluateCondition(thread: ThreadContext, condition: Condition): boolean {
  const { field, operator, value } = condition;
  
  // Get field value from thread (support nested paths like "tags")
  let fieldValue: unknown;
  
  if (field === 'tag' || field === 'tags') {
    fieldValue = thread.tags;
  } else if (field in thread) {
    fieldValue = thread[field as keyof ThreadContext];
  } else {
    fieldValue = undefined;
  }

  // Evaluate based on operator
  switch (operator) {
    case 'equals':
      return fieldValue === value;
    
    case 'not_equals':
      return fieldValue !== value;
    
    case 'contains':
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(value);
      }
      if (typeof fieldValue === 'string' && typeof value === 'string') {
        return fieldValue.toLowerCase().includes(value.toLowerCase());
      }
      return false;
    
    case 'not_contains':
      if (Array.isArray(fieldValue)) {
        return !fieldValue.includes(value);
      }
      if (typeof fieldValue === 'string' && typeof value === 'string') {
        return !fieldValue.toLowerCase().includes(value.toLowerCase());
      }
      return true;
    
    case 'exists':
      return fieldValue !== null && fieldValue !== undefined;
    
    case 'not_exists':
      return fieldValue === null || fieldValue === undefined;
    
    case 'greater_than':
      return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue > value;
    
    case 'less_than':
      return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue < value;
    
    default:
      console.warn(`[AutomationEngine] Unknown operator: ${operator}`);
      return false;
  }
}

/**
 * Execute all actions for a rule
 */
async function executeActions(
  supabase: ReturnType<typeof supabaseAdmin>,
  actions: Action[],
  thread: ThreadContext,
  ruleId: string
): Promise<Array<{ ok: boolean; error?: string }>> {
  const results = [];

  for (const action of actions) {
    const result = await executeAction(supabase, action, thread, ruleId);
    results.push(result);
  }

  return results;
}

/**
 * Execute a single action
 */
async function executeAction(
  supabase: ReturnType<typeof supabaseAdmin>,
  action: Action,
  thread: ThreadContext,
  ruleId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    switch (action.type) {
      case 'add_tag': {
        const tag = action.params.tag as string;
        if (!tag) {
          return { ok: false, error: 'Missing tag parameter' };
        }

        // Insert tag (ignore duplicates)
        const { error } = await supabase
          .from('wa_thread_tags')
          .insert({
            workspace_id: thread.workspace_id,
            thread_id: thread.id,
            tag,
          })
          .select()
          .single();

        // Ignore duplicate key errors (23505)
        if (error && !error.message.includes('duplicate key')) {
          return { ok: false, error: error.message };
        }

        return { ok: true };
      }

      case 'remove_tag': {
        const tag = action.params.tag as string;
        if (!tag) {
          return { ok: false, error: 'Missing tag parameter' };
        }

        const { error } = await supabase
          .from('wa_thread_tags')
          .delete()
          .eq('workspace_id', thread.workspace_id)
          .eq('thread_id', thread.id)
          .eq('tag', tag);

        if (error) {
          return { ok: false, error: error.message };
        }

        return { ok: true };
      }

      case 'change_status': {
        const status = action.params.status as string;
        if (!status) {
          return { ok: false, error: 'Missing status parameter' };
        }

        const { error } = await supabase
          .from('wa_threads')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', thread.id)
          .eq('workspace_id', thread.workspace_id);

        if (error) {
          return { ok: false, error: error.message };
        }

        return { ok: true };
      }

      case 'assign_to': {
        const userId = action.params.user_id as string;
        if (!userId) {
          return { ok: false, error: 'Missing user_id parameter' };
        }

        const { error } = await supabase
          .from('wa_threads')
          .update({ assigned_to: userId, updated_at: new Date().toISOString() })
          .eq('id', thread.id)
          .eq('workspace_id', thread.workspace_id);

        if (error) {
          return { ok: false, error: error.message };
        }

        return { ok: true };
      }

      case 'send_template': {
        // Send WhatsApp template via outbox
        const { template_name, language, components } = action.params;

        if (!template_name || typeof template_name !== 'string') {
          return { ok: false, error: 'send_template requires template_name parameter' };
        }

        const templateLang = typeof language === 'string' ? language : 'en_US';
        const templateComponents = Array.isArray(components) ? components : [];

        // Get thread details for recipient phone
        const { data: threadData, error: threadError } = await supabase
          .from('wa_threads')
          .select('phone_number, connection_id')
          .eq('id', thread.id)
          .eq('workspace_id', thread.workspace_id)
          .single();

        if (threadError || !threadData) {
          return { ok: false, error: `Failed to get thread details: ${threadError?.message}` };
        }

        // Create outbound message record
        const { data: message, error: msgError } = await supabase
          .from('wa_messages')
          .insert({
            workspace_id: thread.workspace_id,
            thread_id: thread.id,
            connection_id: threadData.connection_id,
            direction: 'out',
            text: `[Template: ${template_name}]`, // Placeholder text
            status: 'queued',
          })
          .select('id')
          .single();

        if (msgError || !message) {
          return { ok: false, error: `Failed to create message: ${msgError?.message}` };
        }

        // Queue to outbox for worker processing
        const idempotencyKey = `automation-${ruleId}-${thread.id}-${Date.now()}`;
        const { error: outboxError } = await supabase
          .from('outbox_messages')
          .insert({
            workspace_id: thread.workspace_id,
            thread_id: thread.id,
            connection_id: threadData.connection_id,
            to_phone: threadData.phone_number,
            message_type: 'template',
            payload: {
              message_id: message.id,
              template_name,
              language: templateLang,
              components: templateComponents,
            },
            idempotency_key: idempotencyKey,
            status: 'queued',
            attempts: 0,
            next_run_at: new Date().toISOString(),
            next_attempt_at: new Date().toISOString(),
          });

        if (outboxError) {
          return { ok: false, error: `Failed to queue template: ${outboxError.message}` };
        }

        return { ok: true };
      }

      case 'ai_reply': {
        // Trigger AI-powered reply using Helper
        const { processAIReply } = await import('@/lib/meta/ai-reply-service');

        // Get thread details
        const { data: threadData, error: threadError } = await supabase
          .from('wa_threads')
          .select('phone_number, connection_id, contact_name')
          .eq('id', thread.id)
          .eq('workspace_id', thread.workspace_id)
          .single();

        if (threadError || !threadData) {
          return { ok: false, error: `Failed to get thread details: ${threadError?.message}` };
        }

        // Get the last incoming message
        const { data: lastMessage } = await supabase
          .from('wa_messages')
          .select('text')
          .eq('thread_id', thread.id)
          .eq('direction', 'in')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const incomingMessage = lastMessage?.text || '';
        if (!incomingMessage) {
          return { ok: false, error: 'No incoming message to reply to' };
        }

        const result = await processAIReply({
          workspaceId: thread.workspace_id,
          threadId: thread.id,
          incomingMessage,
          contactName: threadData.contact_name,
          connectionId: threadData.connection_id,
          phoneNumber: threadData.phone_number,
        });

        if (!result.success) {
          return { ok: false, error: result.reason || 'AI reply failed' };
        }

        return { ok: true };
      }

      default:
        return { ok: false, error: `Unknown action type: ${action.type}` };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { ok: false, error: errorMsg };
  }
}

/**
 * Log execution to audit table
 */
async function logExecution(
  supabase: ReturnType<typeof supabaseAdmin>,
  data: {
    workspace_id: string;
    rule_id: string;
    thread_id: string;
    trigger_type: string;
    trigger_data: Record<string, unknown>;
    status: 'success' | 'partial' | 'failed' | 'skipped';
    actions_attempted: number;
    actions_succeeded: number;
    error_message?: string;
    error_details?: Record<string, unknown>;
    execution_duration_ms: number;
  }
): Promise<string | null> {
  const { data: execution, error } = await supabase
    .from('automation_executions')
    .insert(data)
    .select('id')
    .single();

  if (error) {
    console.error('[AutomationEngine] Failed to log execution:', error);
    return null;
  }

  return execution?.id || null;
}
