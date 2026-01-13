"use client";

import { useEffect, useState } from "react";
import { Clock3, Loader2, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type AuditEvent = {
  id: string;
  action: string;
  actor_email: string | null;
  created_at: string;
  meta: Record<string, unknown> | null;
};

type AuditLogPanelProps = {
  workspaceId: string;
};

export function AuditLogPanel({ workspaceId }: AuditLogPanelProps) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/audit-events?workspaceId=${workspaceId}`);
      if (!res.ok) {
        setError("Failed to load audit events.");
        setLoading(false);
        return;
      }
      const payload = (await res.json()) as { events: AuditEvent[] };
      setEvents(payload.events || []);
      setLoading(false);
    };
    load();
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-background px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading audit log...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-background px-4 py-6 text-center text-sm">
        <p className="font-semibold text-foreground">No audit events yet</p>
        <p className="text-xs text-muted-foreground">Perform actions like role updates or billing requests to generate entries.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((evt) => (
        <div
          key={evt.id}
          className="flex items-start justify-between rounded-xl border border-border/80 bg-background px-4 py-3"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-gigaviz-surface/70 text-gigaviz-gold">
              <IconForAction action={evt.action} />
            </span>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-foreground">{evt.action}</p>
              <p className="text-xs text-muted-foreground">{evt.actor_email ?? "Unknown actor"}</p>
              {evt.meta ? (
                <p className="text-[11px] text-muted-foreground/80">{JSON.stringify(evt.meta)}</p>
              ) : null}
            </div>
          </div>
          <Badge variant="outline" className="border-border/70 text-[11px] text-muted-foreground">
            {formatRelative(evt.created_at)}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function IconForAction({ action }: { action: string }) {
  if (action.startsWith("billing")) return <Sparkles className="h-4 w-4" />;
  if (action.startsWith("member")) return <Users className="h-4 w-4" />;
  if (action.startsWith("workspace")) return <ShieldCheck className="h-4 w-4" />;
  return <Clock3 className="h-4 w-4" />;
}

function formatRelative(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "now";
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
