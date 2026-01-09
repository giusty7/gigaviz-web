import { supabaseAdmin } from "@/lib/supabase/admin";
import { getWorkspaceEntitlements } from "@/lib/entitlements/server";

type RecordUsageInput = {
  workspaceId: string;
  eventType: string;
  amount: number;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
};

type UsageSnapshot = {
  total: number;
  counters: Record<string, number>;
};

function currentYyyymm(d = new Date()) {
  return Number(`${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
}

function normalizeCounters(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  const obj = value as Record<string, unknown>;
  const result: Record<string, number> = {};
  Object.entries(obj).forEach(([k, v]) => {
    const num = Number(v);
    if (Number.isFinite(num)) result[k] = num;
  });
  return result;
}

export async function getUsageThisMonth(workspaceId: string, eventType = "tokens"): Promise<UsageSnapshot> {
  const db = supabaseAdmin();
  const yyyymm = currentYyyymm();
  const { data } = await db
    .from("usage_monthly")
    .select("counters")
    .eq("workspace_id", workspaceId)
    .eq("yyyymm", yyyymm)
    .maybeSingle();
  const counters = normalizeCounters(data?.counters);
  const total = Number(counters[eventType] ?? 0);
  return { total, counters };
}

export async function recordUsage(input: RecordUsageInput) {
  const db = supabaseAdmin();
  const occurredAt = input.occurredAt ?? new Date();
  const yyyymm = currentYyyymm(occurredAt);

  const meta = input.metadata ?? {};
  await db.from("usage_events").insert({
    workspace_id: input.workspaceId,
    event_type: input.eventType,
    amount: input.amount,
    metadata: meta,
    occurred_at: occurredAt.toISOString(),
  });

  const { total, counters } = await getUsageThisMonth(input.workspaceId, input.eventType);
  const nextCounters = { ...counters, [input.eventType]: total + input.amount };

  await db
    .from("usage_monthly")
    .upsert(
      {
        workspace_id: input.workspaceId,
        yyyymm,
        counters: nextCounters,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,yyyymm" }
    )
    .select("workspace_id")
    .maybeSingle();
}

export async function enforceUsageCap(
  workspaceId: string,
  capKey = "usage_cap_tokens",
  attempted: number,
  eventType = "tokens"
): Promise<
  | { allowed: true; cap: number | null; used: number }
  | { allowed: false; cap: number; used: number; attempted: number }
> {
  const ent = await getWorkspaceEntitlements(workspaceId);
  const capRaw = ent.limits[capKey];
  const cap = typeof capRaw === "number" ? capRaw : Number(capRaw);
  if (!cap || !Number.isFinite(cap) || cap <= 0) {
    return { allowed: true, cap: null, used: 0 };
  }

  const { total } = await getUsageThisMonth(workspaceId, eventType);
  const next = total + attempted;
  if (next > cap) {
    return { allowed: false, cap, used: total, attempted };
  }

  return { allowed: true, cap, used: total };
}

export async function getWorkspaceUsageSummary(workspaceId: string) {
  const yyyymm = currentYyyymm();
  const ent = await getWorkspaceEntitlements(workspaceId);
  const capRaw = ent.limits["usage_cap_tokens"];
  const cap = typeof capRaw === "number" ? capRaw : Number(capRaw);
  const { total } = await getUsageThisMonth(workspaceId, "tokens");

  const normalizedCap = Number.isFinite(cap) && cap > 0 ? cap : null;
  const remaining = normalizedCap !== null ? Math.max(normalizedCap - total, 0) : null;
  const percentUsed =
    normalizedCap !== null && normalizedCap > 0 ? Math.min(100, (total / normalizedCap) * 100) : null;

  return {
    cap: normalizedCap,
    used: total,
    remaining,
    percentUsed,
    yyyymm: String(yyyymm),
  };
}
