"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageCircleIcon,
  BookOpenIcon,
  UsersIcon,
  ZapIcon,
  BarChart3Icon,
  TargetIcon,
  DatabaseIcon,
  HistoryIcon,
  SparklesIcon,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  workspaceSlug: string;
  activeTab?: string;
  children: React.ReactNode;
};

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const HELPER_SECTIONS: NavSection[] = [
  {
    label: "AI Assistant",
    items: [
      { id: "chat", label: "Chat", icon: MessageCircleIcon, href: "" },
      { id: "ai", label: "AI Studio", icon: SparklesIcon, href: "/ai-studio" },
    ],
  },
  {
    label: "CRM",
    items: [
      { id: "crm", label: "CRM Insights", icon: UsersIcon, href: "/crm" },
      { id: "leads", label: "Leads AI", icon: TargetIcon, href: "/leads" },
    ],
  },
  {
    label: "Automation",
    items: [
      { id: "workflows", label: "Workflows", icon: ZapIcon, href: "/workflows" },
      { id: "history", label: "Run History", icon: HistoryIcon, href: "/history" },
    ],
  },
  {
    label: "Resources",
    items: [
      { id: "knowledge", label: "Knowledge Base", icon: DatabaseIcon, href: "/knowledge" },
      { id: "docs", label: "Documentation", icon: BookOpenIcon, href: "/docs" },
      { id: "analytics", label: "Analytics", icon: BarChart3Icon, href: "/analytics" },
    ],
  },
];

export function HelperSubPageShell({ workspaceSlug, activeTab, children }: Props) {
  const pathname = usePathname();
  const basePath = `/${workspaceSlug}/helper`;

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="relative grid h-full gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="overflow-y-auto rounded-2xl border border-purple-500/20 bg-[#0a1229]/80 p-4 backdrop-blur-3xl">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-400/10 shadow-lg shadow-purple-500/10">
                <Bot className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">
                  Helper
                </p>
                <h1 className="text-base font-semibold text-[#f5f5dc]">AI Assistant</h1>
              </div>
            </div>
          </div>

          {/* Navigation by sections */}
          <nav className="space-y-5">
            {HELPER_SECTIONS.map((section) => (
              <div key={section.label}>
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#f5f5dc]/30">
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const href = `${basePath}${item.href}`;
                    const isActive = activeTab === item.id || (item.href === "" && pathname === basePath);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.id}
                        href={href}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-gradient-to-r from-purple-500/15 to-purple-400/5 text-purple-300 shadow-[inset_0_0_20px_rgba(168,85,247,0.1)]"
                            : "text-[#f5f5dc]/60 hover:bg-[#f5f5dc]/5 hover:text-[#f5f5dc]"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            isActive ? "text-purple-400" : "text-[#f5f5dc]/40 group-hover:text-[#f5f5dc]/60"
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* AI Badge */}
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-purple-500/20 bg-purple-500/10 px-3 py-2">
            <SparklesIcon className="h-4 w-4 text-purple-400" />
            <span className="text-[10px] font-semibold text-purple-400">
              Powered by AI
            </span>
          </div>
        </aside>

        {/* Content */}
        <section className="min-h-0 overflow-hidden">
          {children}
        </section>
      </div>
    </div>
  );
}
