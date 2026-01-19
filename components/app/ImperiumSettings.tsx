"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Shield,
  CreditCard,
  ScrollText,
  Settings,
  ChevronRight,
  BadgeCheck,
  Activity,
  Users,
  Crown,
  Edit,
  Eye,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   IMPERIUM SETTINGS LAYOUT
   Premium settings interface with Navy/Gold/Cream theme
   ═══════════════════════════════════════════════════════════════════════════ */

type TabItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

type ImperiumSettingsLayoutProps = {
  title: string;
  description?: string;
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: ReactNode;
  navLinks?: { href: string; label: string }[];
};

export function ImperiumSettingsLayout({
  title,
  description,
  tabs,
  activeTab,
  onTabChange,
  children,
  navLinks,
}: ImperiumSettingsLayoutProps) {
  return (
    <div className="relative min-h-[600px]">
      {/* Cyber-Batik Pattern Overlay */}
      <div 
        className="pointer-events-none fixed inset-0 batik-pattern opacity-[0.02]" 
        aria-hidden 
      />
      
      <div className="relative grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar Navigation */}
        <aside className="space-y-4">
          {/* Header Card */}
          <div className="rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10">
                <Settings className="h-5 w-5 text-[#d4af37]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#f5f5dc]">Settings</div>
                <div className="text-[11px] text-[#f5f5dc]/50">Configure your workspace</div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-3 backdrop-blur-xl">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-[#d4af37]/15 to-[#f9d976]/5 text-[#d4af37] shadow-[inset_0_0_20px_rgba(212,175,55,0.1)]"
                        : "text-[#f5f5dc]/60 hover:bg-[#f5f5dc]/5 hover:text-[#f5f5dc]"
                    }`}
                  >
                    <span className={isActive ? "text-[#d4af37]" : "text-[#f5f5dc]/40 group-hover:text-[#f5f5dc]/60"}>
                      {tab.icon}
                    </span>
                    {tab.label}
                    {isActive && (
                      <ChevronRight className="ml-auto h-4 w-4 text-[#d4af37]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          {navLinks && navLinks.length > 0 && (
            <div className="rounded-2xl border border-[#f5f5dc]/10 bg-[#050a18]/60 p-3">
              <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[#f5f5dc]/30">
                Quick Links
              </div>
              <div className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-lg px-3 py-2 text-xs text-[#f5f5dc]/50 transition-colors hover:bg-[#f5f5dc]/5 hover:text-[#f5f5dc]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <section className="space-y-6">
          {/* Header */}
          <div className="rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-6 backdrop-blur-xl">
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-[#f5f5dc]/60">{description}</p>
            )}
          </div>

          {/* Tab Content with Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   IMPERIUM CARD COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

type ImperiumCardProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
  children: ReactNode;
  className?: string;
};

export function ImperiumCard({
  title,
  description,
  icon,
  badge,
  children,
  className,
}: ImperiumCardProps) {
  return (
    <div className={`rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl overflow-hidden ${className}`}>
      <div className="border-b border-[#f5f5dc]/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10">
                <span className="text-[#d4af37]">{icon}</span>
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-[#f5f5dc]">{title}</h3>
              {description && (
                <p className="text-xs text-[#f5f5dc]/50">{description}</p>
              )}
            </div>
          </div>
          {badge && (
            <span className="rounded-full bg-[#d4af37]/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#d4af37]">
              {badge}
            </span>
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   IMPERIUM FORM COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

type ImperiumInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function ImperiumInput({ label, className, ...props }: ImperiumInputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-[#f5f5dc]/70">{label}</label>
      )}
      <input
        {...props}
        className={`w-full rounded-xl border border-[#f5f5dc]/10 bg-[#050a18]/80 px-4 py-2.5 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 transition-all duration-200 focus:border-[#d4af37]/50 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      />
    </div>
  );
}

type ImperiumButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "destructive";
  size?: "sm" | "md" | "lg";
};

