import { AlertTriangle, MessageCircle, Shield, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type StatCards = {
  totalWorkspaces: number;
  totalUsers: number;
  suspendedWorkspaces: number;
  inboundLast24h: number | null;
};

async function fetchStats(): Promise<StatCards> {
  const db = supabaseAdmin();

  const [{ count: wsCount = 0 }, { count: userCount = 0 }, { count: suspendedCount = 0 }] =
    await Promise.all([
      db.from("workspaces").select("id", { count: "exact", head: true }),
      db.from("profiles").select("id", { count: "exact", head: true }),
      db
        .from("workspaces")
        .select("id", { count: "exact", head: true })
        .eq("status", "suspended"),
    ]);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: inboundCount, error: inboundError } = await db
    .from("wa_messages")
    .select("id", { count: "exact", head: true })
    .eq("direction", "inbound")
    .gte("wa_timestamp", since);

  return {
    totalWorkspaces: wsCount ?? 0,
    totalUsers: userCount ?? 0,
    suspendedWorkspaces: suspendedCount ?? 0,
    inboundLast24h: inboundError ? null : inboundCount ?? 0,
  };
}

const cards = [
  {
    label: "Total workspaces",
    icon: Shield,
    key: "totalWorkspaces" as const,
  },
  {
    label: "Total users",
    icon: Users,
    key: "totalUsers" as const,
  },
  {
    label: "Workspaces suspended",
    icon: AlertTriangle,
    key: "suspendedWorkspaces" as const,
  },
  {
    label: "Inbound messages (24h)",
    icon: MessageCircle,
    key: "inboundLast24h" as const,
  },
];

export default async function OwnerOverviewPage() {
  const stats = await fetchStats();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, icon: Icon, key }) => (
          <Card key={key} className="border-border bg-card/80 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 text-3xl font-semibold">
                    {stats[key] === null ? "N/A" : stats[key].toLocaleString()}
                  </p>
                </div>
                <div className="rounded-full bg-muted/80 p-3 text-ring">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
