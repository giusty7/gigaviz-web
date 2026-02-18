"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Send } from "lucide-react";
import { extractVariableCount, renderTemplateBody } from "@/lib/meta/wa-templates";
import type { WaTemplate } from "@/types/wa-templates";

type Props = {
  template: WaTemplate;
  connectionId: string;
  onClose: () => void;
};

export function SendTestTemplateModal({ template, connectionId, onClose }: Props) {
  const { toast } = useToast();
  const t = useTranslations("metaHubUI.sendTestTemplate");
  const [toPhone, setToPhone] = useState("");

  const variableCount = useMemo(() => {
    const fallback = Math.max(
      extractVariableCount(template.body ?? ""),
      extractVariableCount(template.header ?? ""),
      extractVariableCount(template.footer ?? "")
    );
    return template.variable_count && template.variable_count > 0
      ? template.variable_count
      : fallback;
  }, [template.variable_count, template.body, template.header, template.footer]);

  const [params, setParams] = useState<string[]>(Array.from({ length: variableCount }, () => ""));

  useEffect(() => {
    setParams((prev) => {
      if (prev.length === variableCount) return prev;
      return Array.from({ length: variableCount }, (_, i) => prev[i] ?? "");
    });
  }, [variableCount]);
  const [sending, setSending] = useState(false);

  const previewText = useMemo(() => {
    if (!template.body) return "";
    return renderTemplateBody(template.body, params);
  }, [template.body, params]);

  async function handleSend() {
    const rawPhone = toPhone.trim();
    const sanitizedPhone = rawPhone.replace(/\D+/g, "");

    if (!sanitizedPhone) {
      toast({ title: t("toastPhoneRequired"), variant: "destructive" });
      return;
    }

    const validation = params.slice(0, variableCount);
    const missingParams = validation.some((p) => !p.trim() && variableCount > 0);
    if (missingParams) {
      toast({ title: t("toastParamsRequired"), variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/meta/whatsapp/templates/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: template.workspace_id,
          connectionId,
          templateName: template.name,
          language: template.language,
          toPhone: sanitizedPhone,
          variables: params.slice(0, variableCount),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.reason || data?.error || "Send failed");
      }

      toast({ title: t("toastSuccess"), description: `Sent to ${sanitizedPhone}` });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: t("toastSendFailed"), description: message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title", { name: template.name })}</DialogTitle>
          <DialogDescription>
            {t("description", { language: template.language, status: template.status })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* To Phone */}
          <div>
            <Label htmlFor="toPhone">{t("recipientPhone")}</Label>
            <Input
              id="toPhone"
              value={toPhone}
              onChange={(e) => setToPhone(e.target.value)}
              placeholder={t("recipientPlaceholder")}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Enter phone number with country code. +62 allowed; digits-only will be sent.
            </p>
          </div>

          {/* Parameters */}
          {variableCount > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                {t("templateParams", { count: variableCount })}
              </Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: variableCount }, (_, idx) => (
                  <div key={idx}>
                    <Label htmlFor={`param-${idx}`} className="text-xs">
                      {`{{${idx + 1}}}`}
                    </Label>
                    <Input
                      id={`param-${idx}`}
                      value={params[idx] || ""}
                      onChange={(e) => {
                        const next = [...params];
                        next[idx] = e.target.value;
                        setParams(next);
                      }}
                      placeholder={`Value for {{${idx + 1}}}`}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <Label className="text-xs font-semibold text-muted-foreground">{t("livePreview")}</Label>
            <div className="mt-2 whitespace-pre-wrap text-sm">
              {template.header && (
                <div className="mb-2 font-semibold">{renderTemplateBody(template.header, params)}</div>
              )}
              <div>{previewText || template.body}</div>
              {template.footer && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {renderTemplateBody(template.footer, params)}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sending}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("sending")}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {t("sendTest")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
