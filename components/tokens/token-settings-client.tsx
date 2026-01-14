"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import type { TokenSettings } from "@/lib/tokens";

type Props = {
  workspaceId: string;
  canEdit: boolean;
};

type OverviewResponse = {
  settings: TokenSettings;
  error?: string;
};

export function TokenSettingsClient({ workspaceId, canEdit }: Props) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<TokenSettings | null>(null);
  const [capInput, setCapInput] = useState("");
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [hardCap, setHardCap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tokens/overview?workspaceId=${workspaceId}`, { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as OverviewResponse | null;
      if (!res.ok || !json?.settings) throw new Error(json?.error || "Failed to load settings");
      const s = json.settings;
      setSettings(s);
      setCapInput(s.monthly_cap !== null && s.monthly_cap !== undefined ? String(s.monthly_cap) : "");
      setAlertThreshold(Number(s.alert_threshold ?? 80));
      setHardCap(Boolean(s.hard_cap));
    } catch (err) {
      toast({
        title: "Unable to load settings",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  async function save() {
    if (!canEdit) return;
    const trimmed = capInput.trim();
    let monthlyCap: number | null = null;
    if (trimmed !== "") {
      const parsed = Number(trimmed);
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 1_000_000_000) {
        toast({
          title: "Invalid cap",
          description: "Enter 0..1,000,000,000 or leave blank for Unlimited.",
          variant: "destructive",
        });
        return;
      }
      monthlyCap = parsed;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/tokens/cap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          monthlyCap,
          alertThreshold,
          hardCap,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Save failed");
      toast({ title: "Settings saved" });
      await load();
    } catch (err) {
      toast({
        title: "Unable to save",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-border/80 bg-card/90">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Settings</p>
            <h3 className="text-lg font-semibold text-foreground">Usage guardrails</h3>
            <p className="text-sm text-muted-foreground">Monthly cap and alerts apply per workspace. Owner/Admin only.</p>
            {settings?.updated_at ? (
              <p className="text-[11px] text-muted-foreground">
                Updated {new Date(settings.updated_at).toLocaleString()}
              </p>
            ) : null}
          </div>
          <Badge variant="outline" className="border-border/70 text-muted-foreground">
            {canEdit ? "Owner/Admin" : "View only"}
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-xs text-muted-foreground">
            Monthly cap (tokens)
            <Input
              type="number"
              min={0}
              max={1_000_000_000}
              value={capInput}
              onChange={(e) => setCapInput(e.target.value)}
              placeholder="Unlimited"
              disabled={!canEdit}
              className="mt-1"
            />
            <span className="text-[11px] text-muted-foreground">Leave blank for Unlimited</span>
          </label>

          <label className="text-xs text-muted-foreground">
            Alert threshold (%)
            <Input
              type="range"
              min={50}
              max={100}
              step={1}
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(Number(e.target.value))}
              disabled={!canEdit}
              className="mt-2"
            />
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{alertThreshold}%</span>
              <span className="text-[11px]">Alert when usage crosses this percentage.</span>
            </div>
          </label>

          <label className="text-xs text-muted-foreground">
            Enforce hard cap
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => canEdit && setHardCap((v) => !v)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                  hardCap
                    ? "border-gigaviz-gold/60 bg-gigaviz-gold/15 text-foreground"
                    : "border-border/70 bg-card text-muted-foreground"
                } ${canEdit ? "" : "opacity-60"}`}
              >
                {hardCap ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                {hardCap ? "On" : "Off"}
              </button>
              <span className="text-[11px] text-muted-foreground">
                If on, spends are rejected after cap is reached.
              </span>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Who can change settings: Owners & Admins.
          </div>
          <Button onClick={save} disabled={!canEdit || saving || loading}>
            {saving ? "Saving..." : "Save settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
