"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, CreditCard, LogOut, ChevronDown } from "lucide-react";

type RoyalAvatarProps = {
  name: string;
  email: string;
  avatarUrl?: string | null;
  settingsHref: string;
  billingHref: string;
};

function getInitials(name: string, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export function RoyalAvatar({
  name,
  email,
  avatarUrl,
  settingsHref,
  billingHref,
}: RoyalAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("appUI.avatar");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = getInitials(name, email);
  const displayName = name || email.split("@")[0];

  const menuItems = [
    { href: settingsHref, label: t("settings"), icon: Settings },
    { href: billingHref, label: t("billing"), icon: CreditCard },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2 rounded-full p-1 transition-all duration-200 hover:bg-[#0a1229]/60"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar Circle with Gold Gradient Border */}
        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-[#d4af37] to-[#f9d976] p-[2px] shadow-[0_0_12px_rgba(212,175,55,0.35)]">
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#050a18]">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">
                {initials}
              </span>
            )}
          </div>
        </div>
        <ChevronDown 
          className={`hidden h-4 w-4 text-[#f5f5dc]/50 transition-transform duration-200 md:block ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/95 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            {/* User Info Header */}
            <div className="border-b border-[#f5f5dc]/10 px-4 py-3">
              <p className="truncate text-sm font-medium text-[#f5f5dc]">{displayName}</p>
              <p className="truncate text-xs text-[#f5f5dc]/50">{email}</p>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#f5f5dc]/80 transition-colors hover:bg-[#d4af37]/10 hover:text-[#f5f5dc]"
                  >
                    <Icon className="h-4 w-4 text-[#d4af37]" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Logout */}
            <div className="border-t border-[#f5f5dc]/10 py-2">
              <Link
                href="/logout"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#e11d48]/80 transition-colors hover:bg-[#e11d48]/10 hover:text-[#e11d48]"
              >
                <LogOut className="h-4 w-4" />
                {t("logout")}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SIDEBAR USER IDENTITY CARD
   ═══════════════════════════════════════════════════════════════════════════ */

type SidebarUserCardProps = {
  name: string;
  email: string;
  avatarUrl?: string | null;
  tier?: string;
};

export function SidebarUserCard({
  name,
  email,
  avatarUrl,
  tier = "Imperium Founder",
}: SidebarUserCardProps) {
  const initials = getInitials(name, email);
  const displayName = name || email.split("@")[0];

  return (
    <div className="mt-auto">
      <div className="rounded-2xl border border-[#d4af37]/20 bg-[#050a18]/60 p-4 backdrop-blur">
        <div className="flex items-center gap-3">
          {/* Avatar with Gold Border */}
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#d4af37] to-[#f9d976] p-[2px] shadow-[0_0_10px_rgba(212,175,55,0.3)]">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#050a18]">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={44}
                  height={44}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">
                  {initials}
                </span>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#f5f5dc]">{displayName}</p>
            <p className="truncate text-[11px] font-medium bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">
              {tier}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
