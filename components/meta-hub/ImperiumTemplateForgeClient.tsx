"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight, X, Loader2, Send, Eye, TestTube, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SendTestTemplateModal } from "./SendTestTemplateModal";
import { ParamMappingEditorModal } from "./ParamMappingEditorModal";
import { CreateCampaignWizard } from "./CreateCampaignWizard";
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
import type { WaTemplate } from "@/types/wa-templates";

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
  const t = useTranslations("metaHubUI.templateForge");
  const { toast } = useToast();

  // Connection state
  const [connectionId, setConnectionId] = useState(() => {
    const active = connections.find((c) => c.status?.toLowerCase() === "active");
    return active?.id ?? connections[0]?.id ?? "";
  });
  const activeConnection = connections.find((c) => c.id === connectionId) ?? null;
  const hasConnection = Boolean(activeConnection);
  const connectHref = `/${workspaceSlug}/meta-hub/connections`;

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

  const selectedTemplateNormalized: WaTemplate | null = useMemo(() => {
    if (!selectedTemplate) return null;
    const variable_count = selectedTemplate.variable_count ?? extractVariableCount(selectedTemplate.body ?? "");
    const metaPayload = (selectedTemplate as { meta_payload?: unknown }).meta_payload ?? null;
    const metaResponse = (selectedTemplate as { meta_response?: unknown }).meta_response ?? null;
    return {
      ...selectedTemplate,
      workspace_id: selectedTemplate.workspace_id ?? workspaceId,
      variable_count,
      components_json: selectedTemplate.components_json ?? null,
      has_buttons: selectedTemplate.has_buttons ?? Boolean(selectedTemplate.buttons),
      meta_payload: metaPayload,
      meta_response: metaResponse,
    } as WaTemplate;
  }, [selectedTemplate, workspaceId]);

  // Modal states
  const [sendTestOpen, setSendTestOpen] = useState(false);
  const [paramMappingOpen, setParamMappingOpen] = useState(false);
  const [campaignWizardOpen, setCampaignWizardOpen] = useState(false);

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
        title: t("syncFailed"),
        description: err instanceof Error ? err.message : t("syncFailed"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug, activeConnection, toast, t]);

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
        title: t("syncComplete"),
        description: t("syncResult", { inserted: data?.inserted ?? 0, updated: data?.updated ?? 0 }),
      });
      await fetchTemplates();
    } catch (err) {
      toast({
        title: t("syncFailed"),
        description: err instanceof Error ? err.message : t("syncFailed"),
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  }, [workspaceId, activeConnection, toast, fetchTemplates, t]);

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
          newErrors.name = t("validationName");
        }
        if (!/^[a-z0-9_]+$/.test(templateState.name)) {
          newErrors.name = t("validationNameChars");
        }
      }

      if (step === 3) {
        if (!templateState.bodyText || templateState.bodyText.length < 10) {
          newErrors.bodyText = t("validationBody");
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [templateState, t]
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

      toast({ title: t("submitted"), description: t("submittedDesc", { name: templateState.name }) });
      closeWizard();
      await fetchTemplates();
    } catch (err) {
      toast({
        title: t("submitFailed"),
        description: err instanceof Error ? err.message : t("submitFailed"),
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }, [templateState, wizardStep, validateStep, workspaceId, activeConnection, toast, closeWizard, fetchTemplates, t]);

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
          <ForgeHeader onSync={hasConnection ? handleSync : undefined} syncing={syncing} />
        </motion.div>

        {!hasConnection && (
          <motion.div
            variants={itemVariants}
            className="flex flex-col gap-4 rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-6"
          >
            <div>
              <p className="text-sm font-semibold text-[#f5f5dc]">{t("noTemplatesFound")}</p>
              <p className="mt-1 text-sm text-[#f5f5dc]/60">
                {t("noTemplatesDesc")}
              </p>
            </div>
            <Link href={connectHref} className="w-fit">
              <Button className="bg-gradient-to-br from-[#d4af37] to-[#b8962e] text-[#050a18] hover:from-[#f9d976] hover:to-[#d4af37]">
                Connect WhatsApp
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Connection Selector + Search */}
        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4">
          {connections.length > 1 && (
            <select
              value={connectionId}
              onChange={(e) => setConnectionId(e.target.value)}
              title="Select connection"
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
            placeholder={t("searchPlaceholder")}
            disabled={!hasConnection}
            className="flex-1 rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 px-4 py-2.5 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 disabled:opacity-60"
          />
          {canEdit && (
            <>
              <Button
                onClick={() => setCampaignWizardOpen(true)}
                disabled={!hasConnection}
                className="gap-2 bg-gradient-to-br from-[#10b981] to-[#059669] text-white hover:from-[#34d399] hover:to-[#10b981]"
              >
                <Send className="h-4 w-4" />
                {t("createCampaign")}
              </Button>
              <Button
                onClick={openWizard}
                disabled={!hasConnection}
                className="gap-2 bg-gradient-to-br from-[#d4af37] to-[#b8962e] text-[#050a18] hover:from-[#f9d976] hover:to-[#d4af37]"
              >
                <Plus className="h-4 w-4" />
                {t("createTemplate")}
              </Button>
            </>
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
            <>
              <TemplateGrid
                templates={filteredTemplates}
                selectedId={selectedTemplate?.id ?? null}
                onSelect={setSelectedTemplate}
                syncing={syncing}
              />

              {/* Template Detail Panel with Actions */}
              {selectedTemplateNormalized && (
                <div className="mt-6 rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-[#f5f5dc]">{selectedTemplateNormalized.name}</h3>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="rounded bg-[#d4af37]/20 px-2 py-1 text-xs font-semibold text-[#d4af37]">
                          {selectedTemplateNormalized.category ?? "UTILITY"}
                        </span>
                        <span className="rounded bg-[#f5f5dc]/10 px-2 py-1 text-xs text-[#f5f5dc]/60">
                          {selectedTemplateNormalized.language?.toUpperCase()}
                        </span>
                        <span className={cn(
                          "rounded px-2 py-1 text-xs font-semibold",
                          selectedTemplateNormalized.status === "APPROVED" && "bg-[#10b981]/20 text-[#10b981]",
                          selectedTemplateNormalized.status === "REJECTED" && "bg-[#e11d48]/20 text-[#e11d48]",
                          selectedTemplateNormalized.status === "PENDING" && "bg-[#d4af37]/20 text-[#d4af37]"
                        )}>
                          {selectedTemplateNormalized.status ?? "DRAFT"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTemplate(null)}
                      className="rounded-full p-2 text-[#f5f5dc]/40 hover:bg-[#e11d48]/20 hover:text-[#e11d48]"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Template Content Preview */}
                  <div className="mb-6 space-y-3 rounded-xl border border-[#f5f5dc]/10 bg-[#050a18]/50 p-4">
                    {selectedTemplateNormalized.header && (
                      <div className="border-b border-[#f5f5dc]/10 pb-2">
                        <p className="text-xs font-semibold text-[#d4af37]">{t("header")}</p>
                        <p className="mt-1 text-sm text-[#f5f5dc]">{selectedTemplateNormalized.header}</p>
                      </div>
                    )}
                    {selectedTemplateNormalized.body && (
                      <div className="border-b border-[#f5f5dc]/10 pb-2">
                        <p className="text-xs font-semibold text-[#d4af37]">{t("body")}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-[#f5f5dc]">{selectedTemplateNormalized.body}</p>
                        {selectedTemplateNormalized.variable_count > 0 && (
                          <p className="mt-2 text-xs text-[#f5f5dc]/40">
                            Contains {selectedTemplateNormalized.variable_count} parameter{selectedTemplateNormalized.variable_count > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    )}
                    {selectedTemplateNormalized.footer && (
                      <div>
                        <p className="text-xs font-semibold text-[#d4af37]">{t("footer")}</p>
                        <p className="mt-1 text-sm text-[#f5f5dc]/60">{selectedTemplateNormalized.footer}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {selectedTemplateNormalized.status === "APPROVED" && (
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => setSendTestOpen(true)}
                        className="gap-2 bg-gradient-to-br from-[#10b981] to-[#059669] text-white hover:from-[#10b981]/90 hover:to-[#059669]/90"
                      >
                        <TestTube className="h-4 w-4" />
                        Send Test
                      </Button>

                      {selectedTemplateNormalized.variable_count > 0 && (
                        <Button
                          onClick={() => setParamMappingOpen(true)}
                          className="gap-2 border-[#d4af37]/40 bg-[#d4af37]/10 text-[#d4af37] hover:bg-[#d4af37]/20"
                          variant="outline"
                        >
                          <Settings className="h-4 w-4" />
                          {t("editParamMapping")}
                        </Button>
                      )}

                      <Link href={`/${workspaceSlug}/meta-hub/messaging/whatsapp/jobs`}>
                        <Button
                          className="gap-2 border-[#f5f5dc]/20 bg-[#f5f5dc]/5 text-[#f5f5dc] hover:bg-[#f5f5dc]/10"
                          variant="outline"
                        >
                          <Users className="h-4 w-4" />
                          {t("createBatchCampaign")}
                        </Button>
                      </Link>
                    </div>
                  )}

                  {selectedTemplateNormalized?.status === "REJECTED" && selectedTemplateNormalized.rejection_reason && (
                    <div className="mt-4 rounded-lg border border-[#e11d48]/30 bg-[#e11d48]/10 p-4">
                      <p className="text-xs font-semibold text-[#e11d48]">{t("rejectionReason")}</p>
                      <p className="mt-1 text-sm text-[#f5f5dc]/80">{selectedTemplateNormalized.rejection_reason}</p>
                    </div>
                  )}
                </div>
              )}
            </>
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
                    <h2 className="text-xl font-bold text-[#f5f5dc]">{t("heading")}</h2>
                    <p className="text-sm text-[#f5f5dc]/50">{t("description")}</p>
                  </div>
                  <button
                    onClick={closeWizard}
                    title="Close wizard"
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
                    {t("back")}
                  </Button>
                  {wizardStep < 4 ? (
                    <Button
                      onClick={handleNext}
                      className="gap-2 bg-gradient-to-br from-[#d4af37] to-[#b8962e] text-[#050a18]"
                    >
                      {t("next")}
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
                      {t("submitToMeta")}
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
                      <span className="text-xs font-semibold text-[#d4af37]">{t("miragePreview")}</span>
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
                    title="Expand preview"
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

      {/* Send Test Modal */}
      {sendTestOpen && selectedTemplateNormalized && activeConnection && (
        <SendTestTemplateModal
          template={selectedTemplateNormalized}
          connectionId={activeConnection.id}
          onClose={() => setSendTestOpen(false)}
        />
      )}

      {/* Param Mapping Editor Modal */}
      {paramMappingOpen && selectedTemplateNormalized && (
        <ParamMappingEditorModal
          template={selectedTemplateNormalized}
          existingDefs={[]}
          onClose={() => setParamMappingOpen(false)}
          onSaved={() => {
            toast({ title: t("paramMappingsSaved") });
            setParamMappingOpen(false);
          }}
        />
      )}

      {/* Campaign Creation Wizard */}
      {campaignWizardOpen && (
        <CreateCampaignWizard
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
          onClose={() => setCampaignWizardOpen(false)}
          initialTemplateId={selectedTemplate?.id}
        />
      )}
    </div>
  );
}
