import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAppContext } from "@/lib/app-context";
import { getWorkspaceEffectiveEntitlements } from "@/lib/entitlements/effective";
import { ENTITLEMENT_KEYS } from "@/lib/entitlements/payload-spec";
import { isPlatformAdmin } from "@/lib/platform/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams?: { slug?: string; workspace?: string };
};

const ENTITLEMENT_LABELS: Record<string, string> = {
  core_os: "Platform (Core OS)",
  meta_hub: "Meta Hub",
  studio: "Studio",
  helper: "Helper",
  office: "Office",
  marketplace: "Marketplace",
  arena: "Arena",
  pay: "Pay",
  trade: "Trade",
  community: "Community",
};

function formatDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

async function setEntitlementAction(formData: FormData) {
  "use server";

  const workspaceSlug = String(formData.get("workspace_slug") ?? "").trim();
  const entitlementKey = String(formData.get("entitlement_key") ?? "").trim();
  const granted = formData.get("granted") === "on";
  const expiresInput = String(formData.get("expires_at") ?? "").trim();
  const reasonInput = String(formData.get("reason") ?? "").trim();

  if (!workspaceSlug || !entitlementKey) {
    return;
  }

  const supabase = await supabaseServer();
  const allowed = await isPlatformAdmin(supabase);
  if (!allowed) {
    throw new Error("forbidden");
  }

  const expiresAt = expiresInput ? new Date(expiresInput) : null;
  const expiresValue =
    expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt.toISOString() : null;
  const reason = reasonInput.length > 0 ? reasonInput : null;

  const { error } = await supabase.rpc("set_workspace_entitlement", {
    p_workspace_slug: workspaceSlug,
    p_entitlement_key: entitlementKey,
    p_granted: granted,
    p_expires_at: expiresValue,
    p_reason: reason,
  });

  if (error) {
    throw new Error(error.message || "failed_to_set_entitlement");
  }

  revalidatePath(`/${workspaceSlug}/meta-hub`);
  revalidatePath(`/${workspaceSlug}/dashboard`);
  revalidatePath(`/${workspaceSlug}/modules`);
  revalidatePath(`/${workspaceSlug}/platform/entitlements`);
}

