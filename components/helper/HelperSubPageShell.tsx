"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageCircleIcon,
  BookOpenIcon,
  UsersIcon,
  ZapIcon,
  BarChart3Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  workspaceSlug: string;
  activeTab?: string;
  children: React.ReactNode;
};

const HELPER_TABS = [
  { id: "chat", label: "Chat", icon: MessageCircleIcon, href: "" },
  { id: "knowledge", label: "Knowledge Base", icon: BookOpenIcon, href: "/knowledge" },
  { id: "crm", label: "CRM", icon: UsersIcon, href: "/crm" },
  { id: "workflows", label: "Workflows", icon: ZapIcon, href: "/workflows" },
  { id: "analytics", label: "Analytics", icon: BarChart3Icon, href: "/analytics" },
];

export function HelperSubPageShell({ workspaceSlug, activeTab, children }: Props) {
  const pathname = usePathname();
  const basePath = `/${workspaceSlug}/helper`;

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-[#050a18] via-[#0a1229] to-[#050a18]">
      {/* Sub-navigation */}
      <nav className="flex-none border-b border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl">
        <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto scrollbar-none">
          {HELPER_TABS.map((tab) => {
            const href = `${basePath}${tab.href}`;
            const isActive = activeTab === tab.id || (tab.href === "" && pathname === basePath);
            
            return (
              <Link
                key={tab.id}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  isActive
                    ? "bg-gradient-to-r from-[#d4af37]/20 to-[#f9d976]/10 text-[#d4af37] border border-[#d4af37]/30"
                    : "text-[#f5f5dc]/60 hover:text-[#f5f5dc] hover:bg-[#f5f5dc]/5"
                )}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
