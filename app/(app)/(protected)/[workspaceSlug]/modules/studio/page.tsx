import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FileText,
  BarChart3,
  Workflow,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Bot,
  ImageIcon,
  MusicIcon,
  Zap,
} from "lucide-react";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { canAccess, getPlanMeta, type FeatureKey } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function StudioHubPage({ params }: PageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;
  const db = supabaseAdmin();

  // Fetch stats in parallel
  const [docsResult, chartsResult, workflowsResult, subResult] = await Promise.all([
    db
      .from("office_documents")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id),
    db
      .from("graph_charts")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id),
    db
      .from("tracks_workflows")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id),
    db
      .from("subscriptions")
      .select("plan_id")
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
  ]);

  const plan = getPlanMeta(subResult.data?.plan_id || "free_locked");
  const isAdmin = Boolean(ctx.profile?.is_admin);
  const ents = ctx.effectiveEntitlements ?? [];
  const check = (f: FeatureKey) =>
    canAccess({ plan_id: plan.plan_id, is_admin: isAdmin, effectiveEntitlements: ents }, f);

  const basePath = `/${workspaceSlug}/modules/studio`;

  const modules = [
    {
      key: "office",
      name: "Office",
      description: "AI-powered document automation — Excel, Word, PDF, invoices, and reports from your data.",
      icon: FileText,
      color: "blue",
      href: `${basePath}/office`,
      stat: docsResult.count ?? 0,
      statLabel: "Documents",
      unlocked: check("office"),
      features: ["AI document generation", "Template library", "Export PDF/Excel/Word"],
    },
    {
      key: "graph",
      name: "Graph",
      description: "Create charts, dashboards, AI images, and video content for marketing and analytics.",
      icon: BarChart3,
      color: "purple",
      href: `${basePath}/graph`,
      stat: chartsResult.count ?? 0,
      statLabel: "Charts",
      unlocked: check("graph"),
      features: ["Chart builder", "Dashboard designer", "AI image generation"],
    },
    {
      key: "tracks",
      name: "Tracks",
      description: "Workflow orchestration, AI music creation, and automation for your business processes.",
      icon: Workflow,
      color: "teal",
      href: `${basePath}/tracks`,
      stat: workflowsResult.count ?? 0,
      statLabel: "Workflows",
      unlocked: check("tracks"),
      features: ["Workflow builder", "Run history", "AI music & audio"],
    },
  ] as const;

  const colorMap = {
    blue: { bg: "from-blue-500/20 to-blue-400/5", border: "border-blue-500/20", text: "text-blue-400", badge: "bg-blue-500/15 text-blue-400" },
    purple: { bg: "from-purple-500/20 to-purple-400/5", border: "border-purple-500/20", text: "text-purple-400", badge: "bg-purple-500/15 text-purple-400" },
    teal: { bg: "from-teal-500/20 to-teal-400/5", border: "border-teal-500/20", text: "text-teal-400", badge: "bg-teal-500/15 text-teal-400" },
  } as const;

  const integrations = [
    {
      icon: MessageSquare,
      title: "Meta Hub Integration",
      description: "Generate WhatsApp templates, reports, and marketing assets from Meta Hub data directly in Studio.",
      href: `/${workspaceSlug}/meta-hub`,
      color: "text-amber-400",
    },
    {
      icon: Bot,
      title: "Helper AI Integration",
      description: "Use Helper AI to generate documents, analyze data, create visuals, and compose audio — all with natural language.",
      href: `/${workspaceSlug}/helper`,
      color: "text-purple-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
            AI Creative Suite
          </span>
        </div>
        <h1 className="text-2xl font-bold text-[#f5f5dc]">Studio Hub</h1>
        <p className="mt-1 text-sm text-[#f5f5dc]/60 max-w-2xl">
          Create anything — documents, visuals, charts, workflows, music — powered by AI
          and connected to your Meta Hub conversations and Helper intelligence.
        </p>
      </div>

      {/* Module Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {modules.map((mod) => {
          const c = colorMap[mod.color];
          const Icon = mod.icon;
          return (
            <div
              key={mod.key}
              className={`group relative rounded-2xl border ${c.border} bg-[#0a1229]/60 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-${mod.color}-500/5`}
            >
              {/* Icon + Badge */}
              <div className="flex items-start justify-between mb-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${c.bg}`}>
                  <Icon className={`h-6 w-6 ${c.text}`} />
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    mod.unlocked
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-amber-500/15 text-amber-400"
                  }`}
                >
                  {mod.unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>

              {/* Name + Description */}
              <h3 className="text-lg font-semibold text-[#f5f5dc] mb-2">{mod.name}</h3>
              <p className="text-sm text-[#f5f5dc]/50 mb-4 leading-relaxed">{mod.description}</p>

              {/* Features */}
              <div className="space-y-1 mb-5">
                {mod.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-[#f5f5dc]/40">
                    <Zap className="h-3 w-3 text-cyan-500/60" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              {/* Stat + CTA */}
              <div className="flex items-end justify-between">
                <div>
                  <p className={`text-2xl font-bold ${c.text}`}>{mod.stat}</p>
                  <p className="text-[10px] text-[#f5f5dc]/30 uppercase tracking-wider">{mod.statLabel}</p>
                </div>
                {mod.unlocked ? (
                  <Link
                    href={mod.href}
                    className={`inline-flex items-center gap-1.5 rounded-lg border ${c.border} px-3 py-1.5 text-xs font-semibold ${c.text} transition-colors hover:bg-[#f5f5dc]/5`}
                  >
                    Open <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : (
                  <Link
                    href={`/${workspaceSlug}/billing`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-500/10"
                  >
                    Upgrade
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Integrations Section */}
      <div>
        <h2 className="text-lg font-semibold text-[#f5f5dc] mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-cyan-400" />
          Connected Integrations
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {integrations.map((int) => {
            const IntIcon = int.icon;
            return (
              <Link
                key={int.title}
                href={int.href}
                className="group flex items-start gap-4 rounded-2xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-5 transition-all hover:border-cyan-500/20 hover:bg-[#0a1229]/60"
              >
                <div className="mt-0.5">
                  <IntIcon className={`h-5 w-5 ${int.color}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#f5f5dc] group-hover:text-cyan-300 transition-colors">
                    {int.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#f5f5dc]/40 leading-relaxed">
                    {int.description}
                  </p>
                </div>
                <ArrowRight className="ml-auto mt-0.5 h-4 w-4 text-[#f5f5dc]/20 group-hover:text-cyan-400 transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Coming Soon Teaser */}
      <div className="rounded-2xl border border-dashed border-cyan-500/20 bg-cyan-500/5 p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ImageIcon className="h-4 w-4 text-cyan-400/60" />
          <MusicIcon className="h-4 w-4 text-cyan-400/60" />
        </div>
        <h3 className="text-sm font-semibold text-cyan-300">AI Images, Videos & Music — Coming Soon</h3>
        <p className="mt-1 text-xs text-[#f5f5dc]/40 max-w-md mx-auto">
          Generate marketing images, product videos, jingles, and brand audio directly from your workspace.
          All connected to your Meta Hub campaigns and Helper AI.
        </p>
      </div>
    </div>
  );
}
