"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  PlusIcon, 
  MoreVerticalIcon, 
  EditIcon, 
  TrashIcon,
  ShuffleIcon,
  ScaleIcon,
  UserIcon,
  UsersIcon,
  SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

type AssignmentStrategy = "round_robin" | "load_balance" | "manual";

interface AssignmentRule {
  id: string;
  workspaceId: string;
  name: string;
  strategy: AssignmentStrategy;
  agentIds: string[];
  isActive: boolean;
  maxChatsPerAgent: number | null;
  priority: number;
  conditions: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceMember {
  userId: string;
  role: string;
  profile?: {
    fullName: string | null;
    email: string;
  };
}

interface Props {
  members: WorkspaceMember[];
}

const STRATEGY_CONFIG: Record<AssignmentStrategy, { 
  labelKey: string; 
  descKey: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  round_robin: { 
    labelKey: "roundRobin", 
    descKey: "roundRobinDesc",
    icon: ShuffleIcon,
  },
  load_balance: { 
    labelKey: "loadBalance", 
    descKey: "loadBalanceDesc",
    icon: ScaleIcon,
  },
  manual: { 
    labelKey: "manual", 
    descKey: "manualDesc",
    icon: UserIcon,
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AssignmentRulesManager({ members }: Props) {
  const { toast } = useToast();
  const t = useTranslations("metaHubUI.assignmentRules");
  
  // State
  const [rules, setRules] = useState<AssignmentRule[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AssignmentRule | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formName, setFormName] = useState("");
  const [formStrategy, setFormStrategy] = useState<AssignmentStrategy>("round_robin");
  const [formAgentIds, setFormAgentIds] = useState<string[]>([]);
  const [formMaxChats, setFormMaxChats] = useState<string>("");
  const [formPriority, setFormPriority] = useState<string>("0");

  // ============================================================================
  // FETCH DATA
  // ============================================================================

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/meta-hub/assignment");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRules(data.rules || []);
    } catch (err) {
      toast({
        title: t("errorLoading"),
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const openCreateDialog = () => {
    setEditingRule(null);
    setFormName("");
    setFormStrategy("round_robin");
    setFormAgentIds(members.map(m => m.userId));
    setFormMaxChats("20");
    setFormPriority("0");
    setDialogOpen(true);
  };

  const openEditDialog = (rule: AssignmentRule) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormStrategy(rule.strategy);
    setFormAgentIds(rule.agentIds);
    setFormMaxChats(rule.maxChatsPerAgent?.toString() || "");
    setFormPriority(rule.priority.toString());
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast({
        title: t("validationError"),
        description: t("nameRequired"),
        variant: "destructive",
      });
      return;
    }

    if (formAgentIds.length === 0) {
      toast({
        title: t("validationError"),
        description: t("selectOneAgent"),
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      const payload = {
        name: formName.trim(),
        strategy: formStrategy,
        agentIds: formAgentIds,
        maxChatsPerAgent: formMaxChats ? parseInt(formMaxChats) : null,
        priority: parseInt(formPriority) || 0,
        ...(editingRule ? { id: editingRule.id } : {}),
      };

      const method = editingRule ? "PATCH" : "POST";
      const res = await fetch("/api/meta-hub/assignment", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({
        title: editingRule ? t("ruleUpdated") : t("ruleCreated"),
        description: t("ruleSavedDesc", { name: formName }),
      });

      setDialogOpen(false);
      fetchRules();
    } catch (err) {
      toast({
        title: t("errorSaving"),
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (rule: AssignmentRule) => {
    try {
      const res = await fetch("/api/meta-hub/assignment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rule.id, isActive: !rule.isActive }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({
        title: rule.isActive ? t("ruleDeactivated") : t("ruleActivated"),
      });

      fetchRules();
    } catch (err) {
      toast({
        title: t("errorUpdating"),
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (rule: AssignmentRule) => {
    if (!confirm(t("confirmDelete", { name: rule.name }))) return;

    try {
      const res = await fetch(`/api/meta-hub/assignment?id=${rule.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({
        title: t("ruleDeleted"),
        description: t("ruleDeletedDesc", { name: rule.name }),
      });

      fetchRules();
    } catch (err) {
      toast({
        title: t("errorDeleting"),
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const toggleAgent = (userId: string) => {
    setFormAgentIds(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              {t("title")}
            </CardTitle>
            <CardDescription>
              {t("description")}
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <PlusIcon className="h-4 w-4 mr-2" />
            {t("addRule")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Empty state */}
          {rules.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <SettingsIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">{t("noRulesTitle")}</p>
              <p className="text-sm">{t("noRulesDesc")}</p>
              <Button className="mt-4" onClick={openCreateDialog}>
                <PlusIcon className="h-4 w-4 mr-2" />
                {t("createRule")}
              </Button>
            </div>
          )}

          {/* Rules list */}
          {rules.map(rule => (
            <AssignmentRuleCard
              key={rule.id}
              rule={rule}
              members={members}
              onEdit={() => openEditDialog(rule)}
              onDelete={() => handleDelete(rule)}
              onToggleActive={() => handleToggleActive(rule)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? t("editTitle") : t("createTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("createDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("ruleName")}</Label>
              <Input
                id="name"
                placeholder="e.g., Default Assignment"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("strategy")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(STRATEGY_CONFIG) as AssignmentStrategy[]).map(strategy => {
                  const config = STRATEGY_CONFIG[strategy];
                  const Icon = config.icon;
                  const isSelected = formStrategy === strategy;
                  
                  return (
                    <button
                      key={strategy}
                      type="button"
                      onClick={() => setFormStrategy(strategy)}
                      className={cn(
                        "p-3 border rounded-lg text-left transition-colors",
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "hover:bg-muted"
                      )}
                    >
                      <Icon className={cn(
                        "h-5 w-5 mb-1",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )} />
                      <div className="text-sm font-medium">{t(config.labelKey)}</div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {t(STRATEGY_CONFIG[formStrategy].descKey)}
              </p>
            </div>

            {formStrategy === "load_balance" && (
              <div className="space-y-2">
                <Label htmlFor="maxChats">{t("maxChatsLabel")}</Label>
                <Input
                  id="maxChats"
                  type="number"
                  placeholder={t("maxChatsPlaceholder")}
                  value={formMaxChats}
                  onChange={(e) => setFormMaxChats(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {t("maxChatsHint")}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>{t("selectAgents")}</Label>
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {members.map(member => {
                  const name = member.profile?.fullName || member.profile?.email || member.userId;
                  const isSelected = formAgentIds.includes(member.userId);
                  
                  return (
                    <label
                      key={member.userId}
                      className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleAgent(member.userId)}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{member.role}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("agents", { count: formAgentIds.length })}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t("saving") : editingRule ? t("save") : t("createRule")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function AssignmentRuleCard({
  rule,
  members,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  rule: AssignmentRule;
  members: WorkspaceMember[];
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  const t = useTranslations("metaHubUI.assignmentRules");
  const config = STRATEGY_CONFIG[rule.strategy];
  const Icon = config.icon;
  
  const agentNames = rule.agentIds
    .map(id => {
      const member = members.find(m => m.userId === id);
      return member?.profile?.fullName || member?.profile?.email || "Unknown";
    })
    .slice(0, 3);
  
  const remainingCount = rule.agentIds.length - 3;

  return (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={cn(
            "p-2 rounded-lg",
            rule.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            <Icon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{rule.name}</h4>
              <Badge variant={rule.isActive ? "default" : "secondary"}>
                {rule.isActive ? t("active") : t("inactive")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {t(config.labelKey)}: {t(config.descKey)}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <UsersIcon className="h-3 w-3" />
              <span>
                {agentNames.join(", ")}
                {remainingCount > 0 && ` +${remainingCount} more`}
              </span>
              {rule.maxChatsPerAgent && (
                <>
                  <span>•</span>
                  <span>{t("maxChats", { count: rule.maxChatsPerAgent })}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch
            checked={rule.isActive}
            onCheckedChange={onToggleActive}
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <EditIcon className="h-4 w-4 mr-2" />
                {t("editRule")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <TrashIcon className="h-4 w-4 mr-2" />
                {t("deleteRule")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export default AssignmentRulesManager;
