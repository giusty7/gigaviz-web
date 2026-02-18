"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import ContactSalesDialog from "@/components/app/ContactSalesDialog";
import ImperiumModuleGrid, { type ModuleItem } from "@/components/app/ImperiumModuleGrid";
import FeatureInterestDialog from "@/components/app/FeatureInterestDialog";
import type { PlanMeta } from "@/lib/entitlements";
import { Cpu, Sparkles } from "lucide-react";

type ImperiumModulesClientProps = {
  modules: ModuleItem[];
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  userEmail: string;
  planOptions: PlanMeta[];
  defaultPlanId?: string | null;
  title: string;
  subtitle: string;
};

export default function ImperiumModulesClient(props: ImperiumModulesClientProps) {
  const { 
    modules, 
    workspaceId, 
    workspaceName, 
    workspaceSlug, 
    userEmail, 
    planOptions, 
    defaultPlanId,
    title,
    subtitle,
  } = props;
  const t = useTranslations("moduleGridUI");

  return (
    <div className="relative min-h-[600px]">
      {/* Cyber-Batik Pattern Background */}
      <div 
        className="pointer-events-none fixed inset-0 batik-pattern opacity-[0.03]" 
        aria-hidden 
      />

      {/* Content */}
      <div className="relative space-y-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative"
        >
          {/* Decorative Icon */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10 shadow-lg shadow-[#d4af37]/10">
              <Cpu className="h-6 w-6 text-[#d4af37]" />
            </div>
            <div className="flex items-center gap-2 rounded-full bg-[#d4af37]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">
              <Sparkles className="h-3 w-3" />
              {t("products8")}
            </div>
          </div>

          {/* Title with Gold Gradient */}
          <h1 className="text-2xl font-bold md:text-3xl">
            <span className="bg-gradient-to-r from-[#d4af37] via-[#f9d976] to-[#d4af37] bg-clip-text text-transparent">
              {title}
            </span>
          </h1>
          
          {/* Subtitle in Cream */}
          <p className="mt-2 text-sm text-[#f5f5dc]/60 md:text-base">
            {subtitle}
          </p>

          {/* Stats Row */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[#f5f5dc]/50">
                <span className="font-semibold text-emerald-400">7</span> {t("products7")}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Module Grid with Dialogs */}
        <FeatureInterestDialog workspaceId={workspaceId}>
          {(openNotify) => (
            <ContactSalesDialog
              workspaceId={workspaceId}
              workspaceName={workspaceName}
              workspaceSlug={workspaceSlug}
              userEmail={userEmail}
              planOptions={planOptions}
              defaultPlanId={defaultPlanId}
            >
              {(openSalesDialog) => (
                <ImperiumModuleGrid
                  modules={modules}
                  onUnlock={(module) => openSalesDialog(module.planId)}
                  onNotify={(module) => openNotify(module.key, module.name)}
                />
              )}
            </ContactSalesDialog>
          )}
        </FeatureInterestDialog>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="flex items-center justify-center gap-2 py-6 text-center text-xs text-[#f5f5dc]/30"
        >
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#d4af37]/30" />
          <span>{t("commandCenter")}</span>
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#d4af37]/30" />
        </motion.div>
      </div>
    </div>
  );
}
