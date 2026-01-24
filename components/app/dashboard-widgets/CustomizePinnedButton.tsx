"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { CustomizePinnedDialog } from "./CustomizePinnedDialog";
import type { ModuleRegistryItem } from "@/lib/modules/registry";

type ModuleKey = string;

type CustomizePinnedButtonProps = {
  workspaceId: string;
  currentPinned: ModuleKey[];
  availableModules: ModuleRegistryItem[];
  onSave: () => void;
};

export function CustomizePinnedButton({
  workspaceId,
  currentPinned,
  availableModules,
  onSave,
}: CustomizePinnedButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-[#d4af37]/30 bg-[#0a1229]/60 px-3 py-2 text-xs font-semibold text-[#d4af37] transition hover:border-[#d4af37]/60 hover:bg-[#d4af37]/10"
      >
        <Settings className="h-3.5 w-3.5" />
        Customize
      </button>

      <CustomizePinnedDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        currentPinned={currentPinned}
        availableModules={availableModules}
        onSave={onSave}
      />
    </>
  );
}
