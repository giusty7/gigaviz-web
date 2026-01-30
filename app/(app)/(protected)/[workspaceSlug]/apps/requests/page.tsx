import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { RequestForm } from "@/components/app/RequestForm";
import { supabaseAdmin } from "@/lib/supabase/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

type AppRequestRow = {
  id: string;
  app_name: string;
  description: string;
  use_case: string | null;
  priority: string;
  status: string;
  upvotes: number;
  created_at: string;
  profiles: {
    name: string | null;
    email: string | null;
  } | null;
};

export default async function RequestsPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const db = supabaseAdmin();
  const { data: requests } = await db
    .from("apps_requests")
    .select("*, profiles(name, email)")
    .eq("workspace_id", ctx.currentWorkspace.id)
    .order("created_at", { ascending: false });

  const pendingRequests = (requests || []).filter((r: AppRequestRow) => r.status === "pending");
  const otherRequests = (requests || []).filter((r: AppRequestRow) => r.status !== "pending");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">App Requests</h1>
          <p className="text-sm text-muted-foreground">
            Request new apps or features
          </p>
        </div>
        <Link
          href={`/${workspaceSlug}/apps`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Apps
        </Link>
      </div>

      {/* Request Form */}
      <div className="mb-8 rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Submit New Request</h2>
        <RequestForm
          workspaceId={ctx.currentWorkspace.id}
          userId={ctx.user.id}
        />
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Pending Review</h2>
          <div className="space-y-4">
            {pendingRequests.map((req: AppRequestRow) => (
              <div key={req.id} className="rounded-lg border bg-card p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{req.app_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Requested by {req.profiles?.name || req.profiles?.email || "Unknown"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-600 dark:text-yellow-400">
                      {req.status}
                    </span>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {req.priority}
                    </span>
                  </div>
                </div>
                <p className="mb-2 text-sm">{req.description}</p>
                {req.use_case && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Use case:</span> {req.use_case}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>👍 {req.upvotes} upvotes</span>
                  <span>{new Date(req.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Requests */}
      {otherRequests.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Previous Requests</h2>
          <div className="space-y-4">
            {otherRequests.map((req: AppRequestRow) => (
              <div key={req.id} className="rounded-lg border bg-card p-4 opacity-75">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{req.app_name}</h3>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      req.status === "completed"
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : req.status === "rejected"
                          ? "bg-red-500/10 text-red-600 dark:text-red-400"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
                <p className="text-sm">{req.description}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>👍 {req.upvotes} upvotes</span>
                  <span>{new Date(req.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
