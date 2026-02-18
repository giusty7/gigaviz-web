"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, ChevronUp, X, Sparkles, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export type OnboardingStep = {
  id: string;
  label: string;
  helper: string;
  done: boolean;
  href: string;
};

type Props = {
  workspaceId: string;
  workspaceSlug: string;
  userId: string;
  steps: OnboardingStep[];
  progress: number;
  nextStep: OnboardingStep | null;
};

const DISMISS_KEY_PREFIX = "gv:onboarding-dismissed";

function getDismissKey(workspaceId: string, userId: string) {
  return `${DISMISS_KEY_PREFIX}:${workspaceId}:${userId}`;
}

export function GetStartedPanel({
  workspaceId,
  workspaceSlug: _workspaceSlug,
  userId,
  steps,
  progress,
  nextStep,
}: Props) {
  // Compute initial state synchronously to avoid React effect setState warning
  const getInitialDismissed = () => {
    if (typeof window === "undefined") return true;
    const key = getDismissKey(workspaceId, userId);
    return window.localStorage.getItem(key) === "1";
  };
  const [dismissed, setDismissed] = useState(getInitialDismissed);
  const [expanded, setExpanded] = useState(true);
  const t = useTranslations("onboardingUI.getStarted");

  // Keep workspaceSlug reference to avoid lint warning (future navigation use)
  void _workspaceSlug;

  const handleDismiss = useCallback(() => {
    if (typeof window === "undefined") return;
    const key = getDismissKey(workspaceId, userId);
    window.localStorage.setItem(key, "1");
    setDismissed(true);
  }, [workspaceId, userId]);

  // If all steps done, show completed state briefly then allow dismiss
  const allDone = progress === 100;

  if (dismissed && !allDone) {
    return null;
  }

  return (
    <Card className="relative overflow-hidden border-gigaviz-gold/30 bg-gradient-to-br from-[#0b1221] via-[#0f1c2c] to-[#111827]">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,215,128,0.08),transparent_50%)]" />

      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-gigaviz-gold/20 p-1.5 text-gigaviz-gold">
              <Sparkles size={18} />
            </span>
            <CardTitle className="text-lg font-semibold text-foreground">{t("title")}</CardTitle>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                allDone
                  ? "border-emerald-400/50 text-emerald-300"
                  : "border-gigaviz-gold/50 text-gigaviz-gold"
              )}
            >
              {progress}%
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={handleDismiss}
              aria-label="Dismiss"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gigaviz-surface">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gigaviz-gold to-amber-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="relative space-y-4 pt-2">
          {/* Steps list */}
          <div className="grid gap-2">
            {steps.map((step, idx) => (
              <Link
                key={step.id}
                href={step.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition",
                  step.done
                    ? "border-emerald-400/30 bg-emerald-400/5"
                    : "border-border bg-gigaviz-surface/50 hover:border-gigaviz-gold/50"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    step.done
                      ? "bg-emerald-400/20 text-emerald-300"
                      : "bg-gigaviz-gold/20 text-gigaviz-gold"
                  )}
                >
                  {step.done ? <Check size={14} /> : idx + 1}
                </span>
                <div className="flex-1">
                  <p
                    className={cn(
                      "font-semibold",
                      step.done ? "text-emerald-200" : "text-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.helper}</p>
                </div>
                {!step.done && (
                  <ArrowRight className="h-4 w-4 text-gigaviz-gold opacity-0 transition group-hover:opacity-100" />
                )}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {nextStep ? (
              <Link href={nextStep.href}>
                <Button size="sm" className="bg-gigaviz-gold text-gigaviz-navy hover:bg-gigaviz-gold/90">
                  {t("continueLabel", { label: nextStep.label })}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-400/20 text-emerald-200 border-emerald-400/40">
                  {t("allSet")}
                </Badge>
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  {t("dismiss")}
                </Button>
              </div>
            )}
            <Link
              href="/docs/get-started"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-gigaviz-gold"
            >
              <BookOpen size={14} />
              {t("learnMore")}
            </Link>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
