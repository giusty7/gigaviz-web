import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard, Crown, Sparkles } from "lucide-react";
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
      <Card className="bg-[#0a1229]/80 backdrop-blur-xl border border-[#d4af37]/20 shadow-xl">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10 border border-[#d4af37]/30">
              <Crown className="h-5 w-5 text-[#d4af37]" />
            </span>
            <div>
              <CardTitle className="bg-gradient-to-r from-[#d4af37] via-[#f9d976] to-[#d4af37] bg-clip-text text-transparent">Royal Treasury</CardTitle>
              <CardDescription className="text-[#f5f5dc]/60">Plan, seat limits, and upgrade requests for this realm.</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="border-[#d4af37]/60 bg-[#d4af37]/10 text-[#d4af37]">
            {planLabel}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1 text-sm text-[#f5f5dc]/60">
            <div className="flex items-center gap-2 text-[#f5f5dc]">
              <Sparkles className="h-4 w-4 text-[#d4af37]" />
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
              trigger={<Button size="sm" className="bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#050a18] font-semibold hover:opacity-90">Contact Sales / Upgrade</Button>}
            />
            <Button asChild variant="outline" size="sm" className="border-[#d4af37]/30 text-[#f5f5dc]/70 hover:bg-[#d4af37]/10 hover:text-[#d4af37]">
              <Link href={`/${workspaceSlug}/billing`}>Open Legacy Treasury</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0a1229]/80 backdrop-blur-xl border border-[#d4af37]/20 shadow-xl">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle className="text-[#f5f5dc]">Treasury Petitions</CardTitle>
            <CardDescription className="text-[#f5f5dc]/60">Latest submissions for this realm.</CardDescription>
          </div>
          <CreditCard className="h-4 w-4 text-[#d4af37]" />
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {!requests?.length ? (
            <div className="relative overflow-hidden rounded-2xl border border-dashed border-[#d4af37]/30 bg-[#050a18]/60 px-6 py-10 text-center">
              <div className="absolute inset-0 batik-pattern opacity-[0.04]" />
              <div className="relative">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d4af37]/20 to-transparent border border-[#d4af37]/30">
                  <CreditCard className="h-8 w-8 text-[#d4af37]/60" />
                </div>
                <p className="text-lg font-semibold bg-gradient-to-r from-[#d4af37] via-[#f9d976] to-[#d4af37] bg-clip-text text-transparent">Awaiting Sovereignty</p>
                <p className="mt-1 text-sm text-[#f5f5dc]/50">Contact the royal council to unlock premium plans.</p>
              </div>
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between rounded-xl border border-[#d4af37]/20 bg-[#050a18]/60 px-4 py-3 transition-all hover:border-[#d4af37]/40"
              >
                <div>
                  <p className="font-semibold text-[#f5f5dc]">{req.plan_id}</p>
                  <p className="text-xs text-[#f5f5dc]/50">Seats: {req.seats}</p>
                  {req.notes ? (
                    <p className="text-xs text-[#f5f5dc]/50">{req.notes}</p>
                  ) : null}
                </div>
                <div className="text-right text-xs text-[#f5f5dc]/50">
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

