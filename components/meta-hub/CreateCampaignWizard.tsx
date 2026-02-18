"use client";
import { logger } from "@/lib/logging";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Send, Users, FileText, CheckCircle2, ArrowRight, ArrowLeft, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type Template = {
  id: string;
  name: string;
  language: string;
  body?: string | null;
  variable_count?: number | null;
  status?: string;
  category?: string;
  meta_template_id?: string;
};

type Contact = {
  id: string;
  phone: string;
  name?: string | null;
  tags?: string[];
};

type Segment = {
  id: string;
  name: string;
  description?: string | null;
  contact_count?: number;
};

type ParamMapping = {
  name: string;
  type: "manual" | "contact_field" | "expression";
  value: string;
};

type WizardStep = "template" | "params" | "audience" | "review";

interface CreateCampaignWizardProps {
  workspaceId: string;
  workspaceSlug: string;
  onClose: () => void;
  initialTemplateId?: string;
}

export function CreateCampaignWizard({
  workspaceId,
  workspaceSlug,
  onClose,
  initialTemplateId,
}: CreateCampaignWizardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("metaHubUI.campaign");

  const [currentStep, setCurrentStep] = useState<WizardStep>("template");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [jobName, setJobName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplateId || "");
  const [paramMappings, setParamMappings] = useState<ParamMapping[]>([]);
  const [audienceType, setAudienceType] = useState<"all" | "tags" | "segment">("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>("");

  // Data state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const variableCount = selectedTemplate?.variable_count ?? 0;

  // Fetch templates
  useEffect(() => {
    async function fetchTemplates() {
      setLoading(true);
      try {
        const res = await fetch(`/api/meta/whatsapp/templates?workspaceId=${workspaceId}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.templates)) {
          // Only show approved templates
          setTemplates(data.templates.filter((t: Template) => t.status === "APPROVED"));
        }
      } catch (error) {
        logger.error("Failed to fetch templates:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, [workspaceId]);

  // Fetch contacts and segments when on audience step
  useEffect(() => {
    if (currentStep !== "audience") return;

    async function fetchAudienceData() {
      try {
        // Fetch contacts
        const contactsRes = await fetch(`/api/meta/whatsapp/contacts?workspaceId=${workspaceId}`);
        const contactsData = await contactsRes.json();
        if (contactsRes.ok && Array.isArray(contactsData.contacts)) {
          setContacts(contactsData.contacts);
          
          // Extract unique tags
          const allTags = new Set<string>();
          contactsData.contacts.forEach((c: Contact) => {
            c.tags?.forEach((tag) => allTags.add(tag));
          });
          setAvailableTags(Array.from(allTags).sort());
        }

        // Fetch segments
        const segmentsRes = await fetch(`/api/meta/whatsapp/segments?workspaceId=${workspaceId}`);
        const segmentsData = await segmentsRes.json();
        if (segmentsRes.ok && Array.isArray(segmentsData.segments)) {
          setSegments(segmentsData.segments);
        }
      } catch (error) {
        logger.error("Failed to fetch audience data:", error);
      }
    }
    fetchAudienceData();
  }, [currentStep, workspaceId]);

  // Initialize param mappings when template selected
  useEffect(() => {
    if (!selectedTemplate) return;
    
    const count = selectedTemplate.variable_count ?? 0;
    if (count > 0 && paramMappings.length === 0) {
      const initialMappings: ParamMapping[] = [];
      for (let i = 1; i <= count; i++) {
        initialMappings.push({
          name: `{{${i}}}`,
          type: "manual",
          value: "",
        });
      }
      setParamMappings(initialMappings);
    }
  }, [selectedTemplate, paramMappings.length]);

  const handleNext = () => {
    if (currentStep === "template") {
      if (!selectedTemplateId) {
        toast({
          title: t("toasts.templateRequired"),
          description: t("toasts.templateRequiredDesc"),
          variant: "destructive",
        });
        return;
      }
      if (!jobName.trim()) {
        toast({
          title: t("toasts.campaignNameRequired"),
          description: t("toasts.campaignNameRequiredDesc"),
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(variableCount > 0 ? "params" : "audience");
    } else if (currentStep === "params") {
      // Validate that all parameters have values for manual type
      const invalidParams = paramMappings.filter(
        (p) => p.type === "manual" && !p.value.trim()
      );
      if (invalidParams.length > 0) {
        toast({
          title: t("toasts.missingParams"),
          description: t("toasts.missingParamsDesc"),
          variant: "destructive",
        });
        return;
      }
      setCurrentStep("audience");
    } else if (currentStep === "audience") {
      if (audienceType === "tags" && selectedTags.length === 0) {
        toast({
          title: t("toasts.noTagsSelected"),
          description: t("toasts.noTagsSelectedDesc"),
          variant: "destructive",
        });
        return;
      }
      if (audienceType === "segment" && !selectedSegmentId) {
        toast({
          title: t("toasts.noSegmentSelected"),
          description: t("toasts.noSegmentSelectedDesc"),
          variant: "destructive",
        });
        return;
      }
      setCurrentStep("review");
    }
  };

  const handleBack = () => {
    if (currentStep === "params") {
      setCurrentStep("template");
    } else if (currentStep === "audience") {
      setCurrentStep(variableCount > 0 ? "params" : "template");
    } else if (currentStep === "review") {
      setCurrentStep("audience");
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Build contact IDs based on audience type
      let contactIds: string[] = [];
      let tagsFilter: string[] = [];
      let segmentId: string | undefined;

      if (audienceType === "all") {
        contactIds = contacts.map((c) => c.id);
      } else if (audienceType === "tags") {
        tagsFilter = selectedTags;
        // Get contacts with selected tags
        contactIds = contacts
          .filter((c) => c.tags?.some((tag) => selectedTags.includes(tag)))
          .map((c) => c.id);
      } else if (audienceType === "segment") {
        segmentId = selectedSegmentId;
        // For segment, we'll let the API resolve the contacts
      }

      // Build param defs
      const paramDefs: Record<string, ParamMapping> = {};
      paramMappings.forEach((mapping, index) => {
        paramDefs[`${index + 1}`] = mapping;
      });

      const payload = {
        workspaceId,
        templateId: selectedTemplateId,
        jobName: jobName.trim(),
        contactIds: segmentId ? undefined : contactIds,
        tags: tagsFilter.length > 0 ? tagsFilter : undefined,
        segmentId,
        paramDefs,
      };

      const res = await fetch("/api/meta/whatsapp/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to create campaign");
      }

      toast({
        title: t("toasts.campaignCreated"),
        description: t("toasts.campaignCreatedDesc", { name: jobName }),
      });

      // Navigate to jobs page
      router.push(`/${workspaceSlug}/meta-hub/messaging/whatsapp/jobs`);
      onClose();
    } catch (error) {
      toast({
        title: t("toasts.failedToCreate"),
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getAudienceCount = () => {
    if (audienceType === "all") return contacts.length;
    if (audienceType === "tags") {
      return contacts.filter((c) => c.tags?.some((tag) => selectedTags.includes(tag))).length;
    }
    if (audienceType === "segment") {
      const segment = segments.find((s) => s.id === selectedSegmentId);
      return segment?.contact_count ?? 0;
    }
    return 0;
  };

  const steps = [
    { id: "template", label: t("steps.template"), icon: FileText },
    ...(variableCount > 0 ? [{ id: "params" as WizardStep, label: t("steps.parameters"), icon: FileText }] : []),
    { id: "audience", label: t("steps.audience"), icon: Users },
    { id: "review", label: t("steps.review"), icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-[#d4af37]/30 bg-gradient-to-b from-[#0a1229] to-[#050a18] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#d4af37]/20 bg-gradient-to-r from-[#0a1229] to-[#050a18] px-6 py-4">
          <div>
            <h2 className="text-2xl font-bold text-[#f9d976]">{t("title")}</h2>
            <p className="mt-1 text-sm text-[#f5f5dc]/60">
              {t("subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[#f5f5dc]/60 transition-colors hover:bg-[#f5f5dc]/10 hover:text-[#f5f5dc]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Steps Progress */}
        <div className="border-b border-[#d4af37]/10 bg-[#050a18]/50 px-6 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;

              return (
                <div key={step.id} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                        isActive
                          ? "border-[#d4af37] bg-[#d4af37]/20 text-[#f9d976]"
                          : isCompleted
                          ? "border-[#10b981] bg-[#10b981]/20 text-[#10b981]"
                          : "border-[#f5f5dc]/20 bg-[#f5f5dc]/5 text-[#f5f5dc]/40"
                      )}
                    >
                      {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span
                      className={cn(
                        "mt-2 text-xs font-medium",
                        isActive ? "text-[#f9d976]" : isCompleted ? "text-[#10b981]" : "text-[#f5f5dc]/40"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "mx-2 h-0.5 flex-1 transition-all",
                        index < currentStepIndex ? "bg-[#10b981]" : "bg-[#f5f5dc]/20"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-280px)] overflow-y-auto p-6">
          {/* Step 1: Template Selection */}
          {currentStep === "template" && (
            <div className="space-y-6">
              <div>
                <Label className="text-[#f5f5dc]">{t("templateStep.campaignName")}</Label>
                <Input
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                  placeholder={t("templateStep.campaignNamePlaceholder")}
                  className="mt-2 bg-[#050a18] border-[#d4af37]/20 text-[#f5f5dc]"
                />
              </div>

              <div>
                <Label className="text-[#f5f5dc]">{t("templateStep.selectTemplate")}</Label>
                {loading ? (
                  <div className="mt-4 flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#d4af37]" />
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplateId(template.id)}
                        className={cn(
                          "rounded-lg border-2 p-4 text-left transition-all",
                          selectedTemplateId === template.id
                            ? "border-[#d4af37] bg-[#d4af37]/10"
                            : "border-[#f5f5dc]/20 bg-[#050a18]/50 hover:border-[#d4af37]/50"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-[#f5f5dc]">{template.name}</h4>
                            <p className="mt-1 text-xs text-[#f5f5dc]/60">
                              {template.language} Â· {template.category}
                            </p>
                            {template.body && (
                              <p className="mt-2 text-sm text-[#f5f5dc]/80 line-clamp-2">{template.body}</p>
                            )}
                          </div>
                          {selectedTemplateId === template.id && (
                            <CheckCircle2 className="ml-4 h-5 w-5 flex-shrink-0 text-[#d4af37]" />
                          )}
                        </div>
                        {(template.variable_count ?? 0) > 0 && (
                          <div className="mt-2 text-xs text-[#f9d976]">
                            {template.variable_count} {template.variable_count !== 1 ? t("templateStep.variableCountPlural") : t("templateStep.variableCount")}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Parameter Mapping */}
          {currentStep === "params" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[#f5f5dc]">{t("paramsStep.title")}</h3>
                <p className="mt-1 text-sm text-[#f5f5dc]/60">
                  {t("paramsStep.description")}
                </p>
              </div>

              {selectedTemplate?.body && (
                <div className="rounded-lg border border-[#d4af37]/20 bg-[#050a18]/50 p-4">
                  <Label className="text-xs text-[#f5f5dc]/60">{t("paramsStep.templatePreview")}</Label>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-[#f5f5dc]">{selectedTemplate.body}</p>
                </div>
              )}

              <div className="space-y-4">
                {paramMappings.map((mapping, index) => (
                  <div key={index} className="rounded-lg border border-[#d4af37]/20 bg-[#050a18]/50 p-4">
                    <Label className="text-[#f5f5dc]">
                      {t("paramsStep.parameterLabel")} {index + 1} · <code className="text-[#f9d976]">{mapping.name}</code>
                    </Label>
                    
                    <div className="mt-3 space-y-3">
                      <div className="flex gap-2">
                        {(["manual", "contact_field", "expression"] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => {
                              const updated = [...paramMappings];
                              updated[index] = { ...updated[index], type, value: "" };
                              setParamMappings(updated);
                            }}
                            className={cn(
                              "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                              mapping.type === type
                                ? "border-[#d4af37] bg-[#d4af37]/20 text-[#f9d976]"
                                : "border-[#f5f5dc]/20 bg-[#f5f5dc]/5 text-[#f5f5dc]/60 hover:border-[#d4af37]/50"
                            )}
                          >
                            {type === "manual" && t("paramsStep.manualValue")}
                            {type === "contact_field" && t("paramsStep.contactField")}
                            {type === "expression" && t("paramsStep.expression")}
                          </button>
                        ))}
                      </div>

                      {mapping.type === "manual" && (
                        <Input
                          value={mapping.value}
                          onChange={(e) => {
                            const updated = [...paramMappings];
                            updated[index] = { ...updated[index], value: e.target.value };
                            setParamMappings(updated);
                          }}
                          placeholder={t("paramsStep.manualPlaceholder")}
                          className="bg-[#050a18] border-[#d4af37]/20 text-[#f5f5dc]"
                        />
                      )}

                      {mapping.type === "contact_field" && (
                        <select
                          value={mapping.value}
                          onChange={(e) => {
                            const updated = [...paramMappings];
                            updated[index] = { ...updated[index], value: e.target.value };
                            setParamMappings(updated);
                          }}
                          className="w-full rounded-lg border border-[#d4af37]/20 bg-[#050a18] px-3 py-2 text-sm text-[#f5f5dc]"
                        >
                          <option value="">{t("paramsStep.selectField")}</option>
                          <option value="name">{t("paramsStep.contactName")}</option>
                          <option value="phone">{t("paramsStep.phoneNumber")}</option>
                          <option value="email">{t("paramsStep.email")}</option>
                          <option value="custom_field_1">{t("paramsStep.customField1")}</option>
                          <option value="custom_field_2">{t("paramsStep.customField2")}</option>
                        </select>
                      )}

                      {mapping.type === "expression" && (
                        <Input
                          value={mapping.value}
                          onChange={(e) => {
                            const updated = [...paramMappings];
                            updated[index] = { ...updated[index], value: e.target.value };
                            setParamMappings(updated);
                          }}
                          placeholder={t("paramsStep.expressionPlaceholder")}
                          className="bg-[#050a18] border-[#d4af37]/20 text-[#f5f5dc]"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Audience Selection */}
          {currentStep === "audience" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-[#f5f5dc]">{t("audienceStep.title")}</h3>
                <p className="mt-1 text-sm text-[#f5f5dc]/60">
                  {t("audienceStep.description")}
                </p>
              </div>

              <div className="space-y-3">
                {/* All Contacts */}
                <button
                  onClick={() => setAudienceType("all")}
                  className={cn(
                    "w-full rounded-lg border-2 p-4 text-left transition-all",
                    audienceType === "all"
                      ? "border-[#d4af37] bg-[#d4af37]/10"
                      : "border-[#f5f5dc]/20 bg-[#050a18]/50 hover:border-[#d4af37]/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-[#f5f5dc]">{t("audienceStep.allContacts")}</h4>
                      <p className="mt-1 text-sm text-[#f5f5dc]/60">
                        {t("audienceStep.sendToAll", { count: contacts.length })}
                      </p>
                    </div>
                    {audienceType === "all" && <CheckCircle2 className="h-5 w-5 text-[#d4af37]" />}
                  </div>
                </button>

                {/* By Tags */}
                <button
                  onClick={() => setAudienceType("tags")}
                  className={cn(
                    "w-full rounded-lg border-2 p-4 text-left transition-all",
                    audienceType === "tags"
                      ? "border-[#d4af37] bg-[#d4af37]/10"
                      : "border-[#f5f5dc]/20 bg-[#050a18]/50 hover:border-[#d4af37]/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-[#f9d976]" />
                        <h4 className="font-semibold text-[#f5f5dc]">{t("audienceStep.byTags")}</h4>
                      </div>
                      <p className="mt-1 text-sm text-[#f5f5dc]/60">
                        {t("audienceStep.filterByTags")}
                      </p>
                      
                      {audienceType === "tags" && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {availableTags.map((tag) => (
                            <button
                              key={tag}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTags((prev) =>
                                  prev.includes(tag)
                                    ? prev.filter((t) => t !== tag)
                                    : [...prev, tag]
                                );
                              }}
                              className={cn(
                                "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                                selectedTags.includes(tag)
                                  ? "border-[#10b981] bg-[#10b981]/20 text-[#10b981]"
                                  : "border-[#f5f5dc]/20 bg-[#f5f5dc]/5 text-[#f5f5dc]/60 hover:border-[#f5f5dc]/40"
                              )}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {audienceType === "tags" && <CheckCircle2 className="h-5 w-5 text-[#d4af37]" />}
                  </div>
                </button>

                {/* By Segment */}
                {segments.length > 0 && (
                  <button
                    onClick={() => setAudienceType("segment")}
                    className={cn(
                      "w-full rounded-lg border-2 p-4 text-left transition-all",
                      audienceType === "segment"
                        ? "border-[#d4af37] bg-[#d4af37]/10"
                        : "border-[#f5f5dc]/20 bg-[#050a18]/50 hover:border-[#d4af37]/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#f5f5dc]">{t("audienceStep.bySegment")}</h4>
                        <p className="mt-1 text-sm text-[#f5f5dc]/60">
                          {t("audienceStep.useSavedSegment")}
                        </p>
                        
                        {audienceType === "segment" && (
                          <div className="mt-3 space-y-2">
                            {segments.map((segment) => (
                              <button
                                key={segment.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSegmentId(segment.id);
                                }}
                                className={cn(
                                  "w-full rounded-lg border p-3 text-left transition-all",
                                  selectedSegmentId === segment.id
                                    ? "border-[#10b981] bg-[#10b981]/10"
                                    : "border-[#f5f5dc]/20 bg-[#f5f5dc]/5 hover:border-[#f5f5dc]/30"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-[#f5f5dc]">{segment.name}</div>
                                    {segment.description && (
                                      <div className="mt-0.5 text-xs text-[#f5f5dc]/60">
                                        {segment.description}
                                      </div>
                                    )}
                                    <div className="mt-1 text-xs text-[#f9d976]">
                                      {segment.contact_count ?? 0} {t("audienceStep.contacts")}
                                    </div>
                                  </div>
                                  {selectedSegmentId === segment.id && (
                                    <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {audienceType === "segment" && <CheckCircle2 className="h-5 w-5 text-[#d4af37]" />}
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === "review" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-[#f5f5dc]">{t("reviewStep.title")}</h3>
                <p className="mt-1 text-sm text-[#f5f5dc]/60">
                  {t("reviewStep.description")}
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-[#d4af37]/20 bg-[#050a18]/50 p-4">
                  <Label className="text-xs text-[#f5f5dc]/60">{t("reviewStep.campaignName")}</Label>
                  <div className="mt-1 font-semibold text-[#f5f5dc]">{jobName}</div>
                </div>

                <div className="rounded-lg border border-[#d4af37]/20 bg-[#050a18]/50 p-4">
                  <Label className="text-xs text-[#f5f5dc]/60">{t("reviewStep.template")}</Label>
                  <div className="mt-1 font-semibold text-[#f5f5dc]">{selectedTemplate?.name}</div>
                  {selectedTemplate?.body && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-[#f5f5dc]/80">
                      {selectedTemplate.body}
                    </p>
                  )}
                </div>

                {paramMappings.length > 0 && (
                  <div className="rounded-lg border border-[#d4af37]/20 bg-[#050a18]/50 p-4">
                    <Label className="text-xs text-[#f5f5dc]/60">{t("reviewStep.parameters")}</Label>
                    <div className="mt-2 space-y-2">
                      {paramMappings.map((mapping, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <code className="text-[#f9d976]">{mapping.name}</code>
                          <span className="text-[#f5f5dc]/60">â†’</span>
                          <span className="text-[#f5f5dc]">
                            {mapping.type === "manual" && mapping.value}
                            {mapping.type === "contact_field" && `{contact.${mapping.value}}`}
                            {mapping.type === "expression" && mapping.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-[#d4af37]/20 bg-[#050a18]/50 p-4">
                  <Label className="text-xs text-[#f5f5dc]/60">{t("reviewStep.audience")}</Label>
                  <div className="mt-1 font-semibold text-[#f5f5dc]">
                    {getAudienceCount()} {t("reviewStep.recipients")}
                  </div>
                  <p className="mt-1 text-sm text-[#f5f5dc]/60">
                    {audienceType === "all" && t("reviewStep.allContacts")}
                    {audienceType === "tags" && `${t("reviewStep.contactsWithTags")} ${selectedTags.join(", ")}`}
                    {audienceType === "segment" && `${t("reviewStep.segment")} ${segments.find((s) => s.id === selectedSegmentId)?.name}`}
                  </p>
                </div>

                <div className="rounded-lg border border-[#f9d976]/30 bg-[#f9d976]/10 p-4">
                  <div className="flex items-start gap-3">
                    <Send className="h-5 w-5 flex-shrink-0 text-[#f9d976]" />
                    <div className="text-sm text-[#f5f5dc]">
                      <p className="font-semibold">{t("reviewStep.readyToSend")}</p>
                      <p className="mt-1 text-[#f5f5dc]/80">
                        {t("reviewStep.readyToSendDesc")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#d4af37]/20 bg-[#050a18]/50 px-6 py-4">
          <Button
            onClick={handleBack}
            disabled={currentStep === "template" || submitting}
            variant="ghost"
            className="text-[#f5f5dc]/60 hover:text-[#f5f5dc]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("footer.back")}
          </Button>

          {currentStep !== "review" ? (
            <Button
              onClick={handleNext}
              disabled={loading}
              className="bg-[#d4af37] text-[#0a1229] hover:bg-[#f9d976]"
            >
              {t("footer.next")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#10b981] text-white hover:bg-[#059669]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("footer.creating")}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {t("footer.createCampaign")}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
