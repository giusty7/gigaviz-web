import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

export default async function WhatsappOutboxPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");
  const workspace = ctx.currentWorkspace;
  if (workspace.slug !== workspaceSlug) redirect(`/${workspace.slug}/meta-hub/messaging/whatsapp/outbox`);

  await ensureWorkspaceCookie(workspace.id);

  const supabase = await supabaseServer();
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) redirect("/login");

  const adminDb = supabaseAdmin();
  const { data: membership } = await adminDb
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.user.id)
    .maybeSingle();

  if (!membership) {
    redirect("/login");
  }

  const { data: rows } = await adminDb
    .from("outbox_messages")
    .select("id,status,to_phone,message_type,attempts,next_attempt_at,last_error,created_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const counts = (rows ?? []).reduce(
    (acc, row) => {
      const status = (row.status as string | null)?.toLowerCase() ?? "unknown";
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">WhatsApp Outbox</h1>
        <p className="text-sm text-muted-foreground">Recent queued/sent/failed messages (last 50)</p>
      </div>

      <div className="flex gap-3 text-sm">
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} className="rounded-md border px-3 py-2 bg-muted/30">
            <div className="uppercase text-[11px] tracking-wide text-muted-foreground">{status}</div>
            <div className="text-base font-semibold">{count}</div>
          </div>
        ))}
        {Object.keys(counts).length === 0 && (
          <div className="text-sm text-muted-foreground">No outbox items yet.</div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">To</th>
              <th className="px-3 py-2">Attempts</th>
              <th className="px-3 py-2">Next Attempt</th>
              <th className="px-3 py-2">Last Error</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-3 py-2 capitalize">{row.status ?? "-"}</td>
                <td className="px-3 py-2">{row.message_type ?? "text"}</td>
                <td className="px-3 py-2 font-mono text-xs">{row.to_phone}</td>
                <td className="px-3 py-2">{row.attempts ?? 0}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{row.next_attempt_at ?? "-"}</td>
                <td className="px-3 py-2 text-xs text-amber-600">{row.last_error ?? "-"}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{row.created_at}</td>
              </tr>
            ))}
            {(rows ?? []).length === 0 && (
              <tr>
                <td className="px-3 py-4 text-sm text-muted-foreground" colSpan={7}>
                  Nothing in the outbox.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