export function ImperiumButton({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ImperiumButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50";
  
  const variantStyles = {
    primary: "bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#050a18] shadow-[0_4px_20px_-4px_rgba(212,175,55,0.4)] hover:shadow-[0_8px_28px_-4px_rgba(212,175,55,0.5)]",
    secondary: "border border-[#f5f5dc]/20 bg-[#050a18]/60 text-[#f5f5dc] hover:border-[#d4af37]/40 hover:bg-[#d4af37]/10",
    destructive: "border border-[#e11d48]/30 bg-[#e11d48]/10 text-[#e11d48] hover:bg-[#e11d48]/20",
  };

  const sizeStyles = {
    sm: "rounded-lg px-3 py-1.5 text-xs",
    md: "rounded-xl px-5 py-2.5 text-sm",
    lg: "rounded-2xl px-7 py-3 text-sm",
  };

  return (
    <button
      {...props}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   IMPERIUM TOGGLE SWITCH
   ═══════════════════════════════════════════════════════════════════════════ */

type ImperiumToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
};

export function ImperiumToggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: ImperiumToggleProps) {
  return (
    <div className="flex items-center justify-between">
      {(label || description) && (
        <div>
          {label && <div className="text-sm font-medium text-[#f5f5dc]">{label}</div>}
          {description && <div className="text-xs text-[#f5f5dc]/50">{description}</div>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        title={label || "Toggle switch"}
        className={`relative h-6 w-11 rounded-full transition-all duration-200 ${
          checked
            ? "bg-gradient-to-r from-[#d4af37] to-[#f9d976] shadow-[0_0_12px_rgba(212,175,55,0.4)]"
            : "bg-[#f5f5dc]/10"
        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        <motion.span
          className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-[#050a18] shadow-md"
          animate={{ x: checked ? 20 : 0 }}
          transition={{ duration: 0.2 }}
        />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   IMPERIUM TABLE
   ═══════════════════════════════════════════════════════════════════════════ */

type ImperiumTableProps = {
  headers: string[];
  children: ReactNode;
};

export function ImperiumTable({ headers, children }: ImperiumTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#f5f5dc]/10">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#f5f5dc]/10 bg-[#050a18]/60">
            {headers.map((header, index) => (
              <th
                key={index}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#f5f5dc]/50 ${
                  index === headers.length - 1 ? "text-right" : ""
                }`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f5f5dc]/5">{children}</tbody>
      </table>
    </div>
  );
}

export function ImperiumTableRow({ children }: { children: ReactNode }) {
  return (
    <tr className="transition-colors hover:bg-[#d4af37]/5">{children}</tr>
  );
}

export function ImperiumTableCell({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td className={`px-4 py-3 text-sm text-[#f5f5dc] ${align === "right" ? "text-right" : ""}`}>
      {children}
    </td>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROLE BADGE
   ═══════════════════════════════════════════════════════════════════════════ */

type RoleBadgeProps = {
  role: "owner" | "admin" | "editor" | "viewer" | "member" | string;
};

const roleConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  owner: { icon: <Crown className="h-3 w-3" />, label: "Owner", color: "#d4af37" },
  admin: { icon: <Shield className="h-3 w-3" />, label: "Admin", color: "#d4af37" },
  editor: { icon: <Edit className="h-3 w-3" />, label: "Editor", color: "#10b981" },
  viewer: { icon: <Eye className="h-3 w-3" />, label: "Viewer", color: "#6b7280" },
  member: { icon: <User className="h-3 w-3" />, label: "Member", color: "#f5f5dc" },
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const config = roleConfig[role] || { icon: <User className="h-3 w-3" />, label: role, color: "#f5f5dc" };
  
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
      style={{
        backgroundColor: `${config.color}15`,
        color: config.color,
      }}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPLIANCE BADGE
   ═══════════════════════════════════════════════════════════════════════════ */

export function MetaComplianceBadge() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
        <BadgeCheck className="h-5 w-5 text-emerald-400" />
      </div>
      <div>
        <div className="text-sm font-semibold text-emerald-400">Verified Secure Environment</div>
        <div className="text-xs text-emerald-400/60">Meta Platform Compliance Verified</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ACTIVITY LOG ITEM
   ═══════════════════════════════════════════════════════════════════════════ */

type ActivityLogItemProps = {
  action: string;
  user: string;
  timestamp: string;
  icon?: React.ReactNode;
};

export function ActivityLogItem({ action, user, timestamp, icon }: ActivityLogItemProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[#f5f5dc]/5 bg-[#050a18]/40 p-4 transition-colors hover:border-[#d4af37]/20">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f5f5dc]/5 text-[#f5f5dc]/60">
        {icon || <Activity className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[#f5f5dc]">{action}</div>
        <div className="text-xs text-[#f5f5dc]/40">by {user}</div>
      </div>
      <div className="text-xs text-[#f5f5dc]/30">{timestamp}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   EXPORT TAB ICONS
   ═══════════════════════════════════════════════════════════════════════════ */

export const SettingsTabIcons = {
  profile: <User className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  billing: <CreditCard className="h-4 w-4" />,
  audit: <ScrollText className="h-4 w-4" />,
  members: <Users className="h-4 w-4" />,
};
