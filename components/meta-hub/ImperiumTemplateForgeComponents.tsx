"use client";

import { useSyncExternalStore } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Smartphone,
  Monitor,
  Image as ImageIcon,
  FileVideo,
  FileText,
  Upload,
  X,
  Plus,
  Link as LinkIcon,
  Phone,
  MessageSquare,
  ChevronRight,
  Check,
  Sparkles,
  Globe,
  Tag,
  Zap,
  RefreshCw,
  ExternalLink,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 28 },
  },
};

const stepVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, x: -30, transition: { duration: 0.3 } },
};

const bubbleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

export type TemplateCategory = "MARKETING" | "UTILITY" | "AUTHENTICATION";

export type TemplateButton = {
  id: string;
  type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
  text: string;
  url?: string;
  phone_number?: string;
};

export type TemplateState = {
  name: string;
  language: string;
  category: TemplateCategory;
  headerType: "none" | "text" | "image" | "video" | "document";
  headerText: string;
  headerMediaUrl: string | null;
  bodyText: string;
  footerText: string;
  buttons: TemplateButton[];
  bodyExamples: string[];
};

export type TemplateRow = {
  id: string;
  name: string;
  language: string | null;
  status: string | null;
  category: string | null;
  quality_score: string | null;
  rejection_reason: string | null;
  phone_number_id: string | null;
  meta_template_id?: string | null;
  body?: string | null;
  header?: string | null;
  footer?: string | null;
  buttons?: unknown;
  last_synced_at?: string | null;
};

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════ */

export const CATEGORY_OPTIONS: { value: TemplateCategory; label: string; description: string }[] = [
  {
    value: "MARKETING",
    label: "Marketing",
    description: "Promotional messages, offers, and updates",
  },
  {
    value: "UTILITY",
    label: "Utility",
    description: "Order updates, shipping, appointments",
  },
  {
    value: "AUTHENTICATION",
    label: "Authentication",
    description: "OTP codes and verification",
  },
];

