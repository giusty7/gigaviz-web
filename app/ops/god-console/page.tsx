import { OpsShell } from "@/components/platform/OpsShell";
import GodConsoleClient, {
  type GodWorkspaceCard,
} from "@/components/god-console/GodConsoleClient";
import { redirect } from "next/navigation";
import { assertOpsEnabled } from "@/lib/ops/guard";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { supabaseServer } from "@/lib/supabase/server";
import { ENTITLEMENT_KEYS } from "@/lib/entitlements/payload-spec";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string | string[];
};

type WorkspaceRow = {
  id: string;
  slug: string;
  name: string;
  created_at?: string | null;
  status?: string | null;
};

function pickParam(val?: string | string[]) {
  return Array.isArray(val) ? val[0] ?? "" : val ?? "";
}

function currentYyyymm() {
  const now = new Date();
  return Number(`${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}`);
}

export default async function GodConsolePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const resolvedParams = await Promise.resolve(searchParams ?? {});
  const query = pickParam(resolvedParams.q).trim();

  assertOpsEnabled();

  const admin = await requirePlatformAdmin();
  if (!admin.ok) redirect("/");

  const supabase = await supabaseServer();
  const { data: workspaceRows } =
    (await supabase.rpc("admin_search_workspaces", {
      p_query: query.length > 0 ? query : null,
    })) ?? {};

  const workspaces: WorkspaceRow[] = (workspaceRows ?? []) as WorkspaceRow[];
  if (!workspaces.length) {
    return (
      <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
        <GodConsoleClient workspaces={[]} query={query} actorEmail={admin.actorEmail} />
      </OpsShell>
    );
  }

  const ids = workspaces.map((ws) => ws.id);
  const yyyymm = currentYyyymm();
  const adminDb = admin.db;

  const [subsRes, walletsRes, settingsRes, usageRes, entRes, auditRes] = await Promise.all([
    adminDb
      .from("subscriptions")
      .select("workspace_id, plan_id, plan_code, status, current_period_end")
      .in("workspace_id", ids),
    adminDb.from("workspace_token_balance").select("workspace_id, balance"),
    adminDb.from("token_settings").select("workspace_id, monthly_cap, hard_cap"),
    adminDb
      .from("usage_monthly")
      .select("workspace_id, counters, yyyymm")
      .eq("yyyymm", yyyymm)
      .in("workspace_id", ids),
    adminDb
      .from("workspace_entitlements")
      .select("workspace_id, key, enabled")
      .in("workspace_id", ids),
    adminDb
      .from("owner_audit_log")
      .select("id, action, actor_email, actor_role, workspace_id, created_at, meta")
      .in("workspace_id", ids)
      .order("created_at", { ascending: false })
      .limit(Math.max(ids.length * 5, 10)),
  ]);

  const subsMap = new Map(
    (subsRes.data ?? []).map((row) => [
      row.workspace_id,
      {
        plan: row.plan_code ?? row.plan_id ?? "free_locked",
        status: row.status ?? "unknown",
        current_period_end: row.current_period_end ?? null,
      },
    ])
  );

  const walletMap = new Map(
    (walletsRes.data ?? []).map((row) => [row.workspace_id, Number(row.balance ?? 0)])
  );

  const settingsMap = new Map(
    (settingsRes.data ?? []).map((row) => [
      row.workspace_id,
      {
        cap: row.monthly_cap !== null && row.monthly_cap !== undefined ? Number(row.monthly_cap) : null,
        hardCap: Boolean(row.hard_cap),
      },
    ])
  );

  const usageMap = new Map(
    (usageRes.data ?? []).map((row) => {
      const counters = (row.counters as Record<string, unknown>) ?? {};
      const tokensRaw = counters.tokens ?? counters.token ?? counters.usage_tokens ?? 0;
      const tokens = Number(tokensRaw ?? 0);
      return [row.workspace_id, Number.isFinite(tokens) ? tokens : 0];
    })
  );

  const entitlementMap = new Map<string, string[]>();
  (entRes.data ?? []).forEach((row) => {
    if (!row.enabled) return;
    if (!ENTITLEMENT_KEYS.includes(row.key as (typeof ENTITLEMENT_KEYS)[number])) return;
    const existing = entitlementMap.get(row.workspace_id) ?? [];
    existing.push(row.key);
    entitlementMap.set(row.workspace_id, existing);
  });

  const auditByWorkspace = new Map<string, Array<GodWorkspaceCard["audits"][number]>>();
  (auditRes.data ?? []).forEach((row) => {
    const list = auditByWorkspace.get(row.workspace_id) ?? [];
    if (list.length < 5) {
      list.push({
        id: row.id,
        action: row.action,
        actor_email: row.actor_email ?? null,
        actor_role: row.actor_role ?? null,
        created_at: row.created_at ?? null,
        meta: row.meta ?? null,
      });
    }
    auditByWorkspace.set(row.workspace_id, list);
  });

  const cards: GodWorkspaceCard[] = workspaces.map((ws) => {
    const sub = subsMap.get(ws.id);
    const wallet = walletMap.get(ws.id) ?? 0;
    const settings = settingsMap.get(ws.id);
    const usage = usageMap.get(ws.id) ?? 0;
    const cap = settings?.cap ?? null;
    const hardCap = settings?.hardCap ?? false;
    const risk =
      ws.status === "suspended" ||
      (cap !== null && cap > 0 && usage >= cap * 0.9) ||
      (sub?.status ?? "").toLowerCase() === "past_due";

    return {
      id: ws.id,
      name: ws.name,
      slug: ws.slug,
      created_at: ws.created_at ?? null,
      status: ws.status ?? "active",
      plan_code: sub?.plan ?? "free_locked",
      subscription_status: sub?.status ?? "unknown",
      wallet_balance: wallet,
      usage_tokens: usage,
      monthly_cap: cap,
      hard_cap: hardCap,
      entitlements: entitlementMap.get(ws.id) ?? [],
      audits: auditByWorkspace.get(ws.id) ?? [],
      risk,
    };
  });

  return (
    <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
      <GodConsoleClient workspaces={cards} query={query} actorEmail={admin.actorEmail} />
    </OpsShell>
  );
}
