"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  PlusIcon, 
  MoreVerticalIcon, 
  EditIcon, 
  TrashIcon,
  BotIcon,
  MessageSquareIcon,
  ClockIcon,
  HashIcon,
  UserXIcon,
  ZapIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

type AutoReplyTrigger = "new_message" | "outside_hours" | "keyword" | "unassigned";

interface AutoReplyRule {
  id: string;
  workspaceId: string;
  name: string;
  triggerType: AutoReplyTrigger;
  triggerConfig: Record<string, unknown>;
  messageContent: string;
  templateId: string | null;
  isActive: boolean;
  cooldownMinutes: number;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

interface Template {
  id: string;
  name: string;
  language: string | null;
  status: string | null;
}

interface Props {
  workspaceId: string;
  templates?: Template[];
}

const TRIGGER_CONFIG: Record<AutoReplyTrigger, { 
  label: string; 
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  new_message: { 
    label: "New Message", 
    description: "Reply to every new incoming message",
    icon: MessageSquareIcon,
  },
  outside_hours: { 
    label: "Outside Hours", 
    description: "Reply when message arrives outside business hours",
    icon: ClockIcon,
  },
  keyword: { 
    label: "Keyword Match", 
    description: "Reply when message contains specific keywords",
    icon: HashIcon,
  },
  unassigned: { 
    label: "Unassigned", 
    description: "Reply when no agent is assigned to the chat",
    icon: UserXIcon,
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AutoReplyRulesManager(_props: Props) {
  const { toast } = useToast();
  
  // State
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formName, setFormName] = useState("");
  const [formTriggerType, setFormTriggerType] = useState<AutoReplyTrigger>("new_message");
  const [formContent, setFormContent] = useState("");
  const [formCooldown, setFormCooldown] = useState("30");
  const [formKeywords, setFormKeywords] = useState("");
  const [formBusinessHours, setFormBusinessHours] = useState({ start: "09:00", end: "18:00" });

  // ============================================================================
  // FETCH DATA
  // ============================================================================

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/meta-hub/auto-reply");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRules(data.rules || []);
    } catch (err) {
      toast({
        title: "Error loading auto-reply rules",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const openCreateDialog = () => {
    setEditingRule(null);
    setFormName("");
    setFormTriggerType("new_message");
    setFormContent("");
    setFormCooldown("30");
    setFormKeywords("");
    setFormBusinessHours({ start: "09:00", end: "18:00" });
    setDialogOpen(true);
  };

  const openEditDialog = (rule: AutoReplyRule) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormTriggerType(rule.triggerType);
    setFormContent(rule.messageContent);
    setFormCooldown(rule.cooldownMinutes.toString());
    
    // Parse trigger config
    const config = rule.triggerConfig || {};
    if (rule.triggerType === "keyword" && Array.isArray(config.keywords)) {
      setFormKeywords(config.keywords.join(", "));
    }
    if (rule.triggerType === "outside_hours" && config.schedule) {
      const schedule = config.schedule as { startHour?: number; endHour?: number };
      setFormBusinessHours({
        start: `${(schedule.startHour || 9).toString().padStart(2, "0")}:00`,
        end: `${(schedule.endHour || 18).toString().padStart(2, "0")}:00`,
      });
    }
    
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formContent.trim()) {
      toast({
        title: "Validation Error",
        description: "Reply message is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      // Build trigger config
      const triggerConfig: Record<string, unknown> = {};
      
      if (formTriggerType === "keyword" && formKeywords.trim()) {
        triggerConfig.keywords = formKeywords.split(",").map(k => k.trim()).filter(Boolean);
      }
      
      if (formTriggerType === "outside_hours") {
        triggerConfig.schedule = {
          startHour: parseInt(formBusinessHours.start.split(":")[0]),
          endHour: parseInt(formBusinessHours.end.split(":")[0]),
          days: [1, 2, 3, 4, 5], // Mon-Fri
        };
      }
      
      const payload = {
        name: formName.trim(),
        triggerType: formTriggerType,
        triggerConfig,
        messageContent: formContent.trim(),
        cooldownMinutes: parseInt(formCooldown) || 30,
        ...(editingRule ? { id: editingRule.id } : {}),
      };

      const method = editingRule ? "PATCH" : "POST";
      const res = await fetch("/api/meta-hub/auto-reply", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({
        title: editingRule ? "Rule updated" : "Rule created",
        description: `"${formName}" has been saved`,
      });

      setDialogOpen(false);
      fetchRules();
    } catch (err) {
      toast({
        title: "Error saving rule",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (rule: AutoReplyRule) => {
    try {
      const res = await fetch("/api/meta-hub/auto-reply", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rule.id, isActive: !rule.isActive }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({
        title: rule.isActive ? "Rule deactivated" : "Rule activated",
      });

      fetchRules();
    } catch (err) {
      toast({
        title: "Error updating rule",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (rule: AutoReplyRule) => {
    if (!confirm(`Delete auto-reply "${rule.name}"?`)) return;

    try {
      const res = await fetch(`/api/meta-hub/auto-reply?id=${rule.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({
        title: "Rule deleted",
        description: `"${rule.name}" has been removed`,
      });

      fetchRules();
    } catch (err) {
      toast({
        title: "Error deleting rule",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Auto-Reply Rules</CardTitle>
          <CardDescription>Loading...</CardDescription>
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
              <BotIcon className="h-5 w-5 text-blue-500" />
              Auto-Reply Rules
            </CardTitle>
            <CardDescription>
              Automatically reply to messages based on triggers
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Empty state */}
          {rules.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BotIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No auto-reply rules</p>
              <p className="text-sm">Create rules to automatically respond to messages</p>
              <Button className="mt-4" onClick={openCreateDialog}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            </div>
          )}

          {/* Rules list */}
          {rules.map(rule => (
            <AutoReplyRuleCard
              key={rule.id}
              rule={rule}
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
              {editingRule ? "Edit Auto-Reply Rule" : "Create Auto-Reply Rule"}
            </DialogTitle>
            <DialogDescription>
              Set up automatic responses for incoming messages
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                placeholder="e.g., Out of Office Reply"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Trigger Type</Label>
              <Select 
                value={formTriggerType} 
                onValueChange={(v) => setFormTriggerType(v as AutoReplyTrigger)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TRIGGER_CONFIG) as AutoReplyTrigger[]).map(trigger => {
                    const config = TRIGGER_CONFIG[trigger];
                    return (
                      <SelectItem key={trigger} value={trigger}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {TRIGGER_CONFIG[formTriggerType].description}
              </p>
            </div>

            {/* Trigger-specific config */}
            {formTriggerType === "keyword" && (
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords</Label>
                <Input
                  id="keywords"
                  placeholder="price, harga, berapa"
                  value={formKeywords}
                  onChange={(e) => setFormKeywords(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of keywords to match
                </p>
              </div>
            )}

            {formTriggerType === "outside_hours" && (
              <div className="space-y-2">
                <Label>Business Hours</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={formBusinessHours.start}
                    onChange={(e) => setFormBusinessHours(prev => ({ ...prev, start: e.target.value }))}
                    className="w-32"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={formBusinessHours.end}
                    onChange={(e) => setFormBusinessHours(prev => ({ ...prev, end: e.target.value }))}
                    className="w-32"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Auto-reply will trigger outside these hours (Mon-Fri)
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="content">Reply Message</Label>
              <Textarea
                id="content"
                placeholder="Thank you for reaching out! We'll get back to you as soon as possible."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cooldown">Cooldown (minutes)</Label>
              <Input
                id="cooldown"
                type="number"
                placeholder="30"
                value={formCooldown}
                onChange={(e) => setFormCooldown(e.target.value)}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Wait this long before sending the same auto-reply to the same contact
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingRule ? "Save Changes" : "Create Rule"}
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

function AutoReplyRuleCard({
  rule,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  rule: AutoReplyRule;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  const config = TRIGGER_CONFIG[rule.triggerType];
  const Icon = config.icon;

  return (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={cn(
            "p-2 rounded-lg",
            rule.isActive ? "bg-blue-500/10 text-blue-500" : "bg-muted text-muted-foreground"
          )}>
            <Icon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{rule.name}</h4>
              <Badge variant={rule.isActive ? "default" : "secondary"}>
                {rule.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <ZapIcon className="h-3 w-3" />
              <span>{config.label}</span>
              <span>•</span>
              <span>{rule.cooldownMinutes}m cooldown</span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {rule.messageContent}
            </p>
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
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export default AutoReplyRulesManager;