export default async function PlatformEntitlementsPage({ params, searchParams }: PageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");
  if (ctx.currentWorkspace.slug !== workspaceSlug) {
    redirect(`/${ctx.currentWorkspace.slug}/platform/entitlements`);
  }

  const supabase = await supabaseServer();
  const allowed = await isPlatformAdmin(supabase);
  if (!allowed) {
    return (
      <div className="rounded-2xl border border-border/60 bg-gigaviz-surface p-6 text-sm">
        <p className="text-lg font-semibold text-foreground">403</p>
        <p className="mt-1 text-muted-foreground">
          Platform admin access is required to manage entitlements.
        </p>
      </div>
    );
  }

  const targetSlug = String(searchParams?.slug ?? searchParams?.workspace ?? "").trim();
  const db = supabaseAdmin();

  const { data: targetWorkspace } = targetSlug
    ? await db
        .from("workspaces")
        .select("id, name, slug, created_at")
        .eq("slug", targetSlug)
        .maybeSingle()
    : { data: null };

  const workspaceId = targetWorkspace?.id ?? null;
  const { data: entitlementRows } = workspaceId
    ? await db
        .from("workspace_entitlements")
        .select("key, enabled, expires_at, reason, updated_at, granted_by")
        .eq("workspace_id", workspaceId)
        .order("key", { ascending: true })
    : { data: null };

  const entitlementMap = new Map(
    (entitlementRows ?? []).map((row) => [row.key, row])
  );
  const activeEntitlements = workspaceId
    ? await getWorkspaceEffectiveEntitlements(workspaceId)
    : [];

  const { data: auditRows } = workspaceId
    ? await db
        .from("workspace_entitlement_events")
        .select("id, entitlement_key, granted, expires_at, reason, granted_by, created_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: null };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/60 bg-gigaviz-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">Workspace Entitlements</h2>
        <p className="text-sm text-muted-foreground">
          Grant or revoke entitlements for any workspace by slug.
        </p>
        <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" method="get">
          <div className="flex-1 space-y-1">
            <label className="text-xs uppercase tracking-wide text-muted-foreground">
              Workspace slug
            </label>
            <Input
              name="slug"
              placeholder="acme-workspace"
              defaultValue={targetSlug}
            />
          </div>
          <Button type="submit" variant="secondary">
            Load workspace
          </Button>
        </form>
      </section>

      {targetSlug && !targetWorkspace && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-sm text-amber-200">
          Workspace {targetSlug} not found.
        </div>
      )}

      {targetWorkspace && (
        <>
          <section className="rounded-2xl border border-border/60 bg-background p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Workspace</p>
                <p className="text-lg font-semibold text-foreground">{targetWorkspace.name}</p>
                <p className="text-xs text-muted-foreground">{targetWorkspace.slug}</p>
              </div>
              <div className="text-xs text-muted-foreground">
                Created: {new Date(targetWorkspace.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Active entitlements
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeEntitlements.length > 0 ? (
                  activeEntitlements.map((key) => (
                    <span
                      key={key}
                      className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300"
                    >
                      {ENTITLEMENT_LABELS[key] ?? key}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            {ENTITLEMENT_KEYS.map((key) => {
              const current = entitlementMap.get(key);
              const isGranted = Boolean(current?.enabled);
              return (
                <form
                  key={key}
                  action={setEntitlementAction}
                  className="rounded-2xl border border-border/60 bg-gigaviz-surface p-6"
                >
                  <input type="hidden" name="workspace_slug" value={targetWorkspace.slug} />
                  <input type="hidden" name="entitlement_key" value={key} />
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {ENTITLEMENT_LABELS[key] ?? key}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Status: {isGranted ? "Granted" : "Not granted"}
                        {current?.expires_at
                          ? ` - Expires ${new Date(current.expires_at).toLocaleString()}`
                          : ""}
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        name="granted"
                        defaultChecked={isGranted}
                        className="h-4 w-4 rounded border-border bg-background"
                      />
                      Granted
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Expires at (optional)
                      </label>
                      <Input
                        type="datetime-local"
                        name="expires_at"
                        defaultValue={formatDateTimeLocal(current?.expires_at)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Reason (optional)
                      </label>
                      <Textarea
                        name="reason"
                        defaultValue={current?.reason ?? ""}
                        className="min-h-[90px]"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button type="submit">Save entitlement</Button>
                  </div>
                </form>
              );
            })}
          </section>

          <section className="rounded-2xl border border-border/60 bg-background p-6">
            <h3 className="text-sm font-semibold text-foreground">Audit log (latest 50)</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs text-muted-foreground">
                <thead className="text-[11px] uppercase text-muted-foreground/80">
                  <tr>
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2 pr-4">Key</th>
                    <th className="py-2 pr-4">Granted</th>
                    <th className="py-2 pr-4">Expires</th>
                    <th className="py-2 pr-4">Reason</th>
                    <th className="py-2 pr-4">Actor</th>
                  </tr>
                </thead>
                <tbody>
                  {(auditRows ?? []).length > 0 ? (
                    (auditRows ?? []).map((row) => (
                      <tr key={row.id} className="border-t border-border/60">
                        <td className="py-2 pr-4">
                          {row.created_at ? new Date(row.created_at).toLocaleString() : "--"}
                        </td>
                        <td className="py-2 pr-4">{row.entitlement_key}</td>
                        <td className="py-2 pr-4">
                          {row.granted ? "Granted" : "Revoked"}
                        </td>
                        <td className="py-2 pr-4">
                          {row.expires_at ? new Date(row.expires_at).toLocaleString() : "--"}
                        </td>
                        <td className="py-2 pr-4">{row.reason ?? "--"}</td>
                        <td className="py-2 pr-4">
                          {row.granted_by ? String(row.granted_by).slice(0, 8) : "--"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-3 text-muted-foreground" colSpan={6}>
                        No entitlement events recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
