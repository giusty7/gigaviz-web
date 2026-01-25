"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save } from "lucide-react";
import type { WaTemplate, WaTemplateParamDef } from "@/types/wa-templates";

type Props = {
  template: WaTemplate;
  existingDefs?: WaTemplateParamDef[];
  onClose: () => void;
  onSaved?: () => void;
};

type ParamDefInput = {
  paramIndex: number;
  sourceType: "manual" | "contact_field" | "expression";
  sourceValue: string;
  defaultValue: string;
};

export function ParamMappingEditorModal({ template, existingDefs, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [mappings, setMappings] = useState<ParamDefInput[]>([]);

  useEffect(() => {
    // Initialize from existing defs or create empty ones
    const initial: ParamDefInput[] = [];
    for (let i = 1; i <= template.variable_count; i++) {
      const existing = existingDefs?.find((d) => d.param_index === i);
      initial.push({
        paramIndex: i,
        sourceType: existing?.source_type ?? "manual",
        sourceValue: existing?.source_value ?? "",
        defaultValue: existing?.default_value ?? "",
      });
    }
    setMappings(initial);
  }, [template.variable_count, existingDefs]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/meta/whatsapp/template-param-defs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: template.workspace_id,
          templateId: template.id,
          mappings,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.reason || data?.error || "Save failed");
      }

      toast({ title: "✅ Parameter mappings saved!" });
      onSaved?.();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Save failed", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function updateMapping(index: number, updates: Partial<ParamDefInput>) {
    setMappings((prev) => {
      const next = [...prev];
      const idx = next.findIndex((m) => m.paramIndex === index);
      if (idx !== -1) {
        next[idx] = { ...next[idx], ...updates };
      }
      return next;
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Parameter Mapping: {template.name}</DialogTitle>
          <DialogDescription>
            Define how parameters {"{1}"}, {"{2}"}, ... are populated for batch sends
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {mappings.length === 0 && (
            <p className="text-sm text-muted-foreground">This template has no parameters.</p>
          )}

          {mappings.map((mapping) => (
            <Card key={mapping.paramIndex} className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Parameter {"{"}
                  {mapping.paramIndex}
                  {"}"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Source Type */}
                <div>
                  <Label className="text-xs">Source Type</Label>
                  <select
                    value={mapping.sourceType}
                    onChange={(e) =>
                      updateMapping(mapping.paramIndex, {
                        sourceType: e.target.value as "manual" | "contact_field" | "expression",
                      })
                    }
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="manual">Manual (Global Value)</option>
                    <option value="contact_field">Contact Field</option>
                    <option value="expression">Expression</option>
                  </select>
                </div>

                {/* Source Value */}
                {mapping.sourceType === "contact_field" && (
                  <div>
                    <Label className="text-xs">Field Name</Label>
                    <Input
                      value={mapping.sourceValue}
                      onChange={(e) =>
                        updateMapping(mapping.paramIndex, { sourceValue: e.target.value })
                      }
                      placeholder="e.g., name, phone, email, custom_field"
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Standard: name, phone, email, wa_id. Or custom field from contact.data
                    </p>
                  </div>
                )}

                {mapping.sourceType === "expression" && (
                  <div>
                    <Label className="text-xs">Expression Template</Label>
                    <Textarea
                      value={mapping.sourceValue}
                      onChange={(e) =>
                        updateMapping(mapping.paramIndex, { sourceValue: e.target.value })
                      }
                      placeholder="e.g., Hi {{contact.name}}, promo {{global.promo}}"
                      className="mt-1"
                      rows={3}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Use double braces for contact fields or global values
                    </p>
                  </div>
                )}

                {mapping.sourceType === "manual" && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Value will be taken from global values when creating the job
                    </p>
                  </div>
                )}

                {/* Default Value */}
                <div>
                  <Label className="text-xs">Default Value (Optional)</Label>
                  <Input
                    value={mapping.defaultValue}
                    onChange={(e) =>
                      updateMapping(mapping.paramIndex, { defaultValue: e.target.value })
                    }
                    placeholder="Fallback if source is empty"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Mappings
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
