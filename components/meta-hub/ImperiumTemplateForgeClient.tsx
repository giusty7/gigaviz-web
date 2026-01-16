"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight, X, Loader2, Send, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  ForgeHeader,
  StepIndicator,
  Step1HeaderCategory,
  Step2MediaStudio,
  Step3ContentLab,
  Step4Buttons,
  MiragePreview,
  TemplateGrid,
  ImperiumForgeFooter,
  type TemplateState,
  type TemplateRow,
} from "./ImperiumTemplateForgeComponents";

/* ═══════════════════════════════════════════════════════════════════════════
   HYDRATION-SAFE MOUNT CHECK
   ═══════════════════════════════════════════════════════════════════════════ */

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════════════════════ */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
};

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

type Connection = {
  id: string;
  phone_number_id: string | null;
  waba_id: string | null;
  display_name: string | null;
  status: string | null;
};

interface ImperiumTemplateForgeClientProps {
  workspaceId: string;
  workspaceSlug: string;
  canEdit: boolean;
  initialTemplates: TemplateRow[];
  connections: Connection[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

const STEP_LABELS = ["Details", "Media", "Content", "Buttons"];

function getDefaultTemplateState(): TemplateState {
  return {
    name: "",
    language: "id",
    category: "UTILITY",
    headerType: "none",
    headerText: "",
    headerMediaUrl: null,
    bodyText: "",
    footerText: "",
    buttons: [],
    bodyExamples: [],
  };
}

function extractVariableCount(text: string): number {
  const matches = Array.from(text.matchAll(/{{(\d+)}}/g));
  if (matches.length === 0) return 0;
  const nums = matches.map((m) => Number(m[1]));
  return Math.max(0, ...nums);
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN CLIENT COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function ImperiumTemplateForgeClient({
  workspaceId,
  workspaceSlug,
  canEdit,
  initialTemplates,
  connections,
}: ImperiumTemplateForgeClientProps) {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const { toast } = useToast();

  // Connection state
  const [connectionId, setConnectionId] = useState(() => {
    const active = connections.find((c) => c.status?.toLowerCase() === "active");
    return active?.id ?? connections[0]?.id ?? "";
  });
  const activeConnection = connections.find((c) => c.id === connectionId) ?? null;

  // Templates state
  const [templates, setTemplates] = useState<TemplateRow[]>(initialTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateRow | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [templateState, setTemplateState] = useState<TemplateState>(getDefaultTemplateState);
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Preview state
  const [deviceType, setDeviceType] = useState<"iphone" | "android">("iphone");
  const [previewExpanded, setPreviewExpanded] = useState(true);

  // Update body examples when variables change
  const variableCount = useMemo(() => extractVariableCount(templateState.bodyText), [templateState.bodyText]);
  useEffect(() => {
    setTemplateState((prev) => {
      if (variableCount === 0 && prev.bodyExamples.length === 0) return prev;
      if (variableCount === 0) return { ...prev, bodyExamples: [] };
      if (prev.bodyExamples.length === variableCount) return prev;
      const next = Array.from({ length: variableCount }, (_, i) => prev.bodyExamples[i] ?? "");
      return { ...prev, bodyExamples: next };
    });
  }, [variableCount]);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.category ?? "").toLowerCase().includes(q) ||
        (t.status ?? "").toLowerCase().includes(q)
    );
  }, [templates, search]);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    if (!activeConnection) {
      setTemplates([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ workspaceSlug, connectionId: activeConnection.id });
      const res = await fetch(`/api/meta/whatsapp/templates?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.message || "Failed to load templates");
      }
      setTemplates(data.templates ?? []);
    } catch (err) {
      toast({
        title: "Failed to load templates",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug, activeConnection, toast]);

  // Initial fetch
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Sync with Meta
  const handleSync = useCallback(async () => {
    if (!activeConnection) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/meta/whatsapp/templates/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, connectionId: activeConnection.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.message || "Sync failed");
      }
      toast({
        title: "Sync completed",
        description: `Inserted ${data?.inserted ?? 0}, updated ${data?.updated ?? 0}`,
      });
      await fetchTemplates();
    } catch (err) {
      toast({
        title: "Sync failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  }, [workspaceId, activeConnection, toast, fetchTemplates]);

  // Wizard handlers
  const openWizard = useCallback(() => {
    setTemplateState(getDefaultTemplateState());
    setWizardStep(1);
    setErrors({});
    setWizardOpen(true);
  }, []);

  const closeWizard = useCallback(() => {
    setWizardOpen(false);
    setTemplateState(getDefaultTemplateState());
    setWizardStep(1);
    setErrors({});
  }, []);

  const updateTemplateState = useCallback((updates: Partial<TemplateState>) => {
    setTemplateState((prev) => ({ ...prev, ...updates }));
    // Clear related errors
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(updates).forEach((key) => delete next[key]);
      return next;
    });
  }, []);

  const validateStep = useCallback(
    (step: number): boolean => {
      const newErrors: Record<string, string> = {};

      if (step === 1) {
        if (!templateState.name || templateState.name.length < 3) {
          newErrors.name = "Name must be at least 3 characters";
        }
        if (!/^[a-z0-9_]+$/.test(templateState.name)) {
          newErrors.name = "Only lowercase letters, numbers, and underscores allowed";
        }
      }

      if (step === 3) {
        if (!templateState.bodyText || templateState.bodyText.length < 10) {
          newErrors.bodyText = "Body must be at least 10 characters";
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [templateState]
  );

  const handleNext = useCallback(() => {
    if (validateStep(wizardStep)) {
      setWizardStep((prev) => Math.min(prev + 1, 4));
    }
  }, [wizardStep, validateStep]);

  const handleBack = useCallback(() => {
    setWizardStep((prev) => Math.max(prev - 1, 1));
  }, []);

  // Create template
  const handleCreate = useCallback(async () => {
    if (!validateStep(wizardStep) || !activeConnection) return;

    setCreating(true);
    try {
      // Build Meta payload
      const components: unknown[] = [];

      if (templateState.headerType === "text" && templateState.headerText) {
        components.push({ type: "HEADER", format: "TEXT", text: templateState.headerText });
      }
      if (templateState.headerType === "image") {
        components.push({
          type: "HEADER",
          format: "IMAGE",
          example: templateState.headerMediaUrl ? { header_handle: [templateState.headerMediaUrl] } : undefined,
        });
      }

      components.push({
        type: "BODY",
        text: templateState.bodyText,
        example:
          templateState.bodyExamples.length > 0
            ? { body_text: [templateState.bodyExamples] }
            : undefined,
      });

      if (templateState.footerText) {
        components.push({ type: "FOOTER", text: templateState.footerText });
      }

      if (templateState.buttons.length > 0) {
        components.push({
          type: "BUTTONS",
          buttons: templateState.buttons.map((btn) => ({
            type: btn.type,
            text: btn.text,
            ...(btn.type === "URL" && { url: btn.url }),
            ...(btn.type === "PHONE_NUMBER" && { phone_number: btn.phone_number }),
          })),
        });
      }

      const payload = {
        workspaceId,
        connectionId: activeConnection.id,
        name: templateState.name,
        language: templateState.language,
        category: templateState.category,
        components,
      };

      const res = await fetch("/api/meta/whatsapp/templates/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.message || data?.error || "Failed to create template");
      }

      toast({ title: "Template created!", description: `"${templateState.name}" submitted to Meta.` });
      closeWizard();
      await fetchTemplates();
    } catch (err) {
      toast({
        title: "Creation failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }, [templateState, wizardStep, validateStep, workspaceId, activeConnection, toast, closeWizard, fetchTemplates]);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Cyber-Batik Parang Background */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30 L30 0 L60 30 L30 60 Z' fill='none' stroke='%23d4af37' stroke-width='0.5'/%3E%3Cpath d='M15 15 L45 15 L45 45 L15 45 Z' fill='none' stroke='%23d4af37' stroke-width='0.3'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <ForgeHeader onSync={handleSync} syncing={syncing} />
        </motion.div>

        {/* Connection Selector + Search */}
        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4">
          {connections.length > 1 && (
            <select
              value={connectionId}
              onChange={(e) => setConnectionId(e.target.value)}
              className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 px-4 py-2.5 text-sm text-[#f5f5dc] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
            >
              {connections.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0a1229]">
                  {c.display_name ?? c.phone_number_id ?? "Connection"}
                </option>
              ))}
            </select>
          )}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="flex-1 rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 px-4 py-2.5 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
          />
          {canEdit && (
            <Button
              onClick={openWizard}
              className="gap-2 bg-gradient-to-br from-[#d4af37] to-[#b8962e] text-[#050a18] hover:from-[#f9d976] hover:to-[#d4af37]"
            >
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          )}
        </motion.div>

        {/* Template Grid */}
        <motion.div variants={itemVariants}>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
            <span className="text-xs font-semibold tracking-wider text-[#d4af37]">
              TEMPLATE VAULT ({filteredTemplates.length})
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
            </div>
          ) : (
            <TemplateGrid
              templates={filteredTemplates}
              selectedId={selectedTemplate?.id ?? null}
              onSelect={setSelectedTemplate}
              syncing={syncing}
            />
          )}
        </motion.div>

        {/* Footer */}
        <ImperiumForgeFooter />
      </motion.div>

      {/* Wizard Modal */}
      <AnimatePresence>
        {wizardOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeWizard}
              className="absolute inset-0 bg-[#050a18]/90 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative z-10 flex max-h-[90vh] w-full max-w-6xl gap-6 overflow-hidden rounded-3xl border border-[#d4af37]/30 bg-gradient-to-br from-[#0a1229] to-[#050a18] p-6 shadow-2xl shadow-[#d4af37]/10"
            >
              {/* Left: Form */}
              <div className="flex min-w-0 flex-1 flex-col">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[#f5f5dc]">Template Forge</h2>
                    <p className="text-sm text-[#f5f5dc]/50">Create a new message template</p>
                  </div>
                  <button
                    onClick={closeWizard}
                    className="rounded-full p-2 text-[#f5f5dc]/40 hover:bg-[#e11d48]/20 hover:text-[#e11d48]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Step Indicator */}
                <div className="mb-6">
                  <StepIndicator currentStep={wizardStep} totalSteps={4} labels={STEP_LABELS} />
                </div>

                {/* Step Content */}
                <div className="flex-1 overflow-y-auto pr-2">
                  <AnimatePresence mode="wait">
                    {wizardStep === 1 && (
                      <Step1HeaderCategory
                        key="step1"
                        state={templateState}
                        onChange={updateTemplateState}
                        errors={errors}
                      />
                    )}
                    {wizardStep === 2 && (
                      <Step2MediaStudio
                        key="step2"
                        state={templateState}
                        onChange={updateTemplateState}
                      />
                    )}
                    {wizardStep === 3 && (
                      <Step3ContentLab
                        key="step3"
                        state={templateState}
                        onChange={updateTemplateState}
                        errors={errors}
                      />
                    )}
                    {wizardStep === 4 && (
                      <Step4Buttons
                        key="step4"
                        state={templateState}
                        onChange={updateTemplateState}
                      />
                    )}
                  </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="mt-6 flex items-center justify-between border-t border-[#d4af37]/10 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={wizardStep === 1}
                    className="gap-2 border-[#f5f5dc]/20 text-[#f5f5dc]/60"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                  {wizardStep < 4 ? (
                    <Button
                      onClick={handleNext}
                      className="gap-2 bg-gradient-to-br from-[#d4af37] to-[#b8962e] text-[#050a18]"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCreate}
                      disabled={creating}
                      className="gap-2 bg-gradient-to-br from-[#10b981] to-[#059669] text-white"
                    >
                      {creating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Submit to Meta
                    </Button>
                  )}
                </div>
              </div>

              {/* Right: Live Preview */}
              <div
                className={cn(
                  "hidden w-[320px] flex-shrink-0 flex-col items-center rounded-2xl border border-[#d4af37]/10 bg-[#050a18]/50 p-4 lg:flex",
                  !previewExpanded && "w-12"
                )}
              >
                {previewExpanded ? (
                  <>
                    <div className="mb-2 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-[#d4af37]" />
                      <span className="text-xs font-semibold text-[#d4af37]">MIRAGE PREVIEW</span>
                    </div>
                    <MiragePreview
                      state={templateState}
                      deviceType={deviceType}
                      onToggleDevice={() => setDeviceType((d) => (d === "iphone" ? "android" : "iphone"))}
                    />
                  </>
                ) : (
                  <button
                    onClick={() => setPreviewExpanded(true)}
                    className="flex h-full items-center justify-center"
                  >
                    <Eye className="h-5 w-5 text-[#d4af37]" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
