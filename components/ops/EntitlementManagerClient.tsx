"use client";
import { logger } from "@/lib/logging";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  Shield,
  Key,
  CheckCircle2,
  XCircle,
  Unlock,
  Lock,
  Zap,
  User,
  Building2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   TYPES
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

type WorkspaceSearchResult = {
  id: string;
  name: string;
  slug: string;
  owner_email: string | null;
  created_at: string | null;
};

type Entitlement = {
  key: string;
  enabled: boolean;
  source: "plan" | "grant";
  granted_by?: string | null;
  granted_at?: string | null;
  reason?: string | null;
  expires_at?: string | null;
};

type WorkspaceDetail = {
  id: string;
  name: string;
  slug: string;
  created_at: string | null;
  owner_email: string | null;
  plan_code: string | null;
  subscription_status: string | null;
  entitlements: Entitlement[];
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ENTITLEMENT DISPLAY CONFIG
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const ENTITLEMENT_META: Record<string, { label: string; description: string; icon: string }> = {
  core_os: { label: "Core OS", description: "Platform core functionality", icon: "ðŸ " },
  meta_hub: { label: "Meta Hub", description: "WhatsApp, Instagram, Messenger integration", icon: "ðŸ“±" },
  studio: { label: "Studio", description: "Creative suite (Office, Graph, Tracks)", icon: "ðŸŽ¨" },
  helper: { label: "Helper", description: "AI Assistant, Chat, RAG, Workflows", icon: "ðŸ¤–" },
  office: { label: "Office", description: "AI document automation", icon: "ðŸ“„" },
  marketplace: { label: "Marketplace", description: "Digital product marketplace", icon: "ðŸ›’" },
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN CLIENT COMPONENT
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

type Props = {
  initialWorkspaceId?: string;
};

export function EntitlementManagerClient({ initialWorkspaceId }: Props) {
  const t = useTranslations("opsUI");
  const { toast } = useToast();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<WorkspaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  
  // Grant form state
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [grantReason, setGrantReason] = useState("");
  const [granting, setGranting] = useState(false);
  
  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
    variant: "default" | "destructive";
  }>({ open: false, title: "", description: "", action: async () => {}, variant: "default" });

  // Load available entitlement keys on mount
  useEffect(() => {
    async function loadKeys() {
      try {
        const res = await fetch("/api/ops/entitlement-grants?keys=true");
        const data = await res.json();
        setAvailableKeys(data.keys ?? []);
      } catch (err) {
        logger.error("Failed to load entitlement keys:", err);
      }
    }
    loadKeys();
  }, []);

  // Auto-load workspace if initialWorkspaceId is provided
  useEffect(() => {
    if (initialWorkspaceId) {
      (async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/ops/entitlement-grants?workspaceId=${initialWorkspaceId}`);
          const data = await res.json();
          if (data.workspace) {
            setSelectedWorkspace(data.workspace);
          }
        } catch (err) {
          logger.error("Auto-load workspace error:", err);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [initialWorkspaceId]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const res = await fetch(`/api/ops/entitlement-grants?search=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data.workspaces ?? []);
      } catch (err) {
        logger.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Select workspace and load details
  const selectWorkspace = useCallback(async (ws: WorkspaceSearchResult) => {
    setLoading(true);
    setSearchQuery("");
    setSearchResults([]);
    try {
      const res = await fetch(`/api/ops/entitlement-grants?workspaceId=${ws.id}`);
      const data = await res.json();
      if (data.workspace) {
        setSelectedWorkspace(data.workspace);
      } else {
        toast({ title: "Error", description: "Workspace not found", variant: "destructive" });
      }
    } catch (err) {
      logger.error("Load workspace error:", err);
      toast({ title: "Error", description: "Failed to load workspace", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Refresh workspace details
  const refreshWorkspace = useCallback(async () => {
    if (!selectedWorkspace) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ops/entitlement-grants?workspaceId=${selectedWorkspace.id}`);
      const data = await res.json();
      if (data.workspace) {
        setSelectedWorkspace(data.workspace);
      }
    } catch (err) {
      logger.error("Refresh error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedWorkspace]);

  // Grant single entitlement
  const handleGrant = useCallback(async () => {
    if (!selectedWorkspace || !selectedKey) return;
    setGranting(true);
    try {
      const res = await fetch("/api/ops/entitlement-grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grant",
          workspaceId: selectedWorkspace.id,
          entitlementKey: selectedKey,
          reason: grantReason || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "âœ… Granted!",
          description: `${ENTITLEMENT_META[selectedKey]?.label || selectedKey} unlocked for ${selectedWorkspace.name}`,
        });
        setSelectedKey("");
        setGrantReason("");
        await refreshWorkspace();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      logger.error("Grant error:", err);
      toast({ title: "Error", description: "Failed to grant entitlement", variant: "destructive" });
    } finally {
      setGranting(false);
    }
  }, [selectedWorkspace, selectedKey, grantReason, toast, refreshWorkspace]);

  // Revoke single entitlement
  const handleRevoke = useCallback(async (key: string) => {
    if (!selectedWorkspace) return;
    setConfirmDialog({
      open: true,
      title: "Revoke Access?",
      description: `This will lock ${ENTITLEMENT_META[key]?.label || key} for ${selectedWorkspace.name}. The workspace will lose access immediately.`,
      variant: "destructive",
      action: async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/ops/entitlement-grants", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "revoke",
              workspaceId: selectedWorkspace.id,
              entitlementKey: key,
              reason: "Revoked by platform admin",
            }),
          });
          const data = await res.json();
          if (data.success) {
            toast({
              title: "ðŸ”’ Revoked",
              description: `${ENTITLEMENT_META[key]?.label || key} locked for ${selectedWorkspace.name}`,
            });
            await refreshWorkspace();
          } else {
            toast({ title: "Error", description: data.error, variant: "destructive" });
          }
        } catch (err) {
          logger.error("Revoke error:", err);
        } finally {
          setLoading(false);
        }
      },
    });
  }, [selectedWorkspace, toast, refreshWorkspace]);

  // Grant ALL entitlements
  const handleGrantAll = useCallback(async () => {
    if (!selectedWorkspace) return;
    setConfirmDialog({
      open: true,
      title: "ðŸ”¥ Unlock All Products?",
      description: `This will grant access to ALL products for ${selectedWorkspace.name}. This is typically used for premium partners or internal testing.`,
      variant: "default",
      action: async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/ops/entitlement-grants", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "grant_all",
              workspaceId: selectedWorkspace.id,
              reason: "Full platform access granted by admin",
            }),
          });
          const data = await res.json();
          if (data.success) {
            toast({
              title: "ðŸŽ‰ All Products Unlocked!",
              description: `${data.granted?.length || 0} products granted to ${selectedWorkspace.name}`,
            });
            await refreshWorkspace();
          } else {
            toast({ title: "Error", description: data.errors?.join(", ") || "Failed", variant: "destructive" });
          }
        } catch (err) {
          logger.error("Grant all error:", err);
        } finally {
          setLoading(false);
        }
      },
    });
  }, [selectedWorkspace, toast, refreshWorkspace]);

  // Revoke ALL entitlements (reset to plan)
  const handleResetToPlan = useCallback(async () => {
    if (!selectedWorkspace) return;
    setConfirmDialog({
      open: true,
      title: "ðŸ”’ Reset to Plan?",
      description: `This will REVOKE all grants and reset ${selectedWorkspace.name} to their subscription plan only. All manual grants will be removed.`,
      variant: "destructive",
      action: async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/ops/entitlement-grants", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "revoke_all",
              workspaceId: selectedWorkspace.id,
              reason: "Reset to plan by admin",
            }),
          });
          const data = await res.json();
          if (data.success) {
            toast({
              title: "Reset Complete",
              description: `${data.revoked?.length || 0} grants revoked from ${selectedWorkspace.name}`,
            });
            await refreshWorkspace();
          } else {
            toast({ title: "Error", description: data.errors?.join(", ") || "Failed", variant: "destructive" });
          }
        } catch (err) {
          logger.error("Reset error:", err);
        } finally {
          setLoading(false);
        }
      },
    });
  }, [selectedWorkspace, toast, refreshWorkspace]);

  // Get ungrated keys for dropdown
  const ungrantedKeys = availableKeys.filter(
    (key) => !selectedWorkspace?.entitlements.find((e) => e.key === key && e.enabled)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10 shadow-lg shadow-[#d4af37]/10">
          <Key className="h-6 w-6 text-[#d4af37]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#f5f5dc]">{t("entitlements.title")}</h1>
          <p className="text-sm text-[#f5f5dc]/60">{t("entitlements.subtitle")}</p>
        </div>
      </div>

      {/* Search Section */}
      <div className="rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#f5f5dc]/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("entitlements.searchPlaceholder")}
            className="h-12 w-full rounded-xl border-[#d4af37]/30 bg-[#050a18] pl-12 text-lg text-[#f5f5dc] placeholder:text-[#f5f5dc]/30"
          />
          {searching && (
            <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-[#d4af37]" />
          )}
        </div>

        {/* Search Results */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 space-y-2"
            >
              {searchResults.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => selectWorkspace(ws)}
                  className="flex w-full items-center justify-between rounded-xl border border-[#d4af37]/20 bg-[#050a18]/60 p-4 text-left transition-all hover:border-[#d4af37]/50 hover:bg-[#d4af37]/10"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-[#d4af37]" />
                    <div>
                      <p className="font-medium text-[#f5f5dc]">{ws.name}</p>
                      <p className="text-sm text-[#f5f5dc]/50">/{ws.slug}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-[#f5f5dc]/40">
                    <p>{ws.owner_email || "No owner"}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
        </div>
      )}

      {/* Selected Workspace Detail */}
      {selectedWorkspace && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Workspace Info Card */}
          <div className="rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10">
                  <Building2 className="h-7 w-7 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#f5f5dc]">{selectedWorkspace.name}</h2>
                  <p className="text-sm text-[#f5f5dc]/50">/{selectedWorkspace.slug}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshWorkspace}
                className="border-[#d4af37]/30"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-[#050a18]/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-[#f5f5dc]/40">Owner</p>
                <p className="mt-1 flex items-center gap-2 text-[#f5f5dc]">
                  <User className="h-4 w-4 text-[#d4af37]" />
                  {selectedWorkspace.owner_email || "Unknown"}
                </p>
              </div>
              <div className="rounded-xl bg-[#050a18]/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-[#f5f5dc]/40">Plan</p>
                <p className="mt-1 flex items-center gap-2 text-[#f5f5dc]">
                  <Shield className="h-4 w-4 text-[#d4af37]" />
                  {selectedWorkspace.plan_code || "free_locked"}
                </p>
              </div>
              <div className="rounded-xl bg-[#050a18]/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-[#f5f5dc]/40">Status</p>
                <p className="mt-1 flex items-center gap-2 text-[#f5f5dc]">
                  <Zap className="h-4 w-4 text-emerald-400" />
                  {selectedWorkspace.subscription_status || "unknown"}
                </p>
              </div>
            </div>
          </div>

          {/* Entitlements Grid */}
          <div className="rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#f5f5dc]">Product Entitlements</h3>
              <div className="flex gap-2">
                <Button
                  onClick={handleGrantAll}
                  className="bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#0a0a0a] hover:opacity-90"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Unlock All
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResetToPlan}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Reset to Plan
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {selectedWorkspace.entitlements.map((ent) => {
                const meta = ENTITLEMENT_META[ent.key] || { label: ent.key, description: "", icon: "ðŸ“¦" };
                return (
                  <div
                    key={ent.key}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-4 transition-all",
                      ent.enabled
                        ? "border-emerald-500/30 bg-emerald-500/10"
                        : "border-[#f5f5dc]/10 bg-[#050a18]/60"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{meta.icon}</span>
                      <div>
                        <p className={cn("font-medium", ent.enabled ? "text-emerald-300" : "text-[#f5f5dc]/60")}>
                          {meta.label}
                        </p>
                        <p className="text-xs text-[#f5f5dc]/40">{meta.description}</p>
                        {ent.enabled && ent.granted_by && (
                          <p className="mt-1 text-[10px] text-emerald-400/60">
                            Granted by {ent.granted_by}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {ent.enabled ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevoke(ent.key)}
                            className="h-8 text-red-400 hover:bg-red-500/10"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <XCircle className="h-5 w-5 text-[#f5f5dc]/30" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grant Form */}
          {ungrantedKeys.length > 0 && (
            <div className="rounded-2xl border border-[#d4af37]/20 bg-[#0a1229] backdrop-blur-xl p-6 shadow-xl">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#f5f5dc]">
                <Unlock className="h-5 w-5 text-[#d4af37]" />
                Grant New Entitlement
              </h3>
              <div className="grid gap-4 sm:grid-cols-[1fr_2fr_auto]">
                <Select value={selectedKey} onValueChange={setSelectedKey}>
                  <SelectTrigger className="border-[#d4af37]/30 bg-[#050a18]">
                    <SelectValue placeholder="Select product..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a1229] border-[#d4af37]/20">
                    {ungrantedKeys.map((key) => (
                      <SelectItem key={key} value={key}>
                        {ENTITLEMENT_META[key]?.icon} {ENTITLEMENT_META[key]?.label || key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="Reason (optional): e.g., Partner account, Beta tester..."
                  className="border-[#d4af37]/30 bg-[#050a18]"
                />
                <Button
                  onClick={handleGrant}
                  disabled={!selectedKey || granting}
                  className="bg-[#d4af37] text-[#0a0a0a] hover:bg-[#f9d976]"
                >
                  {granting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Unlock className="mr-2 h-4 w-4" />
                  )}
                  {t("entitlements.addGrant")}
                </Button>
              </div>
            </div>
          )}

          {/* Close Selection */}
          <Button
            variant="outline"
            onClick={() => setSelectedWorkspace(null)}
            className="w-full border-[#f5f5dc]/20"
          >
            Close & Search Another Workspace
          </Button>
        </motion.div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open: boolean) => setConfirmDialog((prev) => ({ ...prev, open }))}>
        <AlertDialogContent className="border-[#d4af37]/20 bg-[#0a1229]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#f5f5dc]">{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-[#f5f5dc]/60">
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#f5f5dc]/20">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await confirmDialog.action();
                setConfirmDialog((prev) => ({ ...prev, open: false }));
              }}
              className={cn(
                confirmDialog.variant === "destructive"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-[#d4af37] text-[#0a0a0a] hover:bg-[#f9d976]"
              )}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
