import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard, Sparkles } from "lucide-react";
import ContactSalesDialog from "@/components/app/ContactSalesDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppContext } from "@/lib/app-context";
import { planMeta } from "@/lib/entitlements";
import { getWorkspacePlan } from "@/lib/plans";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type BillingPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function PlatformBillingPage({ params }: BillingPageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");
  const workspace = ctx.currentWorkspace;

  const planInfo = await getWorkspacePlan(workspace.id);
  const planLabel = planInfo.displayName;
  const db = supabaseAdmin();
  const { data: requests } = await db
    .from("billing_requests")
    .select("id, plan_id, seats, status, notes, created_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <Card className="bg-card/85 border-border/80">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Billing</CardTitle>
            <CardDescription>Plan, seat limits, and upgrade requests.</CardDescription>
          </div>
          <Badge variant="outline" className="border-gigaviz-gold/60 text-gigaviz-gold">
            {planLabel}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <Sparkles className="h-4 w-4 text-gigaviz-gold" />
              <span className="font-semibold">{planLabel}</span>
            </div>
            <p>Status: {planInfo.status ?? "Active"}</p>
            {planInfo.seatLimit ? <p>Seat limit: {planInfo.seatLimit}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <ContactSalesDialog
              workspaceId={workspace.id}
              workspaceName={workspace.name}
              workspaceSlug={workspace.slug}
              userEmail={ctx.user.email ?? ""}
              planOptions={planMeta}
              defaultPlanId={planInfo.planId}
              trigger={<Button size="sm">Contact sales / Upgrade</Button>}
            />
            <Button asChild variant="outline" size="sm">
              <Link href={`/${workspaceSlug}/billing`}>Open legacy billing</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/85 border-border/80">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Upgrade requests</CardTitle>
            <CardDescription>Latest submissions for this workspace.</CardDescription>
          </div>
          <CreditCard className="h-4 w-4 text-gigaviz-gold" />
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {!requests?.length ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-background px-4 py-6 text-center">
              <p className="font-semibold text-foreground">No requests yet</p>
              <p className="text-xs text-muted-foreground">Contact sales to unlock paid plans.</p>
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between rounded-xl border border-border/80 bg-background px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-foreground">{req.plan_id}</p>
                  <p className="text-xs text-muted-foreground">Seats: {req.seats}</p>
                  {req.notes ? (
                    <p className="text-xs text-muted-foreground">{req.notes}</p>
                  ) : null}
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <StatusBadge status={req.status} />
                  <div>{new Date(req.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "approved" ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/40" :
    status === "rejected" ? "bg-rose-500/15 text-rose-200 border-rose-500/40" :
    "bg-amber-500/15 text-amber-200 border-amber-500/40";
  return <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${variant}`}>{status}</span>;
}

