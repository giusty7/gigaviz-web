import { Activity, HeartPulse } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type WebhookRow = {
  id: string;
  channel?: string | null;
  received_at?: string | null;
  processed_at?: string | null;
  error_text?: string | null;
};

async function fetchWebhookEvents() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("meta_webhook_events")
    .select("id, channel, received_at, processed_at, error_text")
    .order("received_at", { ascending: false })
    .limit(25);

  if (error) {
    return { available: false, rows: [] as WebhookRow[] };
  }
  return { available: true, rows: data ?? [] };
}

function statusFor(row: WebhookRow) {
  if (row.error_text) return { label: "error", variant: "magenta" as const };
  if (row.processed_at) return { label: "processed", variant: "outline" as const };
  return { label: "pending", variant: "secondary" as const };
}

export default async function OwnerHealthPage() {
  const { available, rows } = await fetchWebhookEvents();

  if (!available) {
    return (
      <Card className="border-border bg-card/80">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Webhook health</CardTitle>
          <HeartPulse className="h-5 w-5 text-ring" />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
            meta_webhook_events table not found. Skipping webhook status view.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Webhook events</CardTitle>
          <p className="text-sm text-muted-foreground">
            Last known status for inbound webhooks (WhatsApp and others).
          </p>
        </div>
        <Activity className="h-5 w-5 text-ring" />
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
            No webhook events recorded yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const status = statusFor(row);
                return (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.channel ?? "unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.received_at ? new Date(row.received_at).toLocaleString() : "Unknown"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.error_text ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
