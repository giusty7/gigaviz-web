import type { Priority, TicketStatus, SlaStatus } from "@/lib/inbox/types";

type SlaTarget = {
  responseMinutes: number;
  resolutionMinutes: number;
};

export const SLA_CONFIG: Record<Priority, SlaTarget> = {
  low: { responseMinutes: 60, resolutionMinutes: 24 * 60 },
  med: { responseMinutes: 30, resolutionMinutes: 12 * 60 },
  high: { responseMinutes: 15, resolutionMinutes: 4 * 60 },
  urgent: { responseMinutes: 5, resolutionMinutes: 2 * 60 },
};

export const SLA_DUE_SOON_MINUTES = 15;

export type ComputeSlaInput = {
  priority?: Priority | null;
  ticketStatus?: TicketStatus | null;
  lastCustomerMessageAt?: string | null;
  now?: Date;
};

export type ComputeSlaOutput = {
  nextResponseDueAt: string | null;
  resolutionDueAt: string | null;
  slaStatus: SlaStatus;
};

function addMinutes(tsIso: string, minutes: number) {
  const base = new Date(tsIso);
  if (Number.isNaN(base.getTime())) return null;
  return new Date(base.getTime() + minutes * 60_000).toISOString();
}

export function computeSla(input: ComputeSlaInput): ComputeSlaOutput {
  const now = input.now ?? new Date();
  const status = input.ticketStatus ?? "open";
  if (status === "solved" || status === "spam") {
    return { nextResponseDueAt: null, resolutionDueAt: null, slaStatus: "ok" };
  }

  const lastCustomerMessageAt = input.lastCustomerMessageAt ?? null;
  if (!lastCustomerMessageAt) {
    return { nextResponseDueAt: null, resolutionDueAt: null, slaStatus: "ok" };
  }

  const priority = input.priority ?? "low";
  const target = SLA_CONFIG[priority] ?? SLA_CONFIG.low;
  const nextResponseDueAt = addMinutes(lastCustomerMessageAt, target.responseMinutes);
  const resolutionDueAt = addMinutes(lastCustomerMessageAt, target.resolutionMinutes);

  if (!nextResponseDueAt) {
    return { nextResponseDueAt: null, resolutionDueAt, slaStatus: "ok" };
  }

  const due = new Date(nextResponseDueAt);
  if (now.getTime() > due.getTime()) {
    return { nextResponseDueAt, resolutionDueAt, slaStatus: "breached" };
  }

  const diffMinutes = (due.getTime() - now.getTime()) / 60_000;
  if (diffMinutes <= SLA_DUE_SOON_MINUTES) {
    return { nextResponseDueAt, resolutionDueAt, slaStatus: "due_soon" };
  }

  return { nextResponseDueAt, resolutionDueAt, slaStatus: "ok" };
}

type RecomputeParams = {
  db: unknown;
  workspaceId: string;
  conversationId: string;
  overrides?: {
    priority?: Priority | null;
    ticketStatus?: TicketStatus | null;
    lastCustomerMessageAt?: string | null;
  };
};

type DbQuery = {
  select: (columns: string) => DbQuery;
  eq: (column: string, value: unknown) => DbQuery;
  update: (values: Record<string, unknown>) => DbQuery;
  upsert: (values: Record<string, unknown> | Record<string, unknown>[], options?: Record<string, unknown>) => DbQuery;
};

type DbClient = {
  from: (table: string) => DbQuery;
};

type DbResult<T> = { data: T | null; error: { message: string } | null };

export async function recomputeConversationSla(params: RecomputeParams) {
  const { db, workspaceId, conversationId, overrides } = params;
  const client = db as DbClient;

  const result = (await (client
    .from("conversations")
    .select("id, priority, ticket_status, last_customer_message_at, last_message_at")
    .eq("workspace_id", workspaceId)
    .eq("id", conversationId) as unknown as Promise<DbResult<{
    priority?: string | null;
    ticket_status?: string | null;
    last_customer_message_at?: string | null;
    last_message_at?: string | null;
  }>>)) as DbResult<{
    priority?: string | null;
    ticket_status?: string | null;
    last_customer_message_at?: string | null;
    last_message_at?: string | null;
  }>;

  if (result.error || !result.data) {
    return {
      ok: false as const,
      error: result.error?.message ?? "conversation_not_found",
    };
  }

  const row = result.data;

  const lastCustomerMessageAt =
    overrides?.lastCustomerMessageAt ??
    row.last_customer_message_at ??
    row.last_message_at ??
    null;

  const computed = computeSla({
    priority: overrides?.priority ?? (row.priority as Priority | null),
    ticketStatus: overrides?.ticketStatus ?? (row.ticket_status as TicketStatus | null),
    lastCustomerMessageAt,
  });

  const patch: Record<string, unknown> = {
    next_response_due_at: computed.nextResponseDueAt,
    resolution_due_at: computed.resolutionDueAt,
    sla_status: computed.slaStatus,
  };

  if (overrides?.lastCustomerMessageAt !== undefined) {
    patch.last_customer_message_at = overrides.lastCustomerMessageAt;
  }

  const updateRes = (await (client
    .from("conversations")
    .update(patch)
    .eq("workspace_id", workspaceId)
    .eq("id", conversationId) as unknown as Promise<DbResult<unknown>>)) as DbResult<unknown>;

  if (updateRes.error) {
    return { ok: false as const, error: updateRes.error.message };
  }

  const effectiveStatus =
    overrides?.ticketStatus ?? (row.ticket_status as TicketStatus | null) ?? "open";

  const now = new Date();
  const shouldEscalate = (dueAt: string | null) =>
    dueAt ? new Date(dueAt).getTime() < now.getTime() : false;

  if (effectiveStatus === "open" || effectiveStatus === "pending") {
    const escalationRows: Array<Record<string, unknown>> = [];
    if (shouldEscalate(computed.nextResponseDueAt)) {
      escalationRows.push({
        conversation_id: conversationId,
        breach_type: "next_response",
        due_at: computed.nextResponseDueAt,
        reason: "SLA breached: next response overdue",
      });
    }
    if (shouldEscalate(computed.resolutionDueAt)) {
      escalationRows.push({
        conversation_id: conversationId,
        breach_type: "resolution",
        due_at: computed.resolutionDueAt,
        reason: "SLA breached: resolution overdue",
      });
    }

    if (escalationRows.length > 0) {
      await (client
        .from("conversation_escalations")
        .upsert(escalationRows, {
          onConflict: "conversation_id,breach_type,due_at",
          ignoreDuplicates: true,
        }) as unknown as Promise<DbResult<unknown>>);
    }
  }

  return { ok: true as const, data: computed };
}
