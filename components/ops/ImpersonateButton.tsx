"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { EyeIcon, Loader2 } from "lucide-react";

interface ImpersonateButtonProps {
  workspaceId: string;
  ownerId: string | null;
  ownerEmail: string | null;
}

export function ImpersonateButton({ workspaceId, ownerId, ownerEmail }: ImpersonateButtonProps) {
  const t = useTranslations("opsUI");
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ impersonationId: string; expiresAt: string } | null>(null);

  if (!ownerId) {
    return (
      <Button variant="outline" size="sm" disabled title="No owner to impersonate">
        <EyeIcon className="mr-2 h-4 w-4" />
        {t("impersonate.startSession")}
      </Button>
    );
  }

  async function handleStart() {
    if (reason.length < 10) {
      setError("Reason must be at least 10 characters");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ops/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: ownerId,
          workspaceId,
          reason,
          durationMinutes: duration,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start impersonation");
        return;
      }
      setResult({ impersonationId: data.impersonationId, expiresAt: data.expiresAt });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnd() {
    if (!result) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ops/impersonate", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ impersonationId: result.impersonationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to end impersonation");
        return;
      }
      setResult(null);
      setReason("");
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 space-y-2">
        <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium">
          <EyeIcon className="h-4 w-4" />
          {t("impersonate.sessionActive")}
        </div>
        <p className="text-xs text-muted-foreground">
          Impersonating {ownerEmail ?? ownerId} · Expires{" "}
          {new Date(result.expiresAt).toLocaleString()}
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleEnd}
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
          {t("impersonate.endSession")}
        </Button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <EyeIcon className="mr-2 h-4 w-4" />
        {t("impersonate.startSession")}
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <EyeIcon className="h-4 w-4" />
          {t("impersonate.title")}
        </h4>
        <button
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => { setIsOpen(false); setError(null); }}
        >
          Cancel
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Impersonate <span className="font-medium text-foreground">{ownerEmail ?? ownerId}</span> in this workspace.
        All actions are logged to the audit trail.
      </p>
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Reason (required, min 10 chars)</label>
        <textarea
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          rows={2}
          placeholder="e.g., Customer reported bug in template management, investigating..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-3">
        <label className="text-xs text-muted-foreground">{t("impersonate.duration")}</label>
        <select
          className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        >
          <option value={15}>15 min</option>
          <option value={30}>30 min</option>
          <option value={60}>1 hour</option>
          <option value={120}>2 hours</option>
          <option value={240}>4 hours</option>
          <option value={480}>8 hours</option>
        </select>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <Button
        variant="default"
        size="sm"
        onClick={handleStart}
        disabled={loading || reason.length < 10}
      >
        {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
        {t("impersonate.startSession")}
      </Button>
    </div>
  );
}
