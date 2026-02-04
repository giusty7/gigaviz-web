import { notFound } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { requireEntitlement } from "@/lib/entitlements/server";
import { HelperSubPageShell } from "@/components/helper/HelperSubPageShell";
import {
  BookOpen,
  FileText,
  Video,
  ExternalLink,
  Search,
  Star,
  Clock,
  ChevronRight,
  Sparkles,
  MessageCircle,
  Zap,
  Database,
  BarChart3,
  Users,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Documentation | Gigaviz Helper",
  description: "Learn how to use Gigaviz Helper AI assistant",
};

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

const DOCS_SECTIONS = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Quick start guide to using Helper AI",
    icon: Sparkles,
    color: "from-[#d4af37] to-[#f9d976]",
    articles: [
      { title: "Introduction to Helper", duration: "3 min read" },
      { title: "Your First Conversation", duration: "5 min read" },
      { title: "Setting Up AI Providers", duration: "4 min read" },
    ],
  },
  {
    id: "chat",
    title: "Chat & Conversations",
    description: "Master the AI chat interface",
    icon: MessageCircle,
    color: "from-blue-500 to-blue-400",
    articles: [
      { title: "Chat Basics", duration: "3 min read" },
      { title: "Conversation History", duration: "2 min read" },
      { title: "Prompt Engineering Tips", duration: "7 min read" },
    ],
  },
  {
    id: "workflows",
    title: "Workflows & Automation",
    description: "Automate tasks with AI workflows",
    icon: Zap,
    color: "from-purple-500 to-purple-400",
    articles: [
      { title: "Creating Your First Workflow", duration: "6 min read" },
      { title: "Triggers & Actions", duration: "5 min read" },
      { title: "AI Steps & Conditions", duration: "8 min read" },
    ],
  },
  {
    id: "knowledge",
    title: "Knowledge Base",
    description: "Train your AI with custom data",
    icon: Database,
    color: "from-emerald-500 to-emerald-400",
    articles: [
      { title: "Adding Knowledge Sources", duration: "4 min read" },
      { title: "Auto-Sync Configuration", duration: "5 min read" },
      { title: "RAG Search Explained", duration: "6 min read" },
    ],
  },
  {
    id: "crm",
    title: "CRM Insights",
    description: "AI-powered customer analytics",
    icon: Users,
    color: "from-cyan-500 to-cyan-400",
    articles: [
      { title: "Understanding AI Insights", duration: "4 min read" },
      { title: "Customer Scoring", duration: "3 min read" },
      { title: "Engagement Analytics", duration: "5 min read" },
    ],
  },
  {
    id: "analytics",
    title: "Analytics & Reports",
    description: "Track AI usage and performance",
    icon: BarChart3,
    color: "from-orange-500 to-orange-400",
    articles: [
      { title: "Usage Dashboard", duration: "3 min read" },
      { title: "Token Consumption", duration: "4 min read" },
      { title: "Performance Metrics", duration: "5 min read" },
    ],
  },
];

const QUICK_LINKS = [
  { title: "API Reference", href: "#", icon: FileText },
  { title: "Video Tutorials", href: "#", icon: Video },
  { title: "Community Forum", href: "#", icon: ExternalLink },
];

export default async function DocsPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);

  if (!ctx.currentWorkspace || !ctx.user) {
    notFound();
  }

  const workspace = ctx.currentWorkspace;
  const workspaceId = workspace.id;

  // Check entitlement
  const entitlement = await requireEntitlement(workspaceId, "helper");
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
        <div className="p-6 space-y-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent flex items-center justify-center gap-3">
              <BookOpen className="h-8 w-8 text-[#d4af37]" />
              Helper Documentation
            </h1>
            <p className="text-[#f5f5dc]/60 mt-2 max-w-2xl mx-auto">
              Everything you need to know about using Gigaviz Helper AI assistant
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#f5f5dc]/40" />
            <input
              type="text"
              placeholder="Search documentation..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#0a1229]/80 border border-[#d4af37]/20 text-[#f5f5dc] placeholder:text-[#f5f5dc]/40 focus:outline-none focus:border-[#d4af37]/50"
            />
          </div>

          {/* Quick Links */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0a1229]/80 border border-[#d4af37]/20 text-[#f5f5dc]/80 hover:text-[#d4af37] hover:border-[#d4af37]/40 transition-all"
              >
                <link.icon className="h-4 w-4" />
                {link.title}
              </Link>
            ))}
          </div>

          {/* Documentation Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DOCS_SECTIONS.map((section) => (
              <div
                key={section.id}
                className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl overflow-hidden hover:border-[#d4af37]/40 transition-all group"
              >
                {/* Section Header */}
                <div className={`p-4 bg-gradient-to-r ${section.color} bg-opacity-10`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${section.color}`}>
                      <section.icon className="h-5 w-5 text-[#050a18]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#f5f5dc]">{section.title}</h3>
                      <p className="text-sm text-[#f5f5dc]/60">{section.description}</p>
                    </div>
                  </div>
                </div>

                {/* Articles List */}
                <div className="divide-y divide-[#d4af37]/10">
                  {section.articles.map((article, idx) => (
                    <Link
                      key={idx}
                      href="#"
                      className="flex items-center justify-between p-3 hover:bg-[#f5f5dc]/5 transition-colors"
                    >
                      <span className="text-sm text-[#f5f5dc]/80">{article.title}</span>
                      <div className="flex items-center gap-2 text-xs text-[#f5f5dc]/40">
                        <Clock className="h-3 w-3" />
                        {article.duration}
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>

                {/* View All */}
                <div className="p-3 border-t border-[#d4af37]/10">
                  <Link
                    href="#"
                    className="flex items-center justify-center gap-2 text-sm text-[#d4af37] hover:text-[#f9d976] transition-colors"
                  >
                    View all articles
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Popular Articles */}
          <div className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl p-6">
            <h2 className="text-lg font-semibold text-[#d4af37] mb-4 flex items-center gap-2">
              <Star className="h-5 w-5" />
              Popular Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "How to Create AI-Powered Workflows", views: "2.5k views" },
                { title: "Best Practices for Knowledge Base", views: "1.8k views" },
                { title: "Understanding Token Usage", views: "1.5k views" },
                { title: "Integrating with WhatsApp", views: "1.2k views" },
              ].map((article, idx) => (
                <Link
                  key={idx}
                  href="#"
                  className="flex items-center justify-between p-3 rounded-lg bg-[#050a18]/50 hover:bg-[#f5f5dc]/5 transition-colors"
                >
                  <span className="text-[#f5f5dc]/80">{article.title}</span>
                  <span className="text-xs text-[#f5f5dc]/40">{article.views}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Help CTA */}
          <div className="text-center py-8">
            <p className="text-[#f5f5dc]/60 mb-4">
              Can&apos;t find what you&apos;re looking for?
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
