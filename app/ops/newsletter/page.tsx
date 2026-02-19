import { redirect } from "next/navigation";
import { OpsShell } from "@/components/platform/OpsShell";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NewsletterClient } from "@/components/ops/NewsletterClient";

export const dynamic = "force-dynamic";

export default async function OpsNewsletterPage() {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) redirect("/");

  const db = supabaseAdmin();

  // Fetch newsletter subscribers (latest 300)
  const { data: subscribers, error } = await db
    .from("newsletter_subscribers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  // Stats
  const sevenDaysAgo = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  })();
  const [
    { count: totalCount },
    { count: recentCount },
  ] = await Promise.all([
    db.from("newsletter_subscribers").select("*", { count: "exact", head: true }),
    db.from("newsletter_subscribers").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
  ]);

  const stats = {
    total: totalCount ?? 0,
    last7d: recentCount ?? 0,
  };

  return (
    <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Newsletter Subscribers</h1>
          <p className="text-slate-400">
            Manage newsletter subscribers, view growth, and export data.
          </p>
        </div>

        <NewsletterClient
          initialSubscribers={subscribers ?? []}
          stats={stats}
          error={error?.message}
        />
      </div>
    </OpsShell>
  );
}
