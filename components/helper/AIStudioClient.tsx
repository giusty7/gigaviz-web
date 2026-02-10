"use client";
import { logger } from "@/lib/logging";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles as SparklesIcon,
  Cpu as CpuChipIcon,
  SlidersHorizontal as AdjustmentsHorizontalIcon,
  FlaskConical as BeakerIcon,
  FileText as DocumentTextIcon,
  Play as PlayIcon,
  Square as StopIcon,
  RefreshCw as ArrowPathIcon,
  CheckCircle as CheckCircleIcon,
  AlertTriangle as ExclamationTriangleIcon,
  Clipboard as ClipboardDocumentIcon,
  Plus as PlusIcon,
  Trash2 as TrashIcon,
  PenSquare as PencilSquareIcon,
  Eye as EyeIcon,
  Settings as Cog6ToothIcon,
  Zap as BoltIcon,
  MessageSquare as ChatBubbleLeftRightIcon,
  Lightbulb as LightBulbIcon,
  BookOpen as BookOpenIcon,
  BarChart3 as ChartBarIcon,
  X as XIcon,
} from "lucide-react";

// Types
interface HelperSettings {
  id: string;
  workspace_id: string;
  ai_provider: string;
  model_name: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  features: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

interface HelperTemplate {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  prompt: string;
  category: string;
  variables: string[];
  is_active: boolean;
  usage_count: number;
  created_at: string;
}

interface AIStudioClientProps {
  workspaceId: string;
  workspaceSlug: string;
  initialSettings: HelperSettings | null;
  initialTemplates: HelperTemplate[];
}

// AI Provider options
const AI_PROVIDERS = [
  { id: "openai", name: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"] },
  { id: "anthropic", name: "Anthropic", models: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"] },
  { id: "google", name: "Google AI", models: ["gemini-pro", "gemini-pro-vision"] },
];

// Template categories
const TEMPLATE_CATEGORIES = [
  { id: "general", name: "General", icon: ChatBubbleLeftRightIcon },
  { id: "copywriting", name: "Copywriting", icon: PencilSquareIcon },
  { id: "analysis", name: "Analysis", icon: ChartBarIcon },
  { id: "code", name: "Code", icon: CpuChipIcon },
  { id: "creative", name: "Creative", icon: LightBulbIcon },
  { id: "business", name: "Business", icon: DocumentTextIcon },
];

export function AIStudioClient({ workspaceId, workspaceSlug, initialSettings, initialTemplates }: AIStudioClientProps) {
  // State
  const [activeTab, setActiveTab] = useState<"settings" | "playground" | "templates">("settings");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [templates, setTemplates] = useState<HelperTemplate[]>(initialTemplates);
  
  // Settings state
  const [currentSettings, setCurrentSettings] = useState<Partial<HelperSettings>>({
    ai_provider: initialSettings?.ai_provider || "openai",
    model_name: initialSettings?.model_name || "gpt-4o-mini",
    temperature: initialSettings?.temperature || 0.7,
    max_tokens: initialSettings?.max_tokens || 2048,
    system_prompt: initialSettings?.system_prompt || "You are a helpful AI assistant for Gigaviz platform. Be concise, professional, and helpful.",
    features: initialSettings?.features || {
      rag_enabled: true,
      memory_enabled: true,
      tools_enabled: true,
      streaming_enabled: true,
    },
  });

  // Playground state
  const [playgroundPrompt, setPlaygroundPrompt] = useState("");
  const [playgroundResponse, setPlaygroundResponse] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [testVariables, setTestVariables] = useState<Record<string, string>>({});

  // Templates state
  const [selectedTemplate, setSelectedTemplate] = useState<HelperTemplate | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateFilter, setTemplateFilter] = useState("all");
  const [templateSearch, setTemplateSearch] = useState("");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplatePrompt, setNewTemplatePrompt] = useState("");

  // Load templates from real API
  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/helper/templates?workspaceId=${workspaceId}`, { 
        cache: "no-store" 
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.templates) {
          setTemplates(data.templates);
        }
      }
    } catch (error) {
      logger.error("Failed to load templates:", error);
      setTemplates(initialTemplates);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, initialTemplates]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Handle variable testing
  const applyVariables = useCallback((prompt: string) => {
    let result = prompt;
    Object.entries(testVariables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
    });
    return result;
  }, [testVariables]);

  // Get available models for current provider
  const currentProvider = AI_PROVIDERS.find(p => p.id === currentSettings.ai_provider);
  const availableModels = currentProvider?.models || [];

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    const matchesFilter = templateFilter === "all" || t.category === templateFilter;
    const matchesSearch = t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
                          t.description.toLowerCase().includes(templateSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Save settings - Real API
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    
    try {
      const res = await fetch(`/api/helper/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          ...currentSettings,
        }),
      });
      if (res.ok) {
        setSaveStatus("success");
      } else {
        setSaveStatus("error");
      }
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      logger.error("Failed to save settings:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  // Run playground test
  const handleRunPlayground = async () => {
    if (!playgroundPrompt.trim()) return;
    
    setIsRunning(true);
    setPlaygroundResponse("");
    
    try {
      // Simulate streaming response
      const words = "This is a simulated AI response demonstrating the playground feature. In production, this would connect to your configured AI provider and stream the actual response. The response would be generated based on your system prompt, temperature settings, and the input you provided.".split(" ");
      
      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setPlaygroundResponse(prev => prev + (i > 0 ? " " : "") + words[i]);
      }
    } catch (error) {
      logger.error("Playground error:", error);
      setPlaygroundResponse("Error: Failed to generate response. Please check your API configuration.");
    } finally {
      setIsRunning(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Tab buttons
  const tabs = [
    { id: "settings", label: "AI Settings", icon: Cog6ToothIcon },
    { id: "playground", label: "Playground", icon: BeakerIcon },
    { id: "templates", label: "Prompt Templates", icon: DocumentTextIcon },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <CpuChipIcon className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Active Provider</p>
              <p className="text-lg font-semibold text-white capitalize">{currentSettings.ai_provider}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <SparklesIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Model</p>
              <p className="text-lg font-semibold text-white">{currentSettings.model_name}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <DocumentTextIcon className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Templates</p>
              <p className="text-lg font-semibold text-white">{templates.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <AdjustmentsHorizontalIcon className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Temperature</p>
              <p className="text-lg font-semibold text-white">{currentSettings.temperature}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Settings Tab */}
        {activeTab === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* AI Provider Selection */}
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CpuChipIcon className="w-5 h-5 text-purple-400" />
                AI Provider Configuration
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Provider */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Provider</label>
                  <select
                    value={currentSettings.ai_provider}
                    onChange={(e) => {
                      const provider = AI_PROVIDERS.find(p => p.id === e.target.value);
                      setCurrentSettings(prev => ({
                        ...prev,
                        ai_provider: e.target.value,
                        model_name: provider?.models[0] || "",
                      }));
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  >
                    {AI_PROVIDERS.map(provider => (
                      <option key={provider.id} value={provider.id} className="bg-gray-900">
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                  <select
                    value={currentSettings.model_name}
                    onChange={(e) => setCurrentSettings(prev => ({ ...prev, model_name: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  >
                    {availableModels.map(model => (
                      <option key={model} value={model} className="bg-gray-900">
                        {model}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Temperature */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Temperature: {currentSettings.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={currentSettings.temperature}
                    onChange={(e) => setCurrentSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    className="w-full accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Precise (0)</span>
                    <span>Balanced (1)</span>
                    <span>Creative (2)</span>
                  </div>
                </div>

                {/* Max Tokens */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Tokens</label>
                  <input
                    type="number"
                    min="256"
                    max="8192"
                    step="256"
                    value={currentSettings.max_tokens}
                    onChange={(e) => setCurrentSettings(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* System Prompt */}
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-400" />
                System Prompt
              </h3>
              <textarea
                value={currentSettings.system_prompt}
                onChange={(e) => setCurrentSettings(prev => ({ ...prev, system_prompt: e.target.value }))}
                rows={6}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                placeholder="Enter your system prompt..."
              />
              <p className="text-xs text-gray-500 mt-2">
                This prompt defines the AI&apos;s personality and behavior across all conversations.
              </p>
            </div>

            {/* Feature Toggles */}
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BoltIcon className="w-5 h-5 text-amber-400" />
                Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(currentSettings.features || {}).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <span className="text-gray-300 capitalize">{key.replace(/_/g, " ")}</span>
                    <input
                      type="checkbox"
                      checked={value as boolean}
                      onChange={(e) => setCurrentSettings(prev => ({
                        ...prev,
                        features: { ...prev.features, [key]: e.target.checked }
                      }))}
                      className="w-5 h-5 rounded accent-purple-500"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              {saveStatus === "success" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-green-400"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Settings saved!
                </motion.div>
              )}
              {saveStatus === "error" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-red-400"
                >
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  Failed to save
                </motion.div>
              )}
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Playground Tab */}
        {activeTab === "playground" && (
          <motion.div
            key="playground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input */}
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <PencilSquareIcon className="w-5 h-5 text-blue-400" />
                  Input
                </h3>
                <textarea
                  value={playgroundPrompt}
                  onChange={(e) => setPlaygroundPrompt(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="Enter your prompt here..."
                />
                <div className="flex justify-between items-center mt-4">
                  <p className="text-xs text-gray-500">
                    {playgroundPrompt.length} characters
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPlaygroundPrompt("")}
                      className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleRunPlayground}
                      disabled={isRunning || !playgroundPrompt.trim()}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                    >
                      {isRunning ? (
                        <>
                          <StopIcon className="w-4 h-4" />
                          Stop
                        </>
                      ) : (
                        <>
                          <PlayIcon className="w-4 h-4" />
                          Run
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Output */}
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-purple-400" />
                    Output
                  </h3>
                  {playgroundResponse && (
                    <button
                      onClick={() => copyToClipboard(playgroundResponse)}
                      className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      title="Copy to clipboard"
                    >
                      <ClipboardDocumentIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <div className="min-h-[300px] p-4 rounded-lg bg-black/20 border border-white/5 text-gray-300 whitespace-pre-wrap">
                  {isRunning && !playgroundResponse && (
                    <div className="flex items-center gap-2 text-purple-400">
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      Generating response...
                    </div>
                  )}
                  {playgroundResponse || (
                    <span className="text-gray-500">Response will appear here...</span>
                  )}
                  {isRunning && playgroundResponse && (
                    <span className="inline-block w-2 h-4 bg-purple-500 animate-pulse ml-1" />
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <LightBulbIcon className="w-5 h-5 text-amber-400" />
                Quick Prompts
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "Explain this concept simply",
                  "Write a professional email",
                  "Generate 5 ideas for",
                  "Analyze this data",
                  "Create a summary",
                  "Debug this code",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setPlaygroundPrompt(prompt + ": ")}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTemplateFilter("all")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    templateFilter === "all"
                      ? "bg-purple-500 text-white"
                      : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  All
                </button>
                {TEMPLATE_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setTemplateFilter(cat.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      templateFilter === cat.id
                        ? "bg-purple-500 text-white"
                        : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <cat.icon className="w-4 h-4" />
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder="Search templates..."
                  className="flex-1 md:w-64 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  New
                </button>
              </div>
            </div>

            {/* Templates Grid */}
            {filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-white group-hover:text-purple-400 transition-colors">
                        {template.name}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        template.is_active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                      }`}>
                        {template.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                      {template.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="capitalize">{template.category}</span>
                      <span>{template.usage_count} uses</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : templates.length === 0 ? (
              <div className="p-12 rounded-xl bg-white/5 border border-white/10 text-center">
                <DocumentTextIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Templates Yet</h3>
                <p className="text-gray-400 mb-4">
                  Create your first prompt template to get started
                </p>
                <button
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Create Template
                </button>
              </div>
            ) : (
              <div className="p-12 rounded-xl bg-white/5 border border-white/10 text-center">
                <DocumentTextIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Matching Templates</h3>
                <p className="text-gray-400">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template Detail Modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setSelectedTemplate(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl p-6 rounded-xl bg-gray-900 border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">{selectedTemplate.name}</h3>
                  <p className="text-sm text-gray-400">{selectedTemplate.description}</p>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  âœ•
                </button>
              </div>

              <div className="p-4 rounded-lg bg-black/30 border border-white/5 mb-4">
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{selectedTemplate.prompt}</p>
              </div>

              {selectedTemplate.variables.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-400 mb-2">Variables:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map(v => (
                      <span key={v} className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-sm">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <EyeIcon className="w-3 h-3" />
                  Used {selectedTemplate.usage_count} times â€¢ Created {new Date(selectedTemplate.created_at).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Apply variables to prompt before trying
                      const processed = applyVariables(selectedTemplate.prompt);
                      setPlaygroundPrompt(processed);
                      setActiveTab("playground");
                      setSelectedTemplate(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                  >
                    <BeakerIcon className="w-4 h-4" />
                    Try in Playground
                  </button>
                  <button
                    onClick={() => copyToClipboard(selectedTemplate.prompt)}
                    className="px-4 py-2 rounded-lg bg-purple-500 text-white hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                    Copy
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create New Template Modal */}
      <AnimatePresence>
        {isTemplateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setIsTemplateModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl p-6 rounded-xl bg-gray-900 border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <BookOpenIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Create New Template</h3>
                    <p className="text-sm text-gray-400">Save your prompts for reuse</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Template Name</label>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="e.g., Email Response Generator"
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
                  <textarea
                    value={newTemplatePrompt}
                    onChange={(e) => setNewTemplatePrompt(e.target.value)}
                    rows={6}
                    placeholder="Enter your prompt template. Use {{variable}} syntax for dynamic values."
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: Use {`{{variable_name}}`} for dynamic values that can be filled later
                  </p>
                </div>

                {/* Variable Testing */}
                {newTemplatePrompt.includes("{{") && (
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <TrashIcon className="w-4 h-4 text-amber-400" />
                      <p className="text-sm font-medium text-gray-300">Test Variables</p>
                    </div>
                    <div className="space-y-2">
                      {Array.from(newTemplatePrompt.matchAll(/\{\{(\w+)\}\}/g)).map(match => (
                        <div key={match[1]} className="flex items-center gap-2">
                          <span className="text-sm text-purple-400 w-24">{match[1]}:</span>
                          <input
                            type="text"
                            value={testVariables[match[1]] || ""}
                            onChange={(e) => setTestVariables(prev => ({ ...prev, [match[1]]: e.target.value }))}
                            placeholder={`Value for ${match[1]}`}
                            className="flex-1 px-3 py-1 rounded bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsTemplateModalOpen(false);
                    setNewTemplateName("");
                    setNewTemplatePrompt("");
                    setTestVariables({});
                  }}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!newTemplateName.trim() || !newTemplatePrompt.trim()) return;
                    setIsSaving(true);
                    try {
                      // In production, save via API to /api/helper/templates
                      logger.info("Saving template:", { 
                        workspaceId, 
                        workspaceSlug,
                        name: newTemplateName, 
                        prompt: newTemplatePrompt 
                      });
                      await new Promise(resolve => setTimeout(resolve, 500));
                      setIsTemplateModalOpen(false);
                      setNewTemplateName("");
                      setNewTemplatePrompt("");
                      setTestVariables({});
                      setSaveStatus("success");
                      setTimeout(() => setSaveStatus("idle"), 3000);
                    } catch (error) {
                      logger.error("Failed to save template:", error);
                      setSaveStatus("error");
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving || !newTemplateName.trim() || !newTemplatePrompt.trim()}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4" />
                      Create Template
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="p-6 rounded-xl bg-gray-900 border border-white/10 flex items-center gap-3">
            <ArrowPathIcon className="w-6 h-6 text-purple-400 animate-spin" />
            <span className="text-white">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
}
