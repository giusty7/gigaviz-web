"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("tokensUI.settings");
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
        title: t("unableToLoadSettings"),
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
          title: t("invalidCap"),
          description: t("invalidCapDesc"),
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
      toast({ title: t("settingsSaved") });
      await load();
    } catch (err) {
      toast({
        title: t("unableToSave"),
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
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{t("sectionLabel")}</p>
            <h3 className="text-lg font-semibold text-foreground">{t("title")}</h3>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
            {settings?.updated_at ? (
              <p className="text-[11px] text-muted-foreground">
                Updated {new Date(settings.updated_at).toLocaleString()}
              </p>
            ) : null}
          </div>
          <Badge variant="outline" className="border-border/70 text-muted-foreground">
            {canEdit ? t("ownerAdmin") : t("viewOnly")}
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-xs text-muted-foreground">
            {t("monthlyCap")}
            <Input
              type="number"
              min={0}
              max={1_000_000_000}
              value={capInput}
              onChange={(e) => setCapInput(e.target.value)}
              placeholder={t("unlimited")}
              disabled={!canEdit}
              className="mt-1"
            />
            <span className="text-[11px] text-muted-foreground">{t("monthlyCapHelp")}</span>
          </label>

          <label className="text-xs text-muted-foreground">
            {t("alertThreshold")}
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
              <span className="text-[11px]">{t("alertThresholdHelp")}</span>
            </div>
          </label>

          <label className="text-xs text-muted-foreground">
            {t("enforceHardCap")}
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
                {hardCap ? t("on") : t("off")}
              </button>
              <span className="text-[11px] text-muted-foreground">
                {t("hardCapHelp")}
              </span>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {t("whoCanChange")}
          </div>
          <Button onClick={save} disabled={!canEdit || saving || loading}>
            {saving ? t("saving") : t("saveSettings")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
