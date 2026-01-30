"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Edit,
  Power,
  PowerOff,
  Zap,
  Tag,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type TriggerType = "new_message" | "tag_added" | "status_changed" | "assigned";
type ConditionOperator = "equals" | "not_equals" | "contains" | "not_contains" | "exists" | "not_exists";
type ActionType = "add_tag" | "remove_tag" | "change_status" | "assign_to";

interface Condition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

interface Action {
  type: ActionType;
  params: Record<string, unknown>;
}

interface AutomationRule {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  trigger_type: TriggerType;
  conditions: Condition[];
  actions: Action[];
  enabled: boolean;
  priority: number;
  execution_count: number;
  last_executed_at?: string;
  created_at: string;
  updated_at: string;
}

interface AutomationRulesManagerProps {
  workspaceId: string;
  workspaceSlug: string;
}

export function AutomationRulesManager({
  workspaceId,
}: Omit<AutomationRulesManagerProps, 'workspaceSlug'>) {
  const { toast } = useToast();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState<TriggerType>("new_message");
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [priority, setPriority] = useState(50);
  const [enabled, setEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  async function fetchRules() {
    setLoading(true);
    try {
      const res = await fetch(`/api/meta/whatsapp/automation/rules?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.rules)) {
        setRules(data.rules);
      }
    } catch (error) {
      console.error("Failed to fetch rules:", error);
    } finally {
      setLoading(false);
    }
  }

  function openEditor(rule?: AutomationRule) {
    if (rule) {
      setEditingRule(rule);
      setName(rule.name);
      setDescription(rule.description || "");
      setTriggerType(rule.trigger_type);
      setConditions(rule.conditions || []);
      setActions(rule.actions || []);
      setPriority(rule.priority);
      setEnabled(rule.enabled);
    } else {
      resetForm();
    }
    setShowEditor(true);
  }

  function resetForm() {
    setEditingRule(null);
    setName("");
    setDescription("");
    setTriggerType("new_message");
    setConditions([]);
    setActions([]);
    setPriority(50);
    setEnabled(true);
  }

  function closeEditor() {
    setShowEditor(false);
    resetForm();
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for this rule",
        variant: "destructive",
      });
      return;
    }

    if (actions.length === 0) {
      toast({
        title: "Actions required",
        description: "Please add at least one action",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        workspaceId,
        name: name.trim(),
        description: description.trim() || undefined,
        triggerType,
        conditions,
        actions,
        priority,
        enabled,
      };

      const url = editingRule
        ? `/api/meta/whatsapp/automation/rules/${editingRule.id}`
        : "/api/meta/whatsapp/automation/rules";

      const res = await fetch(url, {
        method: editingRule ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to save rule");
      }

      toast({
        title: editingRule ? "Rule updated" : "Rule created",
        description: `"${name}" has been saved`,
      });

      closeEditor();
      fetchRules();
    } catch (error) {
      toast({
        title: "Failed to save rule",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleEnabled(ruleId: string, currentEnabled: boolean) {
    try {
      const res = await fetch(`/api/meta/whatsapp/automation/rules/${ruleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, enabled: !currentEnabled }),
      });

      if (!res.ok) {
        throw new Error("Failed to toggle rule");
      }

      toast({
        title: currentEnabled ? "Rule disabled" : "Rule enabled",
      });

      fetchRules();
    } catch (error) {
      toast({
        title: "Failed to toggle rule",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }

  async function handleDelete(ruleId: string, ruleName: string) {
    if (!confirm(`Delete rule "${ruleName}"?`)) return;

    try {
      const res = await fetch(`/api/meta/whatsapp/automation/rules/${ruleId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete rule");
      }

      toast({
        title: "Rule deleted",
        description: `"${ruleName}" has been removed`,
      });

      fetchRules();
    } catch (error) {
      toast({
        title: "Failed to delete rule",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }

  // Helper functions for future use
  // function addCondition() {
  //   setConditions([...conditions, { field: "status", operator: "equals", value: "" }]);
  // }

  // function updateCondition(index: number, updates: Partial<Condition>) {
  //   const updated = [...conditions];
  //   updated[index] = { ...updated[index], ...updates };
  //   setConditions(updated);
  // }

  // function removeCondition(index: number) {
  //   setConditions(conditions.filter((_, i) => i !== index));
  // }

  function addAction() {
    setActions([...actions, { type: "add_tag", params: {} }]);
  }

  function updateAction(index: number, updates: Partial<Action>) {
    const updated = [...actions];
    updated[index] = { ...updated[index], ...updates };
    setActions(updated);
  }

  function removeAction(index: number) {
    setActions(actions.filter((_, i) => i !== index));
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#f9d976]">Automation Rules</h2>
          <p className="mt-1 text-sm text-[#f5f5dc]/60">
            Create workflows that automatically respond to inbox events
          </p>
        </div>
        <Button
          onClick={() => openEditor()}
          className="gap-2 bg-gradient-to-br from-[#d4af37] to-[#b8962e] text-[#050a18] hover:from-[#f9d976] hover:to-[#d4af37]"
        >
          <Plus className="h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.length === 0 ? (
          <div className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-12 text-center">
            <Zap className="mx-auto h-12 w-12 text-[#f5f5dc]/30" />
            <p className="mt-4 text-sm text-[#f5f5dc]/60">No automation rules yet</p>
            <p className="mt-2 text-xs text-[#f5f5dc]/40">
              Create your first rule to automate inbox workflows
            </p>
          </div>
        ) : (
          rules.map((rule) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-[#d4af37]/20 bg-gradient-to-br from-[#0a1229] to-[#050a18] p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleEnabled(rule.id, rule.enabled)}
                      className={cn(
                        "rounded-lg p-2 transition-colors",
                        rule.enabled
                          ? "bg-[#10b981]/20 text-[#10b981]"
                          : "bg-[#6b7280]/20 text-[#6b7280]"
                      )}
                    >
                      {rule.enabled ? (
                        <Power className="h-4 w-4" />
                      ) : (
                        <PowerOff className="h-4 w-4" />
                      )}
                    </button>
                    <div>
                      <h3 className="font-semibold text-[#f5f5dc]">{rule.name}</h3>
                      {rule.description && (
                        <p className="mt-0.5 text-sm text-[#f5f5dc]/60">{rule.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#f5f5dc]/60">
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-[#f9d976]" />
                      <span className="capitalize">{rule.trigger_type.replace("_", " ")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#10b981]" />
                      <span>{rule.execution_count} executions</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-[#8b5cf6]" />
                      <span>Priority: {rule.priority}</span>
                    </div>
                    {rule.last_executed_at && (
                      <div className="text-[#f5f5dc]/40">
                        Last: {new Date(rule.last_executed_at).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2 text-xs">
                    {rule.conditions.length > 0 && (
                      <span className="rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-2 py-0.5 text-[#f9d976]">
                        {rule.conditions.length} condition{rule.conditions.length > 1 ? "s" : ""}
                      </span>
                    )}
                    {rule.actions.length > 0 && (
                      <span className="rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-2 py-0.5 text-[#10b981]">
                        {rule.actions.length} action{rule.actions.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditor(rule)}
                    className="rounded-lg p-2 text-[#f5f5dc]/60 transition-colors hover:bg-[#f5f5dc]/10 hover:text-[#f5f5dc]"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id, rule.name)}
                    className="rounded-lg p-2 text-[#f5f5dc]/60 transition-colors hover:bg-[#e11d48]/10 hover:text-[#e11d48]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-[#d4af37]/30 bg-gradient-to-b from-[#0a1229] to-[#050a18] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#d4af37]/20 px-6 py-4">
              <h3 className="text-xl font-bold text-[#f9d976]">
                {editingRule ? "Edit Rule" : "Create Rule"}
              </h3>
              <button
                onClick={closeEditor}
                className="rounded-lg p-2 text-[#f5f5dc]/60 hover:bg-[#f5f5dc]/10 hover:text-[#f5f5dc]"
              >
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>

            <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label className="text-[#f5f5dc]">Rule Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Auto-tag urgent messages"
                    className="mt-2 bg-[#050a18] border-[#d4af37]/20 text-[#f5f5dc]"
                  />
                </div>

                <div>
                  <Label className="text-[#f5f5dc]">Description (optional)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this rule does..."
                    className="mt-2 bg-[#050a18] border-[#d4af37]/20 text-[#f5f5dc]"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#f5f5dc]">Trigger Event</Label>
                    <select
                      value={triggerType}
                      onChange={(e) => setTriggerType(e.target.value as TriggerType)}
                      className="mt-2 w-full rounded-lg border border-[#d4af37]/20 bg-[#050a18] px-3 py-2 text-sm text-[#f5f5dc]"
                    >
                      <option value="new_message">New Message</option>
                      <option value="tag_added">Tag Added</option>
                      <option value="status_changed">Status Changed</option>
                      <option value="assigned">Assigned</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-[#f5f5dc]">Priority (0-100)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={priority}
                      onChange={(e) => setPriority(Number(e.target.value))}
                      className="mt-2 bg-[#050a18] border-[#d4af37]/20 text-[#f5f5dc]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-[#d4af37]/20 bg-[#050a18] text-[#d4af37]"
                  />
                  <Label htmlFor="enabled" className="text-[#f5f5dc]">
                    Enable this rule
                  </Label>
                </div>
              </div>

              {/* Actions */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <Label className="text-[#f5f5dc]">Actions (required)</Label>
                  <button
                    onClick={addAction}
                    className="rounded-lg border border-[#d4af37]/20 px-3 py-1 text-xs font-medium text-[#f9d976] hover:bg-[#d4af37]/10"
                  >
                    <Plus className="inline h-3 w-3 mr-1" />
                    Add Action
                  </button>
                </div>

                {actions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#f5f5dc]/20 p-8 text-center text-sm text-[#f5f5dc]/40">
                    No actions yet. Click &quot;Add Action&quot; to start.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {actions.map((action, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-[#d4af37]/20 bg-[#050a18]/50 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <select
                            value={action.type}
                            onChange={(e) =>
                              updateAction(index, { type: e.target.value as ActionType, params: {} })
                            }
                            className="flex-1 rounded-lg border border-[#d4af37]/20 bg-[#050a18] px-3 py-2 text-sm text-[#f5f5dc]"
                          >
                            <option value="add_tag">Add Tag</option>
                            <option value="remove_tag">Remove Tag</option>
                            <option value="change_status">Change Status</option>
                            <option value="assign_to">Assign To</option>
                          </select>

                          {action.type === "add_tag" && (
                            <Input
                              placeholder="Tag name"
                              value={(action.params.tag as string) || ""}
                              onChange={(e) =>
                                updateAction(index, { params: { tag: e.target.value } })
                              }
                              className="flex-1 bg-[#050a18] border-[#d4af37]/20 text-[#f5f5dc]"
                            />
                          )}

                          {action.type === "remove_tag" && (
                            <Input
                              placeholder="Tag name"
                              value={(action.params.tag as string) || ""}
                              onChange={(e) =>
                                updateAction(index, { params: { tag: e.target.value } })
                              }
                              className="flex-1 bg-[#050a18] border-[#d4af37]/20 text-[#f5f5dc]"
                            />
                          )}

                          {action.type === "change_status" && (
                            <select
                              value={(action.params.status as string) || ""}
                              onChange={(e) =>
                                updateAction(index, { params: { status: e.target.value } })
                              }
                              className="flex-1 rounded-lg border border-[#d4af37]/20 bg-[#050a18] px-3 py-2 text-sm text-[#f5f5dc]"
                            >
                              <option value="">Select status</option>
                              <option value="open">Open</option>
                              <option value="pending">Pending</option>
                              <option value="closed">Closed</option>
                            </select>
                          )}

                          {action.type === "assign_to" && (
                            <Input
                              placeholder="User ID or leave empty to unassign"
                              value={(action.params.userId as string) || ""}
                              onChange={(e) =>
                                updateAction(index, { params: { userId: e.target.value } })
                              }
                              className="flex-1 bg-[#050a18] border-[#d4af37]/20 text-[#f5f5dc]"
                            />
                          )}

                          <button
                            onClick={() => removeAction(index)}
                            className="rounded-lg p-2 text-[#e11d48] hover:bg-[#e11d48]/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#d4af37]/20 px-6 py-4">
              <Button
                onClick={closeEditor}
                variant="ghost"
                className="text-[#f5f5dc]/60"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-[#10b981] text-white hover:bg-[#059669]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {editingRule ? "Update Rule" : "Create Rule"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
