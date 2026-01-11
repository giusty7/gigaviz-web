import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAppContext } from "@/lib/app-context";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export const dynamic = "force-dynamic";

export default async function MetaHubWebhooksPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");
  await ensureWorkspaceCookie(ctx.currentWorkspace.id);

  const db = supabaseAdmin();
  const { data: events } = await db
    .from("meta_webhook_events")
    .select("id, channel, event_type, received_at, payload_json")
    .eq("workspace_id", ctx.currentWorkspace.id)
    .order("received_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Webhooks</h2>
        <p className="text-sm text-muted-foreground">
          Menampilkan 50 event terakhir yang diterima untuk workspace ini.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        {events && events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Waktu</th>
                  <th className="py-2 pr-3">Channel</th>
                  <th className="py-2 pr-3">Event</th>
                  <th className="py-2 pr-3">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {events.map((evt) => (
                  <tr key={evt.id}>
                    <td className="py-2 pr-3 text-muted-foreground">
                      {evt.received_at
                        ? new Date(evt.received_at).toLocaleString()
                        : "-"}
                    </td>
                    <td className="py-2 pr-3 text-foreground">{evt.channel}</td>
                    <td className="py-2 pr-3 text-foreground">{evt.event_type ?? "-"}</td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      <code className="text-xs">
                        {JSON.stringify(evt.payload_json)?.slice(0, 120) ?? "{}"}...
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background px-6 py-10 text-center">
            <p className="text-sm font-semibold text-foreground">Belum ada event</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tambah koneksi terlebih dahulu untuk mulai menerima webhook.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

