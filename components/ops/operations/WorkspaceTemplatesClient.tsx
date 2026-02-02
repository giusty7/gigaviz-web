"use client";

import { useState, useEffect } from "react";
import { Copy, Plus, RefreshCw, Settings, Trash2 } from "lucide-react";

interface WorkspaceTemplate {
  id: string;
  name: string;
  description: string | null;
  default_plan: string | null;
  default_modules: string[];
  is_active: boolean;
  use_count: number;
  created_at: string;
}

export default function WorkspaceTemplatesClient() {
  const [templates, setTemplates] = useState<WorkspaceTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      // Note: API endpoint would need to be created
      // For now, showing empty state
      setTemplates([]);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Workspace Templates</h1>
          <p className="text-zinc-400">Pre-configured workspace setups for quick provisioning</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTemplates}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white hover:bg-zinc-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700">
            <Plus className="h-4 w-4" />
            New Template
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <Copy className="mx-auto h-12 w-12 text-zinc-600" />
          <h3 className="mt-4 text-lg font-medium text-white">No Templates Yet</h3>
          <p className="mt-2 text-zinc-400">
            Create a template to quickly provision new workspaces with pre-configured settings.
          </p>
          <button className="mt-6 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700">
            <Plus className="h-4 w-4" />
            Create First Template
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">{template.name}</h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    {template.description || "No description"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-zinc-400 hover:text-white">
                    <Settings className="h-4 w-4" />
                  </button>
                  <button className="text-zinc-400 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Default Plan</span>
                  <span className="capitalize text-white">
                    {template.default_plan || "Free"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Modules</span>
                  <span className="text-white">
                    {template.default_modules.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Used</span>
                  <span className="text-white">{template.use_count} times</span>
                </div>
              </div>
              <button className="mt-4 w-full rounded-lg border border-purple-500 bg-purple-500/10 py-2 text-sm text-purple-400 hover:bg-purple-500/20">
                Use Template
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
        <h4 className="font-medium text-white">Template Features</h4>
        <ul className="mt-2 space-y-1 text-sm text-zinc-400">
          <li>• Pre-configured subscription plans</li>
          <li>• Default module activations</li>
          <li>• Workspace settings and preferences</li>
          <li>• Entitlement overrides</li>
        </ul>
      </div>
    </div>
  );
}
