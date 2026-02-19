import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, ShieldCheck, SquareArrowOutUpRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { OpsShell } from "@/components/platform/OpsShell";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatRelativeTime } from "@/lib/time";
import { assertOpsEnabled } from "@/lib/ops/guard";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";

export const dynamic = "force-dynamic";

type WorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  owner_id: string | null;
  workspace_type?: string | null;
  status?: string | null;
  created_at?: string | null;
  suspended_reason?: string | null;
  suspended_at?: string | null;
};

function isUuid(value: string) {
  return /^[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[1-5][0-9a-fA-F-]{3}-[89abAB][0-9a-fA-F-]{3}-[0-9a-fA-F-]{12}$/.test(
    value
  );
}

async function fetchWorkspaces(search?: string) {
  const db = supabaseAdmin();
  const query = (search || "").trim();

  let memberWorkspaceIds: string[] = [];
  if (query) {
    const { data: memberMatches } = await db
      .from("workspace_members")
      .select("workspace_id, profiles!inner(email, full_name)")
      .or(`profiles.email.ilike.%${query}%,profiles.full_name.ilike.%${query}%`);

    memberWorkspaceIds = (memberMatches ?? []).map((row) => row.workspace_id);
  }

  const filters: string[] = [];
  if (query) {
    filters.push(`name.ilike.%${query}%`);
    filters.push(`slug.ilike.%${query}%`);
    if (isUuid(query)) filters.push(`id.eq.${query}`);
    if (memberWorkspaceIds.length) {
      filters.push(`id.in.(${memberWorkspaceIds.join(",")})`);
    }
  }

  let workspaceQuery = db
    .from("workspaces")
    .select(
      "id, name, slug, owner_id, workspace_type, status, created_at, suspended_reason, suspended_at"
    )
    .order("created_at", { ascending: false })
    .limit(query ? 50 : 100);

  if (filters.length) {
    workspaceQuery = workspaceQuery.or(filters.join(","));
  }

  const { data: workspaces, error } = await workspaceQuery;
  if (error) {
    return { workspaces: [] as WorkspaceRow[], ownerEmails: {}, lastActivity: {} };
  }

  const workspaceIds = (workspaces ?? []).map((ws) => ws.id);
  const ownerIds = Array.from(
    new Set(
      (workspaces ?? [])
        .map((ws) => ws.owner_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  const [ownerProfiles, activity] = await Promise.all([
    ownerIds.length
      ? db.from("profiles").select("id, email").in("id", ownerIds)
      : Promise.resolve({ data: [] }),
    workspaceIds.length
      ? db
          .from("wa_messages")
          .select("workspace_id, wa_timestamp")
          .in("workspace_id", workspaceIds)
          .order("wa_timestamp", { ascending: false })
          .limit(workspaceIds.length * 3)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const ownerEmails = Object.fromEntries(
    (ownerProfiles.data ?? []).map((row) => [row.id, row.email ?? ""])
  );

  const lastActivity: Record<string, string | null> = {};
  if (!activity.error) {
    for (const row of activity.data ?? []) {
      if (!lastActivity[row.workspace_id] && row.wa_timestamp) {
        lastActivity[row.workspace_id] = row.wa_timestamp;
      }
    }
  }

  return { workspaces: (workspaces ?? []) as WorkspaceRow[], ownerEmails, lastActivity };
}

export default async function OpsWorkspacesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  assertOpsEnabled();
  const admin = await requirePlatformAdmin();
  if (!admin.ok) redirect("/");

  const sp = await searchParams;
  const query = (sp.q ?? "").trim();
  const { workspaces, ownerEmails, lastActivity } = await fetchWorkspaces(query);

  return (
    <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
      <div className="space-y-4">
        <Card className="border-border bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg">Workspaces</CardTitle>
              <p className="text-sm text-muted-foreground">
                Search by slug, name, or member email to inspect a workspace.
              </p>
            </div>
            <ShieldCheck className="h-5 w-5 text-ring" />
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative w-full md:w-1/2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  name="q"
                  defaultValue={query}
                  placeholder="Search by slug, name, or email"
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="secondary">
                  Search
                </Button>
                {query ? (
                  <Button asChild variant="outline">
                    <Link href="/ops/workspaces">Clear</Link>
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Workspace list</CardTitle>
          </CardHeader>
          <CardContent>
            {workspaces.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
                No workspaces match this search yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID / Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workspaces.map((ws) => {
                    const status = ws.status ?? "active";
                    const activity = lastActivity[ws.id];
                    const ownerEmail = ws.owner_id ? ownerEmails[ws.owner_id] : null;
                    return (
                      <TableRow key={ws.id}>
                        <TableCell>
                          <div className="font-medium">{ws.name}</div>
                          <div className="text-xs text-muted-foreground">{ws.slug}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={status === "suspended" ? "magenta" : "outline"}
                            className="capitalize"
                          >
                            {status}
                          </Badge>
                          {ws.suspended_reason ? (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {ws.suspended_reason}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {ownerEmail ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {ws.created_at
                            ? new Date(ws.created_at).toLocaleString()
                            : "Not set"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {activity ? formatRelativeTime(activity) : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/ops/god-console?workspaceId=${ws.id}`}>
                                <Sparkles className="mr-1 h-3.5 w-3.5" />
                                Quick
                              </Link>
                            </Button>
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/ops/workspaces/${ws.id}`}>
                                <SquareArrowOutUpRight className="mr-1 h-3.5 w-3.5" />
                                Details
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </OpsShell>
  );
}
