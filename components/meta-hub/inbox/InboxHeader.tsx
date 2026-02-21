"use client";

import { useTranslations } from "next-intl";
import {
  Wifi,
  WifiOff,
  AlertCircle,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "./types";

/* ═════════════════════════════════════════════════════════════════════
   INBOX HEADER with Connection Status
   ═════════════════════════════════════════════════════════════════════ */

interface InboxHeaderProps {
  unreadCount: number;
  connectionStatus?: ConnectionStatus;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export function InboxHeader({ unreadCount, connectionStatus = "connected", soundEnabled = false, onToggleSound }: InboxHeaderProps) {
  const t = useTranslations("metaHubUI.inbox.header");
  const statusConfig = {
    connected: {
      icon: Wifi,
      color: "text-[#10b981]",
      bgColor: "bg-[#10b981]/10",
      borderColor: "border-[#10b981]/40",
      label: t("connected"),
      pulse: false,
    },
    connecting: {
      icon: Wifi,
      color: "text-[#f59e0b]",
      bgColor: "bg-[#f59e0b]/10",
      borderColor: "border-[#f59e0b]/40",
      label: t("connecting"),
      pulse: true,
    },
    disconnected: {
      icon: WifiOff,
      color: "text-[#6b7280]",
      bgColor: "bg-[#6b7280]/10",
      borderColor: "border-[#6b7280]/40",
      label: t("offline"),
      pulse: false,
    },
    error: {
      icon: AlertCircle,
      color: "text-[#e11d48]",
      bgColor: "bg-[#e11d48]/10",
      borderColor: "border-[#e11d48]/40",
      label: t("connectionError"),
      pulse: true,
    },
  };

  const status = statusConfig[connectionStatus];
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center justify-between border-b border-[#d4af37]/10 bg-gradient-to-r from-[#0a1229] to-[#050a18] px-6 py-4">
      <div>
        <div className="mb-1 flex items-center gap-3">
          <span className="rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-3 py-0.5 text-xs font-semibold tracking-wider text-[#f9d976]">
            {t("pillarLabel")}
          </span>
          <span className="text-xs text-[#f5f5dc]/50">{t("imperialInbox")}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#f5f5dc]">
          {t("gigavizMessages")}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {onToggleSound && (
          <button
            onClick={onToggleSound}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
              soundEnabled
                ? "border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                : "border-[#d4af37]/30 bg-[#d4af37]/5 text-[#f5f5dc]/60 hover:border-[#d4af37]/50 hover:bg-[#d4af37]/10"
            )}
            title="Toggle interface blip sound when switching chats"
          >
            <Volume2 className={cn("h-4 w-4", soundEnabled ? "text-[#10b981]" : "text-[#f5f5dc]/60")} />
            <span>{soundEnabled ? t("soundOn") : t("soundOff")}</span>
          </button>
        )}

        {/* Connection Status Indicator */}
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-all",
            status.bgColor,
            status.borderColor
          )}
        >
          <div className="relative flex h-3 w-3 items-center justify-center">
            {status.pulse && (
              <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", status.bgColor)} />
            )}
            <StatusIcon className={cn("relative h-3 w-3", status.color)} />
          </div>
          <span className={cn("text-xs font-medium", status.color)}>{status.label}</span>
        </div>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-[#e11d48]/40 bg-[#e11d48]/10 px-4 py-2">
            <div className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e11d48] opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-[#e11d48]" />
            </div>
            <span className="text-sm font-semibold text-[#e11d48]">{unreadCount} {t("unread")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
