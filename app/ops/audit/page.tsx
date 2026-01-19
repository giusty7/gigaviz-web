import Link from "next/link";
import { notFound } from "next/navigation";
import { Filter, ScrollText } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OpsShell } from "@/components/platform/OpsShell";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { assertOpsEnabled } from "@/lib/ops/guard";
import { getCurrentUser, isPlatformAdminById } from "@/lib/platform-admin/server";

export const dynamic = "force-dynamic";

type AuditRow = {
  id: string;
  action: string;
  actor_email?: string | null;
  actor_role?: string | null;
  workspace_id?: string | null;
  target_table?: string | null;
  target_id?: string | null;
  created_at?: string | null;
  meta?: Record<string, unknown> | null;
};

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function fetchAuditRows(searchParams?: {
  action?: string;
  actor?: string;
  from?: string;
  to?: string;
}) {
  const db = supabaseAdmin();
  const action = (searchParams?.action || "").trim();
  const actor = (searchParams?.actor || "").trim();
  const from = parseDate(searchParams?.from);
  const to = parseDate(searchParams?.to);

  let query = db
    .from("owner_audit_log")
    .select(
      "id, action, actor_email, actor_role, workspace_id, target_table, target_id, meta, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(150);

  if (action) query = query.ilike("action", `%${action}%`);
  if (actor) query = query.or(`actor_email.ilike.%${actor}%,actor_user_id.eq.${actor}`);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as AuditRow[];
}

export default async function OpsAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; actor?: string; from?: string; to?: string }>;
}) {
  const { userId, email } = await getCurrentUser();
  if (!userId) notFound();
  assertOpsEnabled();
  const platformAdmin = await isPlatformAdminById(userId);
  if (!platformAdmin) notFound();

  const sp = await searchParams;
  const rows = await fetchAuditRows(sp);
  const hasFilters =
    Boolean(sp.action) ||
    Boolean(sp.actor) ||
    Boolean(sp.from) ||
    Boolean(sp.to);

  return (
    <OpsShell actorEmail={email} actorRole="platform_admin">
      <div className="space-y-4">
        <Card className="border-border bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg">Ops audit log</CardTitle>
              <p className="text-sm text-muted-foreground">
                Every admin/internal action is recorded with before/after context.
              </p>
            </div>
            <ScrollText className="h-5 w-5 text-ring" />
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Action</label>
                <Input name="action" defaultValue={sp.action ?? ""} placeholder="owner.*" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Actor (email or user id)</label>
                <Input name="actor" defaultValue={sp.actor ?? ""} placeholder="user@ops" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">From</label>
                <Input type="date" name="from" defaultValue={sp.from ?? ""} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">To</label>
                <Input type="date" name="to" defaultValue={sp.to ?? ""} />
              </div>
              <div className="md:col-span-4 flex flex-wrap items-center gap-2">
                <Button type="submit" variant="secondary">
                  <Filter className="mr-2 h-4 w-4" />
                  Apply filters
                </Button>
                {hasFilters ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href="/ops/audit">Clear</Link>
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Recent events</CardTitle>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
                No audit entries found for this filter.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Workspace</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Meta</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Badge variant="outline">{row.action}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div>{row.actor_email ?? "—"}</div>
                        <div className="text-xs uppercase tracking-wide">{row.actor_role ?? ""}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.workspace_id ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.target_table ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <pre className="whitespace-pre-wrap break-words text-xs">
                          {row.meta ? JSON.stringify(row.meta, null, 2) : "—"}
                        </pre>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.created_at ? new Date(row.created_at).toLocaleString() : "Unknown"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </OpsShell>
  );
}
