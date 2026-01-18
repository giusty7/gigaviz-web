import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatRelativeTime } from "@/lib/time";
import {
  FeatureFlagsPanel,
  OwnerFeatureFlag,
  WorkspaceNotesPanel,
  WorkspaceStatusActions,
} from "@/components/owner/OwnerActions";
import { OwnerEntitlementsPanel, OwnerTokensPanel } from "@/components/owner/OwnerOpsPanels";
import { getWorkspaceTokenBalance, type WorkspaceEntitlementRow } from "@/lib/owner/ops";

export const dynamic = "force-dynamic";

type Workspace = {
  id: string;
  name: string;
  slug: string;
  status?: string | null;
  workspace_type?: string | null;
  created_at?: string | null;
  suspended_reason?: string | null;
  suspended_at?: string | null;
  owner_id?: string | null;
};

type OwnerNote = {
  id: string;
  note: string;
  author_email?: string | null;
  created_at?: string | null;
};

type OwnerAuditRow = {
  id: string;
  action: string;
  actor_email?: string | null;
  actor_role?: string | null;
  created_at?: string | null;
  meta?: Record<string, unknown> | null;
};

async function fetchWorkspaceDetail(idOrSlug: string) {
  const db = supabaseAdmin();
  const { data: workspace } = await db
    .from("workspaces")
    .select(
      "id, name, slug, status, workspace_type, created_at, suspended_reason, suspended_at, owner_id"
    )
    .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .maybeSingle();

  if (!workspace) return null;

  const safe = <T,>(promise: Promise<T>) => promise.catch(() => null);

  const [notesRes, flagsRes, ownerProfile, activity, entitlementsRes, auditRes] =
    await Promise.all([
      safe(
        Promise.resolve(
          db
            .from("owner_workspace_notes")
            .select("id, note, author_email, created_at")
            .eq("workspace_id", workspace.id)
            .order("created_at", { ascending: false })
            .limit(30)
        )
      ),
      safe(
        Promise.resolve(
          db
            .from("owner_feature_flags")
            .select("id, flag_key, enabled, value, updated_at, updated_email")
            .eq("workspace_id", workspace.id)
            .order("flag_key", { ascending: true })
        )
      ),
      workspace.owner_id
        ? safe(
            Promise.resolve(
              db.from("profiles").select("id, email").eq("id", workspace.owner_id).maybeSingle()
            )
          )
        : Promise.resolve({ data: null }),
      safe(
        Promise.resolve(
          db
            .from("wa_messages")
            .select("wa_timestamp")
            .eq("workspace_id", workspace.id)
            .order("wa_timestamp", { ascending: false })
            .limit(1)
        )
      ),
      safe(
        Promise.resolve(
          db
            .from("workspace_entitlements")
            .select("workspace_id, key, enabled, payload, updated_at, updated_by")
            .eq("workspace_id", workspace.id)
            .order("key", { ascending: true })
        )
      ),
      safe(
        Promise.resolve(
          db
            .from("owner_audit_log")
            .select("id, action, actor_email, actor_role, created_at, meta")
            .eq("workspace_id", workspace.id)
            .order("created_at", { ascending: false })
            .limit(30)
        )
      ),
    ]);

  const lastActivity = activity?.data?.[0]?.wa_timestamp ?? null;

  return {
    workspace: workspace as Workspace,
    notes: (notesRes?.data ?? []) as OwnerNote[],
    flags: (flagsRes?.data ?? []) as OwnerFeatureFlag[],
    ownerEmail: ownerProfile?.data?.email ?? null,
    lastActivity,
    entitlements: (entitlementsRes?.data ?? []) as WorkspaceEntitlementRow[],
    auditRows: (auditRes?.data ?? []) as OwnerAuditRow[],
  };
}

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await fetchWorkspaceDetail(id);

  // Show friendly "not found" instead of 404 for valid route but missing workspace
  if (!detail) {
    return (
      <div className="space-y-4">
        <Card className="border-border bg-card/80">
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium text-muted-foreground">
              Workspace not found
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              The workspace with ID <code className="rounded bg-muted px-1.5 py-0.5">{id}</code> does not exist or was deleted.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { workspace, notes, flags, ownerEmail, lastActivity, entitlements, auditRows } = detail;
  const status = workspace.status ?? "active";
  const tokenBalance = await getWorkspaceTokenBalance(workspace.id);

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card/80">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <p className="text-sm text-muted-foreground">Workspace</p>
            <CardTitle className="text-xl">{workspace.name}</CardTitle>
            <p className="text-sm text-muted-foreground">/{workspace.slug}</p>
          </div>
          <Badge variant={status === "suspended" ? "magenta" : "outline"} className="capitalize">
            {status}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide">Created</p>
              <p className="text-foreground">
                {workspace.created_at
                  ? new Date(workspace.created_at).toLocaleString()
                  : "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide">Owner</p>
              <p className="text-foreground">{ownerEmail ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide">Last activity</p>
              <p className="text-foreground">
                {lastActivity ? formatRelativeTime(lastActivity) : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide">Workspace type</p>
              <p className="text-foreground">{workspace.workspace_type ?? "—"}</p>
            </div>
          </div>
          {workspace.suspended_reason ? (
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-foreground">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Suspension reason</p>
              <p>{workspace.suspended_reason}</p>
            </div>
          ) : null}
          <Separator />
          <WorkspaceStatusActions workspaceId={workspace.id} status={status} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Support notes</CardTitle>
            <WorkspaceNotesPanel workspaceId={workspace.id} />
          </CardHeader>
          <CardContent className="space-y-4">
            {notes.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
                No notes yet. Add context before taking actions.
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-lg border border-border bg-background/60 p-3 shadow-sm"
                  >
                    <p className="text-sm text-foreground">{note.note}</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {note.author_email ?? "Unknown"} •{" "}
                      {note.created_at ? formatRelativeTime(note.created_at) : "Unknown"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Feature flags</CardTitle>
            <FeatureFlagsPanel workspaceId={workspace.id} flags={flags} />
          </CardHeader>
          <CardContent className="space-y-3">
            {flags.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
                No flags set yet. Add or toggle flags to control experiments.
              </div>
            ) : (
              <div className="space-y-3">
                {flags.map((flag) => (
                  <div
                    key={flag.id}
                    className="rounded-lg border border-border bg-background/60 p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{flag.flag_key}</p>
                          <Badge
                            variant={flag.enabled ? "outline" : "secondary"}
                            className="capitalize"
                          >
                            {flag.enabled ? "enabled" : "disabled"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Updated{" "}
                          {flag.updated_at
                            ? formatRelativeTime(flag.updated_at)
                            : "Not updated yet"}
                          {flag.updated_email ? ` • ${flag.updated_email}` : ""}
                        </p>
                      </div>
                      <FeatureFlagsPanel
                        workspaceId={workspace.id}
                        flags={[flag]}
                        compact
                      />
                    </div>
                    <div className="mt-2 rounded-md bg-muted/50 p-2 text-xs text-foreground">
                      <pre className="whitespace-pre-wrap break-words">
                        {flag.value ? JSON.stringify(flag.value, null, 2) : "null"}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Entitlements</CardTitle>
          </CardHeader>
          <CardContent>
            <OwnerEntitlementsPanel workspaceId={workspace.id} entitlements={entitlements} />
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <OwnerTokensPanel workspaceId={workspace.id} balance={tokenBalance} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card/80">
        <CardHeader>
          <CardTitle className="text-base">Audit log</CardTitle>
        </CardHeader>
        <CardContent>
          {auditRows.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
              No owner activity logged for this workspace yet.
            </div>
          ) : (
            <div className="space-y-3">
              {auditRows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-lg border border-border bg-background/60 p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium text-foreground">{row.action}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.created_at
                        ? formatRelativeTime(row.created_at)
                        : "Unknown time"}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {row.actor_email ?? "unknown"}{" "}
                    {row.actor_role ? `• ${row.actor_role}` : ""}
                  </div>
                  {row.meta ? (
                    <div className="mt-2 rounded-md bg-muted/50 p-2 text-xs text-foreground">
                      <pre className="whitespace-pre-wrap break-words">
                        {JSON.stringify(row.meta, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
