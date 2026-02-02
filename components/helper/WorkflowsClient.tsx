"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Play,
  Trash2,
  Pencil,
  Zap,
  Clock,
  Mail,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Workflow = {
  id: string;
  name: string;
  description?: string | null;
  trigger_type: string;
  trigger_config?: Record<string, unknown>;
  steps: WorkflowStep[];
  is_active: boolean;
  run_count?: number;
  last_run_at?: string | null;
  created_at: string;
};

type WorkflowStep = {
  id: string;
  type: "action" | "condition" | "delay";
  action?: string;
  params?: Record<string, unknown>;
  condition?: string;
  delay_seconds?: number;
};

type WorkflowsClientProps = {
  workspaceId: string;
  initialWorkflows: Workflow[];
};

const TRIGGER_TYPES = [
  { value: "message_received", label: "Message Received", icon: MessageCircle, description: "Trigger when a new message arrives" },
  { value: "scheduled", label: "Scheduled", icon: Clock, description: "Run on a schedule (e.g., daily, hourly)" },
  { value: "tag_added", label: "Tag Added", icon: Zap, description: "Trigger when a tag is added to contact" },
  { value: "manual", label: "Manual", icon: Play, description: "Trigger manually by clicking Run" },
];

const ACTION_TYPES = [
  { value: "send_message", label: "Send WhatsApp Message", icon: Mail },
  { value: "add_tag", label: "Add Tag", icon: Zap },
  { value: "notify_team", label: "Notify Team", icon: MessageCircle },
  { value: "ai_response", label: "AI Response", icon: Zap },
];

