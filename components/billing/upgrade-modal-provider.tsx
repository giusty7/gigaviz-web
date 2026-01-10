"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import UpgradeModal from "@/components/billing/upgrade-modal";

type UpgradeModalContext = {
  open: () => void;
  close: () => void;
};

const UpgradeContext = createContext<UpgradeModalContext | null>(null);

export function UpgradeModalProvider({
  children,
  billingHref,
}: {
  children: React.ReactNode;
  billingHref?: string;
}) {
  const [open, setOpen] = useState(false);

  const value = useMemo(
    () => ({
      open: () => setOpen(true),
      close: () => setOpen(false),
    }),
    []
  );

  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <UpgradeContext.Provider value={value}>
      {children}
      <UpgradeModal
        open={open}
        onOpenChange={setOpen}
        onClose={handleClose}
        billingHref={billingHref}
      />
    </UpgradeContext.Provider>
  );
}

export function useUpgradeModal() {
  const ctx = useContext(UpgradeContext);
  if (!ctx) {
    throw new Error("useUpgradeModal must be used within UpgradeModalProvider");
  }
  return ctx;
}
