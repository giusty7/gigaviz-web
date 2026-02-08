import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

type AppCatalogRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  category: string;
  status: string;
  pricing_model: string | null;
  icon_url: string | null;
  launched_at: string | null;
};

export default async function AppsPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const db = supabaseAdmin();
  const { data: apps } = await db
    .from("apps_catalog")
    .select("*")
    .order("launched_at", { ascending: false, nullsFirst: false })
    .order("name");

  const stableApps = (apps || []).filter((app: AppCatalogRow) => app.status === "stable");
  const betaApps = (apps || []).filter((app: AppCatalogRow) => app.status === "beta");
  const comingSoonApps = (apps || []).filter((app: AppCatalogRow) => app.status === "coming_soon");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Apps</h1>
        <p className="mt-2 text-muted-foreground">
          Discover and request apps to supercharge your workspace
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex gap-3">
        <Link
          href={`/${workspaceSlug}/apps/requests`}
          className="rounded-lg border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          💡 Request an App
        </Link>
        <Link
          href={`/${workspaceSlug}/apps/roadmap`}
          className="rounded-lg border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          🗺️ View Roadmap
        </Link>
      </div>

      {/* Stable Apps */}
      {stableApps.length > 0 && (
        <div className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">Available Now</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stableApps.map((app: AppCatalogRow) => (
              <Link
                key={app.id}
                href={`/${workspaceSlug}/${app.slug}`}
                className="group rounded-xl border bg-card p-6 transition-all hover:border-primary hover:shadow-lg"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {app.icon_url && (
                      <Image src={app.icon_url} alt={app.name} width={40} height={40} className="h-10 w-10 rounded-lg" unoptimized />
                    )}
                    <div>
                      <h3 className="font-semibold group-hover:text-primary">{app.name}</h3>
                      {app.pricing_model && (
                        <span className="text-xs text-muted-foreground capitalize">
                          {app.pricing_model}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{app.tagline}</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {app.category}
                  </span>
                  <span className="rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400">
                    Stable
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Beta Apps */}
      {betaApps.length > 0 && (
        <div className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">Beta</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {betaApps.map((app: AppCatalogRow) => (
              <Link
                key={app.id}
                href={`/${workspaceSlug}/${app.slug}`}
                className="group rounded-xl border bg-card p-6 transition-all hover:border-primary hover:shadow-lg"
              >
                <div className="mb-3">
                  <h3 className="font-semibold group-hover:text-primary">{app.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{app.tagline}</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {app.category}
                  </span>
                  <span className="rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-600 dark:text-yellow-400">
                    Beta
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Coming Soon */}
      {comingSoonApps.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Coming Soon</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {comingSoonApps.map((app: AppCatalogRow) => (
              <div
                key={app.id}
                className="rounded-xl border bg-card/50 p-6 opacity-75"
              >
                <div className="mb-3">
                  <h3 className="font-semibold">{app.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{app.tagline || app.description}</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {app.category}
                  </span>
                  <span className="rounded-full bg-slate-500/10 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Coming Soon
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

