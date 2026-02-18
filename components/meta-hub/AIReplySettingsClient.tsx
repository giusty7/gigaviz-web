"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Power,
  PowerOff,
  Brain,
  Clock,
  MessageSquare,
  Users,
  Zap,
  Shield,
  BookOpen,
  Save,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Timer,
  Target,
  Hand,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

interface AIReplySettings {
  id: string | null;
  workspaceId: string;
  enabled: boolean;
  aiModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string | null;
  greetingMessage: string | null;
  fallbackMessage: string;
  useKnowledgeBase: boolean;
  knowledgeConfidenceThreshold: number;
  activeHoursEnabled: boolean;
  activeHoursStart: string | null;
  activeHoursEnd: string | null;
  activeTimezone: string;
  cooldownSeconds: number;
  maxMessagesPerThread: number | null;
  maxMessagesPerDay: number;
  handoffKeywords: string[];
  handoffMessage: string;
  autoHandoffAfterMessages: number | null;
}

interface AIReplyStats {
  totalReplies: number;
  successRate: number;
  avgResponseTime: number;
  tokensUsed: number;
  handoffs: number;
}

interface Props {
  workspaceId: string;
  workspaceSlug: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   DEFAULT SETTINGS
   ═══════════════════════════════════════════════════════════════════════════ */

const defaultSettings: AIReplySettings = {
  id: null,
  workspaceId: "",
  enabled: false,
  aiModel: "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 500,
  systemPrompt: null,
  greetingMessage: null,
  fallbackMessage: "I apologize, I am unable to assist at the moment. Our team will contact you shortly.",
  useKnowledgeBase: true,
  knowledgeConfidenceThreshold: 0.7,
  activeHoursEnabled: false,
  activeHoursStart: "09:00",
  activeHoursEnd: "17:00",
  activeTimezone: "Asia/Jakarta",
  cooldownSeconds: 5,
  maxMessagesPerThread: null,
  maxMessagesPerDay: 100,
  handoffKeywords: ["agent", "human", "operator", "support", "help"],
  handoffMessage: "Certainly, I will forward this conversation to our team. Please wait a moment.",
  autoHandoffAfterMessages: null,
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function AIReplySettingsClient({ }: Props) {
  const t = useTranslations("metaHubUI.aiReply");
  const [settings, setSettings] = useState<AIReplySettings>(defaultSettings);
  const [stats, setStats] = useState<AIReplyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Section visibility
  const [openSections, setOpenSections] = useState({
    personality: true,
    knowledge: false,
    schedule: false,
    limits: false,
    handoff: false,
  });

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/meta-hub/ai-reply?includeStats=true`);
      if (!res.ok) throw new Error("Failed to fetch settings");
      
      const data = await res.json();
      setSettings(data.settings || defaultSettings);
      setStats(data.stats || null);
    } catch {
      setError(t("toasts.failedToLoad"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Quick toggle
  const handleQuickToggle = async () => {
    try {
      setToggling(true);
      const res = await fetch(`/api/meta-hub/ai-reply`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !settings.enabled }),
      });

      if (!res.ok) throw new Error("Failed to toggle");

      setSettings((prev) => ({ ...prev, enabled: !prev.enabled }));
      setSuccess(settings.enabled ? t("toasts.disabled") : t("toasts.enabled"));
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError(t("toasts.failedToToggle"));
    } finally {
      setToggling(false);
    }
  };

  // Save settings
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const res = await fetch(`/api/meta-hub/ai-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      const updated = await res.json();
      setSettings(updated);
      setHasChanges(false);
      setSuccess(t("toasts.settingsSaved"));
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : t("toasts.failedToSave"));
    } finally {
      setSaving(false);
    }
  };

  // Update field
  const updateField = <K extends keyof AIReplySettings>(
    field: K,
    value: AIReplySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Toggle section
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Master Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-xl transition-all duration-300",
            settings.enabled 
              ? "bg-gradient-to-br from-[#d4af37] to-[#f9d976] shadow-lg shadow-[#d4af37]/30"
              : "bg-[#0a1229] border border-[#f5f5dc]/20"
          )}>
            <Bot className={cn(
              "h-8 w-8",
              settings.enabled ? "text-[#050a18]" : "text-[#f5f5dc]/40"
            )} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#f5f5dc]">{t("title")}</h2>
            <p className="text-[#f5f5dc]/60">
              {t("description")}
            </p>
          </div>
        </div>

        {/* Master Toggle */}
        <div className="flex items-center gap-4">
          <Button
            onClick={handleQuickToggle}
            disabled={toggling}
            className={cn(
              "min-w-[160px] gap-2 transition-all duration-300",
              settings.enabled
                ? "bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-600 hover:to-emerald-500 text-white"
                : "bg-[#0a1229] border border-[#f5f5dc]/20 text-[#f5f5dc] hover:border-[#d4af37]/40"
            )}
          >
            {toggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : settings.enabled ? (
              <>
                <Power className="h-4 w-4" />
                {t("aiActive")}
              </>
            ) : (
              <>
                <PowerOff className="h-4 w-4" />
                {t("aiInactive")}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400"
          >
            <AlertTriangle className="h-4 w-4" />
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
          >
            <CheckCircle className="h-4 w-4" />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Overview */}
      {stats && settings.enabled && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: t("stats.totalReplies"), value: stats.totalReplies, icon: MessageSquare, color: "text-[#d4af37]" },
            { label: t("stats.successRate"), value: `${stats.successRate}%`, icon: Target, color: "text-emerald-400" },
            { label: t("stats.avgResponseTime"), value: `${stats.avgResponseTime}ms`, icon: Timer, color: "text-cyan-400" },
            { label: t("stats.tokensUsed"), value: stats.tokensUsed.toLocaleString(), icon: Zap, color: "text-purple-400" },
            { label: t("stats.handedToAgent"), value: stats.handoffs, icon: Users, color: "text-orange-400" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-[#0a1229]/80 border-[#d4af37]/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#f5f5dc]/60">{stat.label}</p>
                    <p className="text-xl font-bold text-[#f5f5dc]">{stat.value}</p>
                  </div>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Settings Sections */}
      <div className="space-y-4">
        {/* Personality & AI Model */}
        <SettingsSection
          title={t("personality.title")}
          description={t("personality.description")}
          icon={Brain}
          isOpen={openSections.personality}
          onToggle={() => toggleSection("personality")}
        >
          <div className="space-y-6">
            {/* AI Model Selection */}
            <div className="space-y-2">
              <Label className="text-[#f5f5dc]">{t("personality.modelLabel")}</Label>
              <Select value={settings.aiModel} onValueChange={(v) => updateField("aiModel", v)}>
                <SelectTrigger className="bg-[#050a18] border-[#d4af37]/20 text-[#f5f5dc]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a1229] border-[#d4af37]/20">
                  <SelectItem value="gpt-4o-mini">{t("personality.gpt4oMini")}</SelectItem>
                  <SelectItem value="gpt-4o">{t("personality.gpt4o")}</SelectItem>
                  <SelectItem value="gpt-4-turbo">{t("personality.gpt4Turbo")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-[#f5f5dc]/50">
                {t("personality.modelRecommendation")}
              </p>
            </div>

            {/* Temperature */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[#f5f5dc]">{t("personality.creativityLabel")}</Label>
                <span className="text-sm text-[#d4af37]">{settings.temperature.toFixed(1)}</span>
              </div>
              <Slider
                value={[settings.temperature]}
                onValueChange={([v]: number[]) => updateField("temperature", v)}
                min={0}
                max={1.5}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-[#f5f5dc]/50">
                <span>{t("personality.consistent")}</span>
                <span>{t("personality.creative")}</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div className="space-y-2">
              <Label className="text-[#f5f5dc]">{t("personality.maxReplyLength")}</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[settings.maxTokens]}
                  onValueChange={([v]: number[]) => updateField("maxTokens", v)}
                  min={100}
                  max={1500}
                  step={50}
                  className="flex-1"
                />
                <span className="text-sm text-[#f5f5dc]/70 w-20">{settings.maxTokens} {t("personality.tokenUnit")}</span>
              </div>
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-[#f5f5dc]">{t("personality.personalityLabel")}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-[#f5f5dc]/40" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm bg-[#0a1229] border-[#d4af37]/20">
                      {t("personality.personalityTooltip")}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                value={settings.systemPrompt || ""}
                onChange={(e) => updateField("systemPrompt", e.target.value || null)}
                placeholder={t("personality.personalityPlaceholder")}
                className="min-h-[100px] bg-[#050a18] border-[#d4af37]/20 text-[#f5f5dc] placeholder:text-[#f5f5dc]/30"
              />
            </div>

            {/* Fallback Message */}
            <div className="space-y-2">
              <Label className="text-[#f5f5dc]">{t("personality.fallbackLabel")}</Label>
              <Textarea
                value={settings.fallbackMessage}
                onChange={(e) => updateField("fallbackMessage", e.target.value)}
                placeholder={t("personality.fallbackPlaceholder")}
                className="min-h-[80px] bg-[#050a18] border-[#d4af37]/20 text-[#f5f5dc]"
              />
            </div>
          </div>
        </SettingsSection>

        {/* Knowledge Base */}
        <SettingsSection
          title={t("knowledge.title")}
          description={t("knowledge.description")}
          icon={BookOpen}
          isOpen={openSections.knowledge}
          onToggle={() => toggleSection("knowledge")}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[#f5f5dc]">{t("knowledge.useKnowledgeBase")}</Label>
                <p className="text-xs text-[#f5f5dc]/50 mt-1">
                  {t("knowledge.useKnowledgeBaseDesc")}
                </p>
              </div>
              <Switch
                checked={settings.useKnowledgeBase}
                onCheckedChange={(v) => updateField("useKnowledgeBase", v)}
              />
            </div>

            {settings.useKnowledgeBase && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[#f5f5dc]">{t("knowledge.confidenceLevel")}</Label>
                  <span className="text-sm text-[#d4af37]">
                    {Math.round(settings.knowledgeConfidenceThreshold * 100)}%
                  </span>
                </div>
                <Slider
                  value={[settings.knowledgeConfidenceThreshold]}
                  onValueChange={([v]: number[]) => updateField("knowledgeConfidenceThreshold", v)}
                  min={0.3}
                  max={0.95}
                  step={0.05}
                  className="w-full"
                />
                <p className="text-xs text-[#f5f5dc]/50">
                  {t("knowledge.confidenceDesc")}
                </p>
              </div>
            )}
          </div>
        </SettingsSection>

        {/* Active Hours */}
        <SettingsSection
          title={t("schedule.title")}
          description={t("schedule.description")}
          icon={Clock}
          isOpen={openSections.schedule}
          onToggle={() => toggleSection("schedule")}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[#f5f5dc]">{t("schedule.limitActiveHours")}</Label>
                <p className="text-xs text-[#f5f5dc]/50 mt-1">
                  {t("schedule.limitActiveHoursDesc")}
                </p>
              </div>
              <Switch
                checked={settings.activeHoursEnabled}
                onCheckedChange={(v) => updateField("activeHoursEnabled", v)}
              />
            </div>

            {settings.activeHoursEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#f5f5dc]">{t("schedule.startTime")}</Label>
                  <Input
                    type="time"
                    value={settings.activeHoursStart || "09:00"}
                    onChange={(e) => updateField("activeHoursStart", e.target.value)}
                    className="bg-[#050a18] border-[#d4af37]/20 text-[#f5f5dc]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#f5f5dc]">{t("schedule.endTime")}</Label>
                  <Input
                    type="time"
                    value={settings.activeHoursEnd || "17:00"}
                    onChange={(e) => updateField("activeHoursEnd", e.target.value)}
                    className="bg-[#050a18] border-[#d4af37]/20 text-[#f5f5dc]"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="text-[#f5f5dc]">{t("schedule.timezone")}</Label>
                  <Select value={settings.activeTimezone} onValueChange={(v) => updateField("activeTimezone", v)}>
                    <SelectTrigger className="bg-[#050a18] border-[#d4af37]/20 text-[#f5f5dc]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a1229] border-[#d4af37]/20">
                      <SelectItem value="Asia/Jakarta">{t("schedule.wib")}</SelectItem>
                      <SelectItem value="Asia/Makassar">{t("schedule.wita")}</SelectItem>
                      <SelectItem value="Asia/Jayapura">{t("schedule.wit")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </SettingsSection>

        {/* Rate Limits */}
        <SettingsSection
          title={t("limits.title")}
          description={t("limits.description")}
          icon={Shield}
          isOpen={openSections.limits}
          onToggle={() => toggleSection("limits")}
        >
          <div className="space-y-6">
            {/* Cooldown */}
            <div className="space-y-2">
              <Label className="text-[#f5f5dc]">{t("limits.delayBetweenReplies")}</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[settings.cooldownSeconds]}
                  onValueChange={([v]: number[]) => updateField("cooldownSeconds", v)}
                  min={0}
                  max={60}
                  step={5}
                  className="flex-1"
                />
                <span className="text-sm text-[#f5f5dc]/70 w-16">{settings.cooldownSeconds}s</span>
              </div>
              <p className="text-xs text-[#f5f5dc]/50">
                {t("limits.delayDesc")}
              </p>
            </div>

            {/* Max per thread */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[#f5f5dc]">{t("limits.maxRepliesPerThread")}</Label>
                <Switch
                  checked={settings.maxMessagesPerThread !== null}
                  onCheckedChange={(v) => updateField("maxMessagesPerThread", v ? 10 : null)}
                />
              </div>
              {settings.maxMessagesPerThread !== null && (
                <div className="flex items-center gap-4">
                  <Slider
                    value={[settings.maxMessagesPerThread]}
                    onValueChange={([v]: number[]) => updateField("maxMessagesPerThread", v)}
                    min={1}
                    max={50}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm text-[#f5f5dc]/70 w-16">{settings.maxMessagesPerThread} msgs</span>
                </div>
              )}
            </div>

            {/* Max per day */}
            <div className="space-y-2">
              <Label className="text-[#f5f5dc]">{t("limits.maxRepliesPerDay")}</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[settings.maxMessagesPerDay]}
                  onValueChange={([v]: number[]) => updateField("maxMessagesPerDay", v)}
                  min={10}
                  max={500}
                  step={10}
                  className="flex-1"
                />
                <span className="text-sm text-[#f5f5dc]/70 w-16">{settings.maxMessagesPerDay}</span>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Handoff Rules */}
        <SettingsSection
          title={t("handoff.title")}
          description={t("handoff.description")}
          icon={Hand}
          isOpen={openSections.handoff}
          onToggle={() => toggleSection("handoff")}
        >
          <div className="space-y-6">
            {/* Handoff Keywords */}
            <div className="space-y-2">
              <Label className="text-[#f5f5dc]">{t("handoff.keywords")}</Label>
              <Input
                value={settings.handoffKeywords.join(", ")}
                onChange={(e) => updateField("handoffKeywords", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                placeholder={t("handoff.keywordsPlaceholder")}
                className="bg-[#050a18] border-[#d4af37]/20 text-[#f5f5dc]"
              />
              <p className="text-xs text-[#f5f5dc]/50">
                {t("handoff.keywordsDesc")}
              </p>
            </div>

            {/* Handoff Message */}
            <div className="space-y-2">
              <Label className="text-[#f5f5dc]">{t("handoff.message")}</Label>
              <Textarea
                value={settings.handoffMessage}
                onChange={(e) => updateField("handoffMessage", e.target.value)}
                placeholder={t("handoff.messagePlaceholder")}
                className="min-h-[80px] bg-[#050a18] border-[#d4af37]/20 text-[#f5f5dc]"
              />
            </div>

            {/* Auto handoff */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[#f5f5dc]">{t("handoff.autoAfterN")}</Label>
                <Switch
                  checked={settings.autoHandoffAfterMessages !== null}
                  onCheckedChange={(v) => updateField("autoHandoffAfterMessages", v ? 5 : null)}
                />
              </div>
              {settings.autoHandoffAfterMessages !== null && (
                <div className="flex items-center gap-4">
                  <Slider
                    value={[settings.autoHandoffAfterMessages]}
                    onValueChange={([v]: number[]) => updateField("autoHandoffAfterMessages", v)}
                    min={2}
                    max={20}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm text-[#f5f5dc]/70 w-20">{settings.autoHandoffAfterMessages} msgs</span>
                </div>
              )}
            </div>
          </div>
        </SettingsSection>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#050a18] shadow-lg shadow-[#d4af37]/30 hover:shadow-[#d4af37]/50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {t("saveChanges")}
          </Button>
        </motion.div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SETTINGS SECTION COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

function SettingsSection({
  title,
  description,
  icon: Icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card className="bg-[#0a1229]/80 border-[#d4af37]/20 overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-[#d4af37]/5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#d4af37]/10">
                  <Icon className="h-5 w-5 text-[#d4af37]" />
                </div>
                <div>
                  <CardTitle className="text-[#f5f5dc]">{title}</CardTitle>
                  <CardDescription className="text-[#f5f5dc]/50">{description}</CardDescription>
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-[#f5f5dc]/40" />
              ) : (
                <ChevronDown className="h-5 w-5 text-[#f5f5dc]/40" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-6">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