export const LANGUAGE_OPTIONS = [
  { code: "id", name: "Indonesian" },
  { code: "en", name: "English" },
  { code: "en_US", name: "English (US)" },
  { code: "en_GB", name: "English (UK)" },
  { code: "zh_CN", name: "Chinese (Simplified)" },
  { code: "zh_TW", name: "Chinese (Traditional)" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ms", name: "Malay" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "fil", name: "Filipino" },
  { code: "hi", name: "Hindi" },
  { code: "ar", name: "Arabic" },
  { code: "de", name: "German" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "pt_BR", name: "Portuguese (Brazil)" },
  { code: "it", name: "Italian" },
  { code: "nl", name: "Dutch" },
  { code: "ru", name: "Russian" },
  { code: "tr", name: "Turkish" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   FORGE HEADER (PILLAR BADGE + TITLE)
   ═══════════════════════════════════════════════════════════════════════════ */

interface ForgeHeaderProps {
  onSync?: () => void;
  syncing?: boolean;
}

export function ForgeHeader({ onSync, syncing }: ForgeHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="mb-2 flex items-center gap-3">
          <span className="rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-3 py-1 text-xs font-semibold tracking-wider text-[#f9d976]">
            PILLAR #2
          </span>
          <span className="text-xs text-[#f5f5dc]/50">Template Forge</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#f5f5dc]">
          Message Templates
        </h1>
        <p className="mt-2 text-sm text-[#f5f5dc]/60">
          Create, manage, and sync Meta-approved templates
        </p>
      </div>
      {onSync && (
        <button
          onClick={onSync}
          disabled={syncing}
          className={cn(
            "group relative flex items-center gap-2 rounded-xl border border-[#d4af37]/40 bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5 px-5 py-2.5 text-sm font-semibold text-[#f9d976] transition-all hover:border-[#f9d976] hover:shadow-lg hover:shadow-[#d4af37]/20",
            syncing && "opacity-60 cursor-not-allowed"
          )}
        >
          <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
          Sync with Meta
          {/* Sonar effect */}
          <span className="absolute inset-0 rounded-xl opacity-0 group-hover:animate-ping group-hover:opacity-30 bg-[#d4af37]" />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP INDICATOR
   ═══════════════════════════════════════════════════════════════════════════ */

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, idx) => {
        const step = idx + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
                isActive && "border-[#d4af37] bg-[#d4af37]/20 text-[#f9d976]",
                isCompleted && "border-[#10b981] bg-[#10b981]/20 text-[#10b981]",
                !isActive && !isCompleted && "border-[#f5f5dc]/20 text-[#f5f5dc]/40"
              )}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : step}
            </div>
            <span
              className={cn(
                "hidden text-xs font-medium sm:inline",
                isActive && "text-[#f9d976]",
                isCompleted && "text-[#10b981]",
                !isActive && !isCompleted && "text-[#f5f5dc]/40"
              )}
            >
              {labels[idx]}
            </span>
            {idx < totalSteps - 1 && (
              <ChevronRight className="mx-2 h-4 w-4 text-[#f5f5dc]/20" />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP 1: HEADER & CATEGORY
   ═══════════════════════════════════════════════════════════════════════════ */

interface Step1Props {
  state: TemplateState;
  onChange: (updates: Partial<TemplateState>) => void;
  errors?: Record<string, string>;
}

export function Step1HeaderCategory({ state, onChange, errors }: Step1Props) {
  return (
    <motion.div
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      {/* Template Name */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#f5f5dc]">Template Name</label>
        <input
          type="text"
          value={state.name}
          onChange={(e) => onChange({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
          placeholder="e.g., order_confirmation"
          className={cn(
            "w-full rounded-xl border bg-[#0a1229]/80 px-4 py-3 text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50",
            errors?.name ? "border-[#e11d48]" : "border-[#d4af37]/20"
          )}
        />
        <p className="text-xs text-[#f5f5dc]/50">
          Lowercase letters, numbers, and underscores only
        </p>
        {errors?.name && <p className="text-xs text-[#e11d48]">{errors.name}</p>}
      </div>

      {/* Category Selection */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-[#f5f5dc]">Category</label>
        <div className="grid gap-3 sm:grid-cols-3">
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => onChange({ category: cat.value })}
              className={cn(
                "group relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all",
                state.category === cat.value
                  ? "border-[#d4af37] bg-[#d4af37]/10"
                  : "border-[#f5f5dc]/10 bg-[#0a1229]/50 hover:border-[#d4af37]/40"
              )}
            >
              <div className="flex items-center gap-2">
                {cat.value === "MARKETING" && <Sparkles className="h-4 w-4 text-[#e11d48]" />}
                {cat.value === "UTILITY" && <Zap className="h-4 w-4 text-[#10b981]" />}
                {cat.value === "AUTHENTICATION" && <Tag className="h-4 w-4 text-[#d4af37]" />}
                <span className="font-semibold text-[#f5f5dc]">{cat.label}</span>
              </div>
              <p className="text-xs text-[#f5f5dc]/50">{cat.description}</p>
              {state.category === cat.value && (
                <motion.div
                  layoutId="category-check"
                  className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#d4af37]"
                >
                  <Check className="h-3 w-3 text-[#050a18]" />
                </motion.div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Language Selection */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-[#f5f5dc]">
          <Globe className="h-4 w-4 text-[#d4af37]" />
          Language
        </label>
        <select
          value={state.language}
          onChange={(e) => onChange({ language: e.target.value })}
          title="Select template language"
          className="w-full rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 px-4 py-3 text-[#f5f5dc] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
        >
          {LANGUAGE_OPTIONS.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-[#0a1229]">
              {lang.name} ({lang.code})
            </option>
          ))}
        </select>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP 2: MEDIA STUDIO
   ═══════════════════════════════════════════════════════════════════════════ */

interface Step2Props {
  state: TemplateState;
  onChange: (updates: Partial<TemplateState>) => void;
  onUpload?: (file: File) => Promise<string | null>;
  uploading?: boolean;
}

export function Step2MediaStudio({ state, onChange, onUpload, uploading }: Step2Props) {
  const headerOptions = [
    { value: "none", label: "No Header", icon: X },
    { value: "text", label: "Text", icon: MessageSquare },
    { value: "image", label: "Image", icon: ImageIcon },
    { value: "video", label: "Video", icon: FileVideo },
    { value: "document", label: "Document", icon: FileText },
  ] as const;

  async function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && onUpload) {
      const url = await onUpload(file);
      if (url) onChange({ headerMediaUrl: url });
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      const url = await onUpload(file);
      if (url) onChange({ headerMediaUrl: url });
    }
  }

  return (
    <motion.div
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      <div className="space-y-3">
        <label className="text-sm font-semibold text-[#f5f5dc]">Header Type</label>
        <div className="flex flex-wrap gap-2">
          {headerOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ headerType: opt.value, headerText: "", headerMediaUrl: null })}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                state.headerType === opt.value
                  ? "border-[#d4af37] bg-[#d4af37]/20 text-[#f9d976]"
                  : "border-[#f5f5dc]/10 text-[#f5f5dc]/60 hover:border-[#d4af37]/40"
              )}
            >
              <opt.icon className="h-4 w-4" />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text Header */}
      {state.headerType === "text" && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#f5f5dc]">Header Text</label>
          <input
            type="text"
            value={state.headerText}
            onChange={(e) => onChange({ headerText: e.target.value })}
            placeholder="Enter header text..."
            maxLength={60}
            className="w-full rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 px-4 py-3 text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
          />
          <p className="text-right text-xs text-[#f5f5dc]/40">{state.headerText.length}/60</p>
        </div>
      )}

      {/* Media Upload Zone */}
      {(state.headerType === "image" || state.headerType === "video" || state.headerType === "document") && (
        <div className="space-y-3">
          <label className="text-sm font-semibold text-[#f5f5dc]">
            Upload {state.headerType.charAt(0).toUpperCase() + state.headerType.slice(1)}
          </label>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className={cn(
              "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed transition-all",
              state.headerMediaUrl
                ? "border-[#10b981]/50 bg-[#10b981]/5"
                : "border-[#d4af37]/30 bg-[#0a1229]/50 hover:border-[#d4af37]/60"
            )}
          >
            {state.headerMediaUrl ? (
              <>
                {state.headerType === "image" && (
                  // eslint-disable-next-line @next/next/no-img-element -- dynamic template media preview
                  <img
                    src={state.headerMediaUrl}
                    alt="Header preview"
                    className="max-h-40 rounded-lg object-contain"
                  />
                )}
                {state.headerType === "video" && (
                  <video
                    src={state.headerMediaUrl}
                    className="max-h-40 rounded-lg"
                    controls
                  />
                )}
                {state.headerType === "document" && (
                  <div className="flex items-center gap-2 text-[#10b981]">
                    <FileText className="h-8 w-8" />
                    <span className="text-sm">Document uploaded</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onChange({ headerMediaUrl: null })}
                  title="Remove media"
                  className="absolute right-3 top-3 rounded-full bg-[#e11d48]/20 p-1.5 text-[#e11d48] hover:bg-[#e11d48]/30"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-3">
                <div className="rounded-2xl border border-[#d4af37]/30 bg-[#d4af37]/10 p-4">
                  <Upload className="h-8 w-8 text-[#d4af37]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[#f5f5dc]">
                    {uploading ? "Uploading..." : "Drag & drop or click to upload"}
                  </p>
                  <p className="text-xs text-[#f5f5dc]/50">
                    {state.headerType === "image" && "PNG, JPG up to 5MB"}
                    {state.headerType === "video" && "MP4 up to 16MB"}
                    {state.headerType === "document" && "PDF up to 100MB"}
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept={
                    state.headerType === "image"
                      ? "image/*"
                      : state.headerType === "video"
                      ? "video/*"
                      : ".pdf,.doc,.docx"
                  }
                  onChange={handleFileSelect}
                />
              </label>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP 3: CONTENT LAB
   ═══════════════════════════════════════════════════════════════════════════ */

interface Step3Props {
  state: TemplateState;
  onChange: (updates: Partial<TemplateState>) => void;
  errors?: Record<string, string>;
}

export function Step3ContentLab({ state, onChange, errors }: Step3Props) {
  function insertVariable() {
    const varCount = (state.bodyText.match(/{{(\d+)}}/g) ?? []).length;
    const nextVar = `{{${varCount + 1}}}`;
    onChange({ bodyText: state.bodyText + nextVar });
  }

  // Highlight variables in preview
  function highlightVariables(text: string) {
    return text.split(/({{[0-9]+}})/).map((part, idx) =>
      /{{[0-9]+}}/.test(part) ? (
        <span key={idx} className="rounded bg-[#d4af37]/30 px-1 text-[#f9d976]">
          {part}
        </span>
      ) : (
        <span key={idx}>{part}</span>
      )
    );
  }

  return (
    <motion.div
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      {/* Body Text */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-[#f5f5dc]">Body Message</label>
          <button
            type="button"
            onClick={insertVariable}
            className="flex items-center gap-1.5 rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/10 px-3 py-1.5 text-xs font-semibold text-[#f9d976] transition-all hover:bg-[#d4af37]/20"
          >
            <Plus className="h-3 w-3" />
            Add Variable
          </button>
        </div>
        <div className="relative">
          <textarea
            value={state.bodyText}
            onChange={(e) => onChange({ bodyText: e.target.value })}
            placeholder="Hello {{1}}, your order {{2}} has been shipped..."
            rows={5}
            maxLength={1024}
            className={cn(
              "w-full resize-none rounded-xl border bg-[#0a1229]/80 px-4 py-3 font-mono text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50",
              errors?.bodyText ? "border-[#e11d48]" : "border-[#d4af37]/20"
            )}
          />
          <div className="mt-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="text-[#f5f5dc]/40">{state.bodyText.length}/1024</span>
              <span className="text-[#d4af37]">
                Variables: {(state.bodyText.match(/{{(\d+)}}/g) ?? []).length}
              </span>
            </div>
            {errors?.bodyText && <p className="text-[#e11d48]">{errors.bodyText}</p>}
          </div>
        </div>
        {/* Preview with highlighted variables */}
        {state.bodyText && (
          <div className="rounded-xl border border-[#d4af37]/10 bg-[#0a1229]/50 p-3">
            <p className="mb-1 text-xs font-semibold text-[#d4af37]/60">PREVIEW</p>
            <p className="whitespace-pre-wrap text-sm text-[#f5f5dc]/80">
              {highlightVariables(state.bodyText)}
            </p>
          </div>
        )}
      </div>

      {/* Footer Text */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#f5f5dc]">Footer (Optional)</label>
        <input
          type="text"
          value={state.footerText}
          onChange={(e) => onChange({ footerText: e.target.value })}
          placeholder="e.g., Gigaviz • Reply STOP to unsubscribe"
          maxLength={60}
          className="w-full rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 px-4 py-3 text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
        />
        <p className="text-right text-xs text-[#f5f5dc]/40">{state.footerText.length}/60</p>
      </div>

      {/* Variable Examples */}
      {state.bodyExamples.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-[#d4af37]" />
            <label className="text-sm font-semibold text-[#f5f5dc]">Variable Examples (Required)</label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {state.bodyExamples.map((example, idx) => (
              <div key={idx} className="space-y-1">
                <label className="text-xs text-[#d4af37]">{`{{${idx + 1}}}`}</label>
                <input
                  type="text"
                  value={example}
                  onChange={(e) => {
                    const newExamples = [...state.bodyExamples];
                    newExamples[idx] = e.target.value;
                    onChange({ bodyExamples: newExamples });
                  }}
                  placeholder={`Example for variable ${idx + 1}`}
                  className="w-full rounded-lg border border-[#d4af37]/20 bg-[#0a1229]/60 px-3 py-2 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP 4: INTERACTIVE BUTTONS
   ═══════════════════════════════════════════════════════════════════════════ */

interface Step4Props {
  state: TemplateState;
  onChange: (updates: Partial<TemplateState>) => void;
}

function makeButtonId() {
  return `btn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function Step4Buttons({ state, onChange }: Step4Props) {
  const canAddMore = state.buttons.length < 3;

  function addButton(type: TemplateButton["type"]) {
    const newButton: TemplateButton = {
      id: makeButtonId(),
      type,
      text: type === "QUICK_REPLY" ? "Reply" : type === "URL" ? "Learn More" : "Call Us",
      url: type === "URL" ? "https://" : undefined,
      phone_number: type === "PHONE_NUMBER" ? "" : undefined,
    };
    onChange({ buttons: [...state.buttons, newButton] });
  }

  function updateButton(id: string, updates: Partial<TemplateButton>) {
    onChange({
      buttons: state.buttons.map((btn) => (btn.id === id ? { ...btn, ...updates } : btn)),
    });
  }

  function removeButton(id: string) {
    onChange({ buttons: state.buttons.filter((btn) => btn.id !== id) });
  }

  return (
    <motion.div
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-[#f5f5dc]">Buttons (Optional)</label>
          <span className="text-xs text-[#f5f5dc]/50">{state.buttons.length}/3</span>
        </div>

        {/* Button Type Selector */}
        {canAddMore && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => addButton("QUICK_REPLY")}
              className="flex items-center gap-2 rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-2.5 text-sm font-medium text-[#f9d976] transition-all hover:bg-[#d4af37]/20"
            >
              <MessageSquare className="h-4 w-4" />
              Quick Reply
            </button>
            <button
              type="button"
              onClick={() => addButton("URL")}
              className="flex items-center gap-2 rounded-xl border border-[#10b981]/30 bg-[#10b981]/10 px-4 py-2.5 text-sm font-medium text-[#10b981] transition-all hover:bg-[#10b981]/20"
            >
              <LinkIcon className="h-4 w-4" />
              URL Button
            </button>
            <button
              type="button"
              onClick={() => addButton("PHONE_NUMBER")}
              className="flex items-center gap-2 rounded-xl border border-[#e11d48]/30 bg-[#e11d48]/10 px-4 py-2.5 text-sm font-medium text-[#e11d48] transition-all hover:bg-[#e11d48]/20"
            >
              <Phone className="h-4 w-4" />
              Phone Button
            </button>
          </div>
        )}

        {/* Button List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {state.buttons.map((btn) => (
              <motion.div
                key={btn.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={cn(
                  "rounded-2xl border p-4",
                  btn.type === "QUICK_REPLY" && "border-[#d4af37]/30 bg-[#d4af37]/5",
                  btn.type === "URL" && "border-[#10b981]/30 bg-[#10b981]/5",
                  btn.type === "PHONE_NUMBER" && "border-[#e11d48]/30 bg-[#e11d48]/5"
                )}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={cn(
                      "rounded-lg px-2 py-1 text-xs font-semibold",
                      btn.type === "QUICK_REPLY" && "bg-[#d4af37]/20 text-[#f9d976]",
                      btn.type === "URL" && "bg-[#10b981]/20 text-[#10b981]",
                      btn.type === "PHONE_NUMBER" && "bg-[#e11d48]/20 text-[#e11d48]"
                    )}
                  >
                    {btn.type.replace("_", " ")}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeButton(btn.id)}
                    title="Remove button"
                    className="rounded-full p-1 text-[#f5f5dc]/40 hover:bg-[#e11d48]/20 hover:text-[#e11d48]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={btn.text}
                    onChange={(e) => updateButton(btn.id, { text: e.target.value })}
                    placeholder="Button text"
                    maxLength={25}
                    className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-3 py-2 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
                  />
                  {btn.type === "URL" && (
                    <input
                      type="url"
                      value={btn.url ?? ""}
                      onChange={(e) => updateButton(btn.id, { url: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-3 py-2 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
                    />
                  )}
                  {btn.type === "PHONE_NUMBER" && (
                    <input
                      type="tel"
                      value={btn.phone_number ?? ""}
                      onChange={(e) => updateButton(btn.id, { phone_number: e.target.value })}
                      placeholder="+628123456789"
                      className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-3 py-2 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {state.buttons.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#f5f5dc]/10 py-10 text-center">
            <MessageSquare className="mb-2 h-8 w-8 text-[#f5f5dc]/20" />
            <p className="text-sm text-[#f5f5dc]/40">No buttons added yet</p>
            <p className="text-xs text-[#f5f5dc]/30">Add up to 3 interactive buttons</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MIRAGE LIVE PREVIEW (PHONE FRAME)
   ═══════════════════════════════════════════════════════════════════════════ */

interface MiragePreviewProps {
  state: TemplateState;
  deviceType: "iphone" | "android";
  onToggleDevice: () => void;
}

export function MiragePreview({ state, deviceType, onToggleDevice }: MiragePreviewProps) {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  if (!mounted) {
    return (
      <div className="h-[600px] w-[300px] animate-pulse rounded-[40px] bg-[#0a1229]/80" />
    );
  }

  return (
    <div className="relative">
      {/* Device Toggle */}
      <div className="mb-4 flex items-center justify-center gap-2">
        <button
          onClick={onToggleDevice}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
            deviceType === "iphone"
              ? "bg-[#d4af37]/20 text-[#f9d976]"
              : "bg-[#f5f5dc]/10 text-[#f5f5dc]/50"
          )}
        >
          <Smartphone className="h-3.5 w-3.5" />
          iPhone
        </button>
        <button
          onClick={onToggleDevice}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
            deviceType === "android"
              ? "bg-[#10b981]/20 text-[#10b981]"
              : "bg-[#f5f5dc]/10 text-[#f5f5dc]/50"
          )}
        >
          <Monitor className="h-3.5 w-3.5" />
          Android
        </button>
      </div>

      {/* Phone Frame */}
      <div
        className={cn(
          "relative mx-auto w-[280px] overflow-hidden border-[6px] shadow-2xl",
          deviceType === "iphone"
            ? "rounded-[40px] border-[#1a1a1a] bg-[#000]"
            : "rounded-[24px] border-[#2a2a2a] bg-[#000]"
        )}
      >
        {/* Notch / Camera */}
        {deviceType === "iphone" ? (
          <div className="absolute left-1/2 top-0 z-10 h-7 w-32 -translate-x-1/2 rounded-b-2xl bg-[#000]" />
        ) : (
          <div className="absolute left-1/2 top-2 z-10 h-2 w-2 -translate-x-1/2 rounded-full bg-[#333]" />
        )}

        {/* Screen */}
        <div className="flex h-[540px] flex-col bg-gradient-to-b from-[#0f1c32] to-[#050a18]">
          {/* Status Bar */}
          <div className="flex h-10 items-center justify-between px-6 pt-8 text-[10px] text-white/60">
            <span>9:41</span>
            <span>•••••</span>
          </div>

          {/* WhatsApp Header */}
          <div className="flex h-12 items-center gap-3 border-b border-[#1a2940] bg-[#0f1c32] px-4">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8962e]" />
            <div>
              <p className="text-xs font-semibold text-white">Gigaviz</p>
              <p className="text-[10px] text-white/50">Business Account</p>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Incoming (Template Preview) */}
            <motion.div
              variants={bubbleVariants}
              initial="hidden"
              animate="visible"
              className="max-w-[220px] rounded-2xl rounded-tl-sm bg-[#1a2940] p-3 shadow-lg"
            >
              {/* Header Media/Text */}
              {state.headerType === "text" && state.headerText && (
                <p className="mb-2 text-xs font-bold text-white">{state.headerText}</p>
              )}
              {state.headerType === "image" && state.headerMediaUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- dynamic template media preview
                <img
                  src={state.headerMediaUrl}
                  alt="Header"
                  className="mb-2 rounded-lg"
                />
              )}
              {state.headerType === "image" && !state.headerMediaUrl && (
                <div className="mb-2 flex h-24 items-center justify-center rounded-lg bg-[#0a1229]">
                  <ImageIcon className="h-8 w-8 text-[#f5f5dc]/20" />
                </div>
              )}

              {/* Body */}
              <p className="whitespace-pre-wrap text-xs text-[#f5f5dc]">
                {state.bodyText || "Your message will appear here..."}
              </p>

              {/* Footer */}
              {state.footerText && (
                <p className="mt-2 text-[10px] text-[#f5f5dc]/50">{state.footerText}</p>
              )}

              {/* Buttons */}
              {state.buttons.length > 0 && (
                <div className="mt-3 flex flex-col gap-1.5 border-t border-[#f5f5dc]/10 pt-2">
                  {state.buttons.map((btn) => (
                    <div
                      key={btn.id}
                      className="flex items-center justify-center gap-1 rounded-lg bg-[#0a1229]/50 py-2 text-[10px] font-medium text-[#d4af37]"
                    >
                      {btn.type === "URL" && <ExternalLink className="h-3 w-3" />}
                      {btn.type === "PHONE_NUMBER" && <Phone className="h-3 w-3" />}
                      {btn.type === "QUICK_REPLY" && <MessageSquare className="h-3 w-3" />}
                      {btn.text}
                    </div>
                  ))}
                </div>
              )}

              {/* Timestamp */}
              <p className="mt-2 text-right text-[9px] text-[#f5f5dc]/40">
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </motion.div>
          </div>

          {/* Input Bar */}
          <div className="flex h-14 items-center gap-2 border-t border-[#1a2940] bg-[#0f1c32] px-3">
            <div className="flex-1 rounded-full bg-[#1a2940] px-4 py-2 text-[10px] text-[#f5f5dc]/30">
              Type a message...
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d4af37]">
              <ChevronRight className="h-4 w-4 text-[#050a18]" />
            </div>
          </div>
        </div>
      </div>

      {/* Live Sync Indicator */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10b981]" />
        </span>
        <span className="text-xs text-[#10b981]">Live Preview</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TEMPLATE GRID WITH AURA BADGES
   ═══════════════════════════════════════════════════════════════════════════ */

interface TemplateGridProps {
  templates: TemplateRow[];
  selectedId: string | null;
  onSelect: (template: TemplateRow) => void;
  syncing?: boolean;
}

export function TemplateGrid({ templates, selectedId, onSelect, syncing }: TemplateGridProps) {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  if (!mounted) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80" />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#f5f5dc]/10 py-16 text-center">
        <FileText className="mb-4 h-12 w-12 text-[#f5f5dc]/20" />
        <p className="text-lg font-semibold text-[#f5f5dc]/60">No templates yet</p>
        <p className="text-sm text-[#f5f5dc]/40">Create your first template to get started</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", syncing && "opacity-60")}
    >
      {templates.map((tpl) => {
        const status = (tpl.status ?? "").toUpperCase();
        const isApproved = status === "APPROVED";
        const isRejected = status === "REJECTED";
        const isPending = status === "PENDING";

        return (
          <motion.button
            key={tpl.id}
            variants={cardVariants}
            onClick={() => onSelect(tpl)}
            className={cn(
              "group relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all",
              selectedId === tpl.id
                ? "border-[#d4af37] bg-[#d4af37]/10"
                : "border-[#f5f5dc]/10 bg-[#0a1229]/60 hover:border-[#d4af37]/40 hover:bg-[#0a1229]/80"
            )}
          >
            {/* Aura Badge */}
            <div
              className={cn(
                "absolute -right-1 -top-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-lg",
                isApproved && "animate-pulse bg-[#10b981] text-white shadow-[#10b981]/50",
                isRejected && "animate-pulse bg-[#e11d48] text-white shadow-[#e11d48]/50",
                isPending && "bg-[#d4af37]/80 text-[#050a18]"
              )}
            >
              {status || "DRAFT"}
            </div>

            {/* Template Info */}
            <p className="font-mono text-sm font-semibold text-[#f5f5dc]">{tpl.name}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-[#d4af37]/20 px-2 py-0.5 text-[10px] font-semibold text-[#d4af37]">
                {tpl.category ?? "UTILITY"}
              </span>
              <span className="rounded bg-[#f5f5dc]/10 px-2 py-0.5 text-[10px] text-[#f5f5dc]/60">
                {tpl.language ?? "id"}
              </span>
            </div>

            {/* Body Preview */}
            <p className="line-clamp-2 text-xs text-[#f5f5dc]/50">{tpl.body ?? "No content"}</p>

            {/* Quality Score */}
            {tpl.quality_score && (
              <div className="mt-auto flex items-center gap-1">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    tpl.quality_score.toLowerCase() === "green" && "bg-[#10b981]",
                    tpl.quality_score.toLowerCase() === "yellow" && "bg-[#d4af37]",
                    tpl.quality_score.toLowerCase() === "red" && "bg-[#e11d48]"
                  )}
                />
                <span className="text-[10px] text-[#f5f5dc]/40">Quality: {tpl.quality_score}</span>
              </div>
            )}
          </motion.button>
        );
      })}

      {/* Sonar Animation Overlay */}
      {syncing && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-32 w-32 rounded-full border-4 border-[#d4af37]"
          />
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════════════════ */

export function ImperiumForgeFooter() {
  return (
    <footer className="mt-12 border-t border-[#d4af37]/10 py-6 text-center">
      <div className="text-xs leading-relaxed text-[#f5f5dc]/40">
        <p>
          Gigaviz is a Verified Technology Provider for solutions built on the
          WhatsApp Business Platform (Cloud API).
        </p>
        <p className="mt-2">WhatsApp and Meta are trademarks of Meta Platforms, Inc.</p>
      </div>
    </footer>
  );
}
