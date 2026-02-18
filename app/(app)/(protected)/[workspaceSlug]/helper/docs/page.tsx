import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { requireEntitlement } from "@/lib/entitlements/server";
import { HelperSubPageShell } from "@/components/helper/HelperSubPageShell";
import {
  BookOpen,
  Sparkles,
  MessageCircle,
  Zap,
  Database,
  BarChart3,
  Users,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Quick Guide | Gigaviz Helper",
  description: "Get started with Gigaviz Helper AI assistant",
};

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

const GUIDE_SECTIONS = [
  {
    id: "chat",
    title: "AI Chat",
    description: "Start a conversation with your AI assistant. Ask questions, get summaries, generate content.",
    icon: MessageCircle,
    color: "from-blue-500 to-blue-400",
    href: "",
    cta: "Open Chat",
  },
  {
    id: "knowledge",
    title: "Knowledge Base",
    description: "Upload documents, URLs, or text to train your AI with custom business knowledge for better answers.",
    icon: Database,
    color: "from-emerald-500 to-emerald-400",
    href: "/knowledge",
    cta: "Manage Knowledge",
  },
  {
    id: "workflows",
    title: "AI Workflows",
    description: "Automate repetitive tasks with trigger-based workflows. Set up schedules, webhooks, or event-driven automations.",
    icon: Zap,
    color: "from-purple-500 to-purple-400",
    href: "/workflows",
    cta: "Create Workflow",
  },
  {
    id: "crm",
    title: "CRM Insights",
    description: "Get AI-powered analytics on your contacts and conversations. Understand customer behavior and engagement.",
    icon: Users,
    color: "from-cyan-500 to-cyan-400",
    href: "/crm",
    cta: "View CRM",
  },
  {
    id: "ai-studio",
    title: "AI Studio",
    description: "Configure AI providers, tweak parameters, create prompt templates, and test different AI models.",
    icon: Sparkles,
    color: "from-[#d4af37] to-[#f9d976]",
    href: "/ai-studio",
    cta: "Open AI Studio",
  },
  {
    id: "analytics",
    title: "Usage Analytics",
    description: "Track AI token usage, conversation volume, workflow executions, and performance metrics.",
    icon: BarChart3,
    color: "from-orange-500 to-orange-400",
    href: "/analytics",
    cta: "View Analytics",
  },
];

export default async function DocsPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);

  if (!ctx.currentWorkspace || !ctx.user) {
    redirect("/login");
  }

  const workspace = ctx.currentWorkspace;

  // Check entitlement
  const entitlement = await requireEntitlement(workspace.id, "helper");
  if (!entitlement.allowed) {
    return (
      <HelperSubPageShell workspaceSlug={workspaceSlug} activeTab="docs">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <p className="text-lg text-[#f5f5dc]/60">Helper is not enabled for this workspace</p>
        </div>
      </HelperSubPageShell>
    );
  }

  return (
    <HelperSubPageShell workspaceSlug={workspaceSlug} activeTab="docs">
      <div className="h-full overflow-y-auto bg-gradient-to-br from-[#050a18] via-[#0a1229] to-[#050a18]">
        <div className="p-6 space-y-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent flex items-center justify-center gap-3">
              <BookOpen className="h-8 w-8 text-[#d4af37]" />
              Quick Guide
            </h1>
            <p className="text-[#f5f5dc]/60 mt-2 max-w-2xl mx-auto">
              Everything Gigaviz Helper can do for you — pick a feature to get started.
            </p>
          </div>

          {/* Feature Guide Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GUIDE_SECTIONS.map((section) => (
              <Link
                key={section.id}
                href={`/${workspaceSlug}/helper${section.href}`}
                className="group rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl overflow-hidden hover:border-[#d4af37]/40 transition-all"
              >
                {/* Section Header */}
                <div className={`p-4 bg-gradient-to-r ${section.color} bg-opacity-10`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${section.color}`}>
                      <section.icon className="h-5 w-5 text-[#050a18]" />
                    </div>
                    <h3 className="font-semibold text-[#f5f5dc]">{section.title}</h3>
                  </div>
                </div>

                {/* Description */}
                <div className="p-4 space-y-3">
                  <p className="text-sm text-[#f5f5dc]/60 leading-relaxed">
                    {section.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-[#d4af37] group-hover:text-[#f9d976] transition-colors">
                    {section.cta}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pro Tips */}
          <div className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl p-6">
            <h2 className="text-lg font-semibold text-[#d4af37] mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Pro Tips
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { tip: "Upload your FAQ or product docs to Knowledge Base — AI answers get much more accurate." },
                { tip: "Use Workflows to auto-tag new conversations and route them to the right team member." },
                { tip: "Check CRM Insights weekly to spot engagement trends and follow up with warm leads." },
                { tip: "Try different AI providers in AI Studio — Claude and GPT-4 each have strengths for different tasks." },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-[#050a18]/50"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/20 text-[10px] font-bold text-[#d4af37]">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-[#f5f5dc]/70 leading-relaxed">{item.tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Help CTA */}
          <div className="text-center py-8">
            <p className="text-[#f5f5dc]/60 mb-4">
              Need help with something specific?
            </p>
            <Link
              href={`/${workspaceSlug}/helper`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#050a18] font-medium hover:opacity-90 transition-opacity"
            >
              <MessageCircle className="h-5 w-5" />
              Ask Helper AI
            </Link>
          </div>
        </div>
      </div>
    </HelperSubPageShell>
  );
}
