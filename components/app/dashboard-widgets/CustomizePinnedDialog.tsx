"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  MessageSquare,
  Bot,
  Link2,
  Palette,
  LayoutGrid,
  Store,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import type { ModuleIcon } from "@/lib/modules/catalog";
import type { ModuleRegistryItem } from "@/lib/modules/registry";

type ModuleKey = string;

const MAX_PINNED_MODULES = 6;
const MIN_PINNED_MODULES = 1;

const iconMap: Record<ModuleIcon, LucideIcon> = {
  platform: Building2,
  meta: MessageSquare,
  helper: Bot,
  links: Link2,
  office: LayoutGrid,
  studio: Palette,
  marketplace: Store,
  apps: LayoutGrid,
};

const keyIconOverrides: Record<string, LucideIcon> = {};

type CustomizePinnedDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  currentPinned: ModuleKey[];
  availableModules: ModuleRegistryItem[];
  onSave: (pinnedKeys: ModuleKey[]) => void;
};

export function CustomizePinnedDialog({
  open,
  onOpenChange,
  workspaceId,
  currentPinned,
  availableModules,
  onSave,
}: CustomizePinnedDialogProps) {
  const { toast } = useToast();
  const t = useTranslations("dashboardWidgets.customizeDialog");
  const [selected, setSelected] = useState<ModuleKey[]>(currentPinned);
  const [saving, setSaving] = useState(false);

  // Sync with currentPinned when dialog opens
  useEffect(() => {
    if (open) {
      setSelected(currentPinned);
    }
  }, [open, currentPinned]);

  const toggleModule = useCallback(
    (key: ModuleKey) => {
      setSelected((prev) => {
        if (prev.includes(key)) {
          // Don't allow deselecting if at minimum
          if (prev.length <= MIN_PINNED_MODULES) {
            toast({
              title: t("cannotRemove"),
              description: t("cannotRemoveDesc", { min: MIN_PINNED_MODULES }),
              variant: "destructive",
            });
            return prev;
          }
          return prev.filter((k) => k !== key);
        } else {
          // Don't allow selecting if at maximum
          if (prev.length >= MAX_PINNED_MODULES) {
            toast({
              title: t("maxReached"),
              description: t("maxReachedDesc", { max: MAX_PINNED_MODULES }),
              variant: "destructive",
            });
            return prev;
          }
          return [...prev, key];
        }
      });
    },
    [toast, t]
  );

  const handleSave = useCallback(async () => {
    if (selected.length < MIN_PINNED_MODULES || selected.length > MAX_PINNED_MODULES) {
      toast({
        title: t("invalidSelection"),
        description: t("invalidSelectionDesc", { min: MIN_PINNED_MODULES, max: MAX_PINNED_MODULES }),
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          pinned_modules: selected,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to save preferences");
      }

      toast({
        title: t("saved"),
        description: t("savedDesc"),
      });

      onSave(selected);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t("failedSave"),
        description: error instanceof Error ? error.message : t("failedSaveDesc"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [selected, workspaceId, toast, t, onSave, onOpenChange]);

  // Group modules by status
  const available = availableModules.filter((m) => m.status === "available");
  const beta = availableModules.filter((m) => m.status === "locked");
  const coming = availableModules.filter((m) => m.status === "coming_soon");

  const renderModuleCard = (module: ModuleRegistryItem) => {
    const isSelected = selected.includes(module.key);
    const IconComponent = keyIconOverrides[module.key] ?? iconMap[module.icon];
    const isDisabled = module.status === "coming_soon";

    return (
      <motion.button
        key={module.key}
        onClick={() => !isDisabled && toggleModule(module.key)}
        disabled={isDisabled}
        className={`relative flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
          isSelected
            ? "border-[#d4af37] bg-[#d4af37]/10 shadow-[0_0_12px_rgba(212,175,55,0.2)]"
            : "border-[#d4af37]/20 bg-[#0a1229]/40 hover:border-[#d4af37]/40"
        } ${isDisabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
        whileHover={!isDisabled ? { scale: 1.02 } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
      >
        {/* Selection indicator */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#d4af37] text-[#0a1229]"
            >
              <Sparkles className="h-3 w-3" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Icon */}
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-lg transition-colors ${
            isSelected ? "bg-[#d4af37]/20 text-[#d4af37]" : "bg-[#0a1229] text-slate-400"
          }`}
        >
          <IconComponent className="h-6 w-6" />
        </div>

        {/* Label */}
        <div className="text-center">
          <p
            className={`text-xs font-medium transition-colors ${
              isSelected ? "text-[#d4af37]" : "text-slate-300"
            }`}
          >
            {module.name}
          </p>
          {module.status !== "available" && (
            <span className="mt-1 inline-block text-[10px] text-slate-500 uppercase tracking-wider">
              {module.status}
            </span>
          )}
        </div>
      </motion.button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-[#d4af37]/20 bg-[#0a1229] text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#d4af37]">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {t("description", { min: MIN_PINNED_MODULES, max: MAX_PINNED_MODULES })}{" "}
            <span className="text-slate-300">
              {t("selected", { count: selected.length, max: MAX_PINNED_MODULES })}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-2">
          {/* Available modules */}
          {available.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-emerald-400">{t("available")}</h3>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {available.map(renderModuleCard)}
              </div>
            </div>
          )}

          {/* Beta modules */}
          {beta.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-blue-400">{t("beta")}</h3>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {beta.map(renderModuleCard)}
              </div>
            </div>
          )}

          {/* Coming soon modules */}
          {coming.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-slate-500">{t("comingSoon")}</h3>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 opacity-50">
                {coming.map(renderModuleCard)}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              saving ||
              selected.length < MIN_PINNED_MODULES ||
              selected.length > MAX_PINNED_MODULES
            }
            className="bg-[#d4af37] text-[#0a1229] hover:bg-[#d4af37]/90"
          >
            {saving ? t("saving") : t("saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
