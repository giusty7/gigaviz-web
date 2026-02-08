import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, FileJson, Filter, ScrollText } from "lucide-react";
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
import { requirePlatformAdmin } from "@/lib/platform-admin/require";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

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
  page?: string;
}) {
  const db = supabaseAdmin();
  const action = (searchParams?.action || "").trim();
  const actor = (searchParams?.actor || "").trim();
  const from = parseDate(searchParams?.from);
  const to = parseDate(searchParams?.to);
  const page = parseInt(searchParams?.page || "1", 10);
  const offset = (page - 1) * PAGE_SIZE;

  let query = db
    .from("owner_audit_log")
    .select(
      "id, action, actor_email, actor_role, workspace_id, target_table, target_id, meta, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (action) query = query.ilike("action", `%${action}%`);
  if (actor) query = query.or(`actor_email.ilike.%${actor}%,actor_user_id.eq.${actor}`);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, error, count } = await query;
  if (error) return { rows: [], total: 0 };
  return { rows: (data ?? []) as AuditRow[], total: count ?? 0 };
}

export default async function OpsAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    action?: string; 
    actor?: string; 
    from?: string; 
    to?: string;
    page?: string;
  }>;
}) {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) redirect("/");

  const sp = await searchParams;
  const { rows, total } = await fetchAuditRows(sp);
  const currentPage = parseInt(sp.page || "1", 10);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  
  const hasFilters =
    Boolean(sp.action) ||
    Boolean(sp.actor) ||
    Boolean(sp.from) ||
    Boolean(sp.to);

  // Build query string for pagination links
  const buildQueryString = (page: number) => {
    const params = new URLSearchParams();
    if (sp.action) params.set("action", sp.action);
    if (sp.actor) params.set("actor", sp.actor);
    if (sp.from) params.set("from", sp.from);
    if (sp.to) params.set("to", sp.to);
    params.set("page", page.toString());
    return params.toString();
  };

  // Build export query string (without page)
  const buildExportQueryString = (format: "csv" | "json") => {
    const params = new URLSearchParams();
    if (sp.action) params.set("action", sp.action);
    if (sp.actor) params.set("actor", sp.actor);
    if (sp.from) params.set("from", sp.from);
    if (sp.to) params.set("to", sp.to);
    params.set("format", format);
    return params.toString();
  };

  return (
    <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
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
                <div className="ml-auto flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a href={`/api/ops/audit/export?${buildExportQueryString("csv")}`} download>
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a href={`/api/ops/audit/export?${buildExportQueryString("json")}`} download>
                      <FileJson className="mr-2 h-4 w-4" />
                      Export JSON
                    </a>
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent events</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Showing {rows.length > 0 ? ((currentPage - 1) * PAGE_SIZE) + 1 : 0} - {Math.min(currentPage * PAGE_SIZE, total)} of {total} events
              </p>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                >
                  <Link href={`/ops/audit?${buildQueryString(currentPage - 1)}`}>
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                >
                  <Link href={`/ops/audit?${buildQueryString(currentPage + 1)}`}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
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
