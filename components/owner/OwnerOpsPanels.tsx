"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Settings2, ShieldOff, Wallet } from "lucide-react";
import {
  deductWorkspaceTokensAction,
  grantWorkspaceTokensAction,
  setWorkspaceEntitlementAction,
} from "@/app/ops/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import type { WorkspaceEntitlementRow } from "@/lib/owner/ops";
import {
  HUB_ENTITLEMENT_KEYS,
  CAPABILITY_ENTITLEMENT_KEYS,
} from "@/lib/ops/entitlements-config";

export function OwnerEntitlementsPanel({
  workspaceId,
  entitlements,
  readOnly = false,
}: {
  workspaceId: string;
  entitlements: WorkspaceEntitlementRow[];
  readOnly?: boolean;
}) {
  const t = useTranslations("opsUI");
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [payloadOpen, setPayloadOpen] = useState(false);
  const [payloadKey, setPayloadKey] = useState<string | null>(null);
  const [payloadValue, setPayloadValue] = useState("");
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableReason, setDisableReason] = useState("");
  const [disableKey, setDisableKey] = useState<string | null>(null);

  const entitlementMap = useMemo(() => {
    return new Map(entitlements.map((row) => [row.key, row]));
  }, [entitlements]);

  const submitEntitlement = (input: {
    key: string;
    enabled: boolean;
    payload?: unknown;
    reason?: string;
  }) => {
    if (readOnly) return;
    if (!workspaceId) {
      toast({
        title: "Missing workspace",
        description: "Workspace ID is required.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.set("workspaceId", workspaceId);
    formData.set("key", input.key);
    formData.set("enabled", input.enabled ? "true" : "false");
    // Always send payload as stringified JSON (default to {} if undefined)
    formData.set("payload", JSON.stringify(input.payload ?? {}));
    // Only set reason if non-empty
    const reasonClean = input.reason?.trim();
    if (reasonClean) {
      formData.set("reason", reasonClean);
    }

    startTransition(async () => {
      const result = await setWorkspaceEntitlementAction(formData);
      if (result.ok) {
        toast({ title: t("owner.panels.grantSuccess") });
        setPayloadOpen(false);
        setDisableOpen(false);
        setDisableReason("");
      } else {
        toast({
          title: t("owner.panels.grantFailed"),
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  const openPayloadEditor = (key: string) => {
    if (readOnly) return;
    const row = entitlementMap.get(key);
    setPayloadKey(key);
    setPayloadValue(JSON.stringify(row?.payload ?? {}, null, 2));
    setPayloadOpen(true);
  };

  const openDisableDialog = (key: string) => {
    if (readOnly) return;
    setDisableKey(key);
    setDisableReason("");
    setDisableOpen(true);
  };

  const renderEntitlementRow = (entry: { key: string; label: string }) => {
    const row = entitlementMap.get(entry.key);
    const enabled = row?.enabled ?? false;
    const payload = row?.payload ?? {};
    return (
      <div
        key={entry.key}
        className="rounded-lg border border-border bg-background/60 p-3 shadow-sm"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground">{entry.label}</p>
              <Badge variant={enabled ? "outline" : "secondary"} className="capitalize">
                {enabled ? "enabled" : "disabled"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{entry.key}</p>
          </div>
          {readOnly ? (
            <div className="text-xs text-muted-foreground">
              Managed in Sovereign Command
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {enabled ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openDisableDialog(entry.key)}
                  disabled={pending}
                >
                  <ShieldOff className="h-4 w-4" />
                  Disable
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    submitEntitlement({
                      key: entry.key,
                      enabled: true,
                      payload,
                    })
                  }
                  disabled={pending}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Enable
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openPayloadEditor(entry.key)}
                disabled={pending}
              >
                <Settings2 className="h-4 w-4" />
                Payload
              </Button>
            </div>
          )}
        </div>
        <div className="mt-2 rounded-md bg-muted/50 p-2 text-xs text-foreground">
          <pre className="whitespace-pre-wrap break-words">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Hubs Section */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Hubs (8 Products)
        </h4>
        <div className="space-y-3">
          {HUB_ENTITLEMENT_KEYS.map(renderEntitlementRow)}
        </div>
      </div>

      {/* Capabilities Section */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Capabilities
        </h4>
        <div className="space-y-3">
          {CAPABILITY_ENTITLEMENT_KEYS.map(renderEntitlementRow)}
        </div>
      </div>

      {!readOnly ? (
      <Dialog open={payloadOpen} onOpenChange={setPayloadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("owner.panels.jsonEditor")}</DialogTitle>
            <DialogDescription>
              Update JSON payload for {payloadKey}. This does not toggle enablement.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={payloadValue}
            onChange={(event) => setPayloadValue(event.target.value)}
            rows={7}
            placeholder='{"tier":"beta"}'
          />
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              disabled={pending || !payloadKey}
              onClick={() => {
                if (!payloadKey) return;
                let parsedPayload: unknown = {};
                try {
                  parsedPayload = payloadValue ? JSON.parse(payloadValue) : {};
                } catch {
                  toast({
                    title: "Invalid JSON",
                    description: "Fix the JSON before saving.",
                    variant: "destructive",
                  });
                  return;
                }
                const row = entitlementMap.get(payloadKey);
                submitEntitlement({
                  key: payloadKey,
                  enabled: row?.enabled ?? false,
                  payload: parsedPayload,
                });
              }}
            >
              {t("owner.panels.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      ) : null}

      {!readOnly ? (
      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("owner.panels.revokeEntitlement")}</DialogTitle>
            <DialogDescription>
              Disabling immediately blocks the feature for this workspace.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={disableReason}
            onChange={(event) => setDisableReason(event.target.value)}
            rows={4}
            placeholder="Reason for disabling"
          />
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={pending || !disableKey}
              onClick={() => {
                if (!disableKey) return;
                const row = entitlementMap.get(disableKey);
                submitEntitlement({
                  key: disableKey,
                  enabled: false,
                  payload: row?.payload ?? {},
                  reason: disableReason,
                });
              }}
            >
              {t("owner.panels.revokeEntitlement")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      ) : null}
    </div>
  );
}

export function OwnerTokensPanel({
  workspaceId,
  balance,
}: {
  workspaceId: string;
  balance: number | null;
}) {
  const t = useTranslations("opsUI");
  const { toast } = useToast();
  const [grantOpen, setGrantOpen] = useState(false);
  const [deductOpen, setDeductOpen] = useState(false);
  const [tokenPending, startTokenTransition] = useTransition();

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [refId, setRefId] = useState("");

  const resetForm = () => {
    setAmount("");
    setReason("");
    setRefId("");
  };

  const submitTokens = (action: "grant" | "deduct") => {
    if (!workspaceId) {
      toast({
        title: "Missing workspace",
        description: "Workspace ID is required.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.set("workspaceId", workspaceId);
    formData.set("amount", amount);
    formData.set("reason", reason);
    // Only set ref_id if non-empty (prevents sending null to server)
    const refIdClean = refId.trim();
    if (refIdClean) {
      formData.set("ref_id", refIdClean);
    }

    startTokenTransition(async () => {
      const result =
        action === "grant"
          ? await grantWorkspaceTokensAction(formData)
          : await deductWorkspaceTokensAction(formData);

      if (result.ok) {
        toast({
          title: action === "grant" ? t("owner.panels.tokensGranted") : t("owner.panels.tokensDeducted"),
        });
        setGrantOpen(false);
        setDeductOpen(false);
        resetForm();
      } else {
        toast({
          title: t("owner.panels.tokenFailed"),
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("owner.panels.tokenBalance")}
            </p>
            <p className="text-2xl font-semibold text-foreground">
              {balance === null ? "N/A" : balance.toLocaleString()}
            </p>
          </div>
          <Wallet className="h-5 w-5 text-ring" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => setGrantOpen(true)}>
          {t("owner.panels.grantTokens")}
        </Button>
        <Button size="sm" variant="destructive" onClick={() => setDeductOpen(true)}>
          {t("owner.panels.deductTokens")}
        </Button>
      </div>

      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("owner.panels.grantTokens")}</DialogTitle>
            <DialogDescription>Add credits to the workspace wallet.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="number"
              min={1}
              max={1000000}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Amount"
            />
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Reason (required)"
              rows={3}
            />
            <Input
              value={refId}
              onChange={(event) => setRefId(event.target.value)}
              placeholder="Reference ID (optional)"
            />
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              disabled={tokenPending}
              onClick={() => submitTokens("grant")}
            >
              Confirm grant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deductOpen} onOpenChange={setDeductOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("owner.panels.deductTokens")}</DialogTitle>
            <DialogDescription>This will reduce the workspace balance.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="number"
              min={1}
              max={1000000}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Amount"
            />
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Reason (required)"
              rows={3}
            />
            <Input
              value={refId}
              onChange={(event) => setRefId(event.target.value)}
              placeholder="Reference ID (optional)"
            />
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={tokenPending}
              onClick={() => submitTokens("deduct")}
            >
              Confirm deduction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
