"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Wifi, Bot, Store, AlertCircle } from "lucide-react";
import type { ModuleRegistryItem } from "@/lib/modules/registry";

type ConnectionStatus = "active" | "locked" | "coming_soon";

type ServiceItem = {
  name: string;
  status: ConnectionStatus;
  icon: React.ReactNode;
};

const statusConfigBase: Record<ConnectionStatus, { labelKey: string; color: string; pulse: boolean }> = {
  active: { labelKey: "statusActive", color: "#10b981", pulse: true },
  locked: { labelKey: "statusLocked", color: "#d4af37", pulse: false },
  coming_soon: { labelKey: "statusPlanned", color: "#6b7280", pulse: false },
};

const serviceKeyMap = [
  { key: "meta_hub", labelKey: "serviceMetaHub" as const, icon: <Wifi className="h-4 w-4" /> },
  { key: "helper", labelKey: "serviceHelperAI" as const, icon: <Bot className="h-4 w-4" /> },
  { key: "marketplace", labelKey: "serviceMarketplace" as const, icon: <Store className="h-4 w-4" /> },
];

type EcosystemHealthWidgetProps = {
  modules: ModuleRegistryItem[];
};

export function EcosystemHealthWidget({ modules }: EcosystemHealthWidgetProps) {
  const t = useTranslations("dashboardWidgetsUI");
  const services = useMemo<ServiceItem[]>(
    () =>
      serviceKeyMap.map((item) => {
        const mod = modules.find((module) => module.key === item.key);
        const status: ConnectionStatus =
          mod?.status === "available" ? "active" : mod?.status === "locked" ? "locked" : "coming_soon";
        return { name: mod?.name ?? t(item.labelKey), status, icon: item.icon };
      }),
    [modules, t]
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-5 backdrop-blur-xl">
      {/* Subtle gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-50 gradient-overlay-gold-tr"
        aria-hidden
      />
      
      <div className="relative">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-[#d4af37]" />
          <h3 className="text-sm font-semibold text-[#f5f5dc]">{t("systemConnectivity")}</h3>
        </div>
        
        <div className="mt-4 space-y-3">
          {services.map((service, index) => {
            const config = statusConfigBase[service.status];
            return (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[#f5f5dc]/60">{service.icon}</span>
                  <span className="text-sm text-[#f5f5dc]">{service.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#f5f5dc]/50">{t(config.labelKey)}</span>
                  <div className="relative">
                    <span
                      className="block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    {config.pulse && (
                      <motion.span
                        className="absolute inset-0 rounded-full"
                        style={{ backgroundColor: config.color }}
                        animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