export function WorkflowsClient({
  workspaceId,
  initialWorkflows,
}: WorkflowsClientProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  const [isCreating, setIsCreating] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Workflow | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTriggerType, setFormTriggerType] = useState("message_received");
  const [formSteps, setFormSteps] = useState<WorkflowStep[]>([]);

  const resetForm = useCallback(() => {
    setFormName("");
    setFormDescription("");
    setFormTriggerType("message_received");
    setFormSteps([]);
    setError(null);
  }, []);

  const openCreate = useCallback(() => {
    resetForm();
    setIsCreating(true);
  }, [resetForm]);

  const openEdit = useCallback((workflow: Workflow) => {
    setFormName(workflow.name);
    setFormDescription(workflow.description ?? "");
    setFormTriggerType(workflow.trigger_type);
    setFormSteps(workflow.steps ?? []);
    setEditingWorkflow(workflow);
    setError(null);
  }, []);

  const addStep = useCallback(() => {
    const newStep: WorkflowStep = {
      id: crypto.randomUUID(),
      type: "action",
      action: "send_message",
      params: {},
    };
    setFormSteps((prev) => [...prev, newStep]);
  }, []);

  const removeStep = useCallback((stepId: string) => {
    setFormSteps((prev) => prev.filter((s) => s.id !== stepId));
  }, []);

  const updateStep = useCallback((stepId: string, updates: Partial<WorkflowStep>) => {
    setFormSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, ...updates } : s))
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!formName.trim()) {
      setError("Workflow name is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const isEditing = !!editingWorkflow;
      const method = isEditing ? "PUT" : "POST";
      const body = {
        workspaceId,
        id: isEditing ? editingWorkflow.id : undefined,
        name: formName.trim(),
        description: formDescription.trim() || null,
        triggerType: formTriggerType,
        steps: formSteps,
      };

      const res = await fetch(`/api/helper/workflows`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save workflow");
      }

      const { workflow } = await res.json();

      if (isEditing) {
        setWorkflows((prev) =>
          prev.map((w) => (w.id === workflow.id ? workflow : w))
        );
        setEditingWorkflow(null);
      } else {
        setWorkflows((prev) => [workflow, ...prev]);
        setIsCreating(false);
      }

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [workspaceId, formName, formDescription, formTriggerType, formSteps, editingWorkflow, resetForm]);

  const handleToggleActive = useCallback(async (workflow: Workflow, active: boolean) => {
    try {
      const res = await fetch(`/api/helper/workflows`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          id: workflow.id,
          isActive: active,
        }),
      });

      if (res.ok) {
        setWorkflows((prev) =>
          prev.map((w) => (w.id === workflow.id ? { ...w, is_active: active } : w))
        );
      }
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  }, [workspaceId]);

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return;

    try {
      const res = await fetch(
        `/api/helper/workflows?workspaceId=${workspaceId}&id=${deleteConfirm.id}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        setWorkflows((prev) => prev.filter((w) => w.id !== deleteConfirm.id));
        setDeleteConfirm(null);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }, [workspaceId, deleteConfirm]);

  const handleRun = useCallback(async (workflow: Workflow) => {
    try {
      const res = await fetch(`/api/helper/workflows/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          workflowId: workflow.id,
        }),
      });

      if (res.ok) {
        // Increment run count locally
        setWorkflows((prev) =>
          prev.map((w) =>
            w.id === workflow.id
              ? { ...w, run_count: (w.run_count ?? 0) + 1, last_run_at: new Date().toISOString() }
              : w
          )
        );
      }
    } catch (err) {
      console.error("Run failed:", err);
    }
  }, [workspaceId]);

  const isModalOpen = isCreating || !!editingWorkflow;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#f5f5dc]">Workflows</h2>
          <p className="text-[#f5f5dc]/60 mt-1">
            Automate repetitive tasks with AI-powered workflows
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#b8860b] hover:bg-[#9a7209] text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Workflow
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#1a1a2e]/80 border-[#b8860b]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#f5f5dc]/60">
              Total Workflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#f5f5dc]">{workflows.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a2e]/80 border-[#b8860b]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#f5f5dc]/60">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {workflows.filter((w) => w.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a2e]/80 border-[#b8860b]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#f5f5dc]/60">
              Total Runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#b8860b]">
              {workflows.reduce((sum, w) => sum + (w.run_count ?? 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {workflows.length === 0 ? (
          <Card className="bg-[#1a1a2e]/80 border-[#b8860b]/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Zap className="w-12 h-12 text-[#b8860b]/50 mb-4" />
              <h3 className="text-lg font-medium text-[#f5f5dc]/80">No workflows yet</h3>
              <p className="text-[#f5f5dc]/60 text-center mt-2 max-w-sm">
                Create your first workflow to automate tasks like sending messages, adding tags, or notifying your team.
              </p>
              <Button
                onClick={openCreate}
                className="mt-6 bg-[#b8860b] hover:bg-[#9a7209] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Workflow
              </Button>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            {workflows.map((workflow) => {
              const TriggerIcon = TRIGGER_TYPES.find((t) => t.value === workflow.trigger_type)?.icon ?? Zap;
              
              return (
                <motion.div
                  key={workflow.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="bg-[#1a1a2e]/80 border-[#b8860b]/30 hover:border-[#b8860b]/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Status indicator */}
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            workflow.is_active
                              ? "bg-green-500/20 text-green-400"
                              : "bg-[#f5f5dc]/10 text-[#f5f5dc]/40"
                          )}
                        >
                          <TriggerIcon className="w-5 h-5" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-[#f5f5dc] truncate">
                              {workflow.name}
                            </h3>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                workflow.is_active
                                  ? "border-green-500/50 text-green-400"
                                  : "border-[#f5f5dc]/30 text-[#f5f5dc]/50"
                              )}
                            >
                              {workflow.is_active ? "Active" : "Paused"}
                            </Badge>
                          </div>
                          <p className="text-sm text-[#f5f5dc]/60 truncate mt-0.5">
                            {workflow.description || `${workflow.steps?.length ?? 0} steps`}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-[#f5f5dc]/40">
                            <span>{workflow.run_count ?? 0} runs</span>
                            {workflow.last_run_at && (
                              <span>
                                Last run: {new Date(workflow.last_run_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={workflow.is_active}
                            onCheckedChange={(active) => handleToggleActive(workflow, active)}
                          />
                          
                          {workflow.trigger_type === "manual" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRun(workflow)}
                              className="text-[#b8860b] hover:bg-[#b8860b]/20"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(workflow)}
                            className="text-[#f5f5dc]/60 hover:text-[#f5f5dc]"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirm(workflow)}
                            className="text-red-400/60 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreating(false);
          setEditingWorkflow(null);
          resetForm();
        }
      }}>
        <DialogContent className="bg-[#1a1a2e] border-[#b8860b]/30 text-[#f5f5dc] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWorkflow ? "Edit Workflow" : "Create Workflow"}
            </DialogTitle>
            <DialogDescription className="text-[#f5f5dc]/60">
              Define when and how your workflow should run
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Workflow Name</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Welcome New Customers"
                className="bg-[#16213e] border-[#b8860b]/30 text-[#f5f5dc]"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="What does this workflow do?"
                className="bg-[#16213e] border-[#b8860b]/30 text-[#f5f5dc] resize-none"
                rows={2}
              />
            </div>

            {/* Trigger Type */}
            <div className="space-y-2">
              <Label>Trigger</Label>
              <Select value={formTriggerType} onValueChange={setFormTriggerType}>
                <SelectTrigger className="bg-[#16213e] border-[#b8860b]/30 text-[#f5f5dc]">
                  <SelectValue placeholder="Select trigger" />
                </SelectTrigger>
                <SelectContent className="bg-[#16213e] border-[#b8860b]/30">
                  {TRIGGER_TYPES.map((trigger) => (
                    <SelectItem
                      key={trigger.value}
                      value={trigger.value}
                      className="text-[#f5f5dc] focus:bg-[#b8860b]/20"
                    >
                      <div className="flex items-center gap-2">
                        <trigger.icon className="w-4 h-4 text-[#b8860b]" />
                        <span>{trigger.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-[#f5f5dc]/50">
                {TRIGGER_TYPES.find((t) => t.value === formTriggerType)?.description}
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Steps</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addStep}
                  className="border-[#b8860b]/30 text-[#b8860b] hover:bg-[#b8860b]/10"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Step
                </Button>
              </div>

              {formSteps.length === 0 ? (
                <div className="p-6 border border-dashed border-[#b8860b]/30 rounded-lg text-center">
                  <p className="text-[#f5f5dc]/50 text-sm">
                    No steps added yet. Click &quot;Add Step&quot; to define what happens when this workflow runs.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formSteps.map((step, index) => (
                    <Card key={step.id} className="bg-[#16213e]/50 border-[#b8860b]/20">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-[#b8860b]/20 text-[#b8860b] flex items-center justify-center text-xs font-medium flex-shrink-0 mt-1">
                            {index + 1}
                          </div>
                          <div className="flex-1 space-y-2">
                            <Select
                              value={step.action ?? "send_message"}
                              onValueChange={(value) => updateStep(step.id, { action: value })}
                            >
                              <SelectTrigger className="bg-[#1a1a2e] border-[#b8860b]/30 text-[#f5f5dc] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#16213e] border-[#b8860b]/30">
                                {ACTION_TYPES.map((action) => (
                                  <SelectItem
                                    key={action.value}
                                    value={action.value}
                                    className="text-[#f5f5dc] focus:bg-[#b8860b]/20"
                                  >
                                    {action.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400/60 hover:text-red-400"
                            onClick={() => removeStep(step.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsCreating(false);
                setEditingWorkflow(null);
                resetForm();
              }}
              className="text-[#f5f5dc]/60"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#b8860b] hover:bg-[#9a7209] text-white"
            >
              {saving ? "Saving..." : editingWorkflow ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="bg-[#1a1a2e] border-[#b8860b]/30 text-[#f5f5dc]">
          <DialogHeader>
            <DialogTitle>Delete Workflow</DialogTitle>
            <DialogDescription className="text-[#f5f5dc]/60">
              Are you sure you want to delete &quot;{deleteConfirm?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirm(null)}
              className="text-[#f5f5dc]/60"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
