"use client";

import { memo, useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  CheckIcon,
  SettingsIcon,
  ShieldIcon,
  WalletIcon,
  LightbulbIcon,
  InfoIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { COPY_EN } from "@/lib/copy/en";

type Props = {
  workspaceName: string;
  workspaceSlug: string;
  dailySpent: number;
  monthlySpent?: number;
  monthlyCap: number;
  isOverBudget?: boolean;
  allowAutomation: boolean;
  onAutomationChange: (value: boolean) => void;
  onQuickPrompt: (prompt: string) => void;
};

function WorkspaceControlsComponent({
  workspaceName,
  workspaceSlug,
  dailySpent,
  monthlySpent = 0,
  monthlyCap,
  isOverBudget = false,
  allowAutomation,
  onAutomationChange,
  onQuickPrompt,
}: Props) {
  const copy = COPY_EN.helper;
  const [budgetDialog, setBudgetDialog] = useState(false);
  const [automationDialog, setAutomationDialog] = useState(false);

  const handleAutomationToggle = (checked: boolean) => {
    if (checked && !allowAutomation) {
      setAutomationDialog(true);
    } else {
      onAutomationChange(checked);
    }
  };

  const confirmAutomation = () => {
    onAutomationChange(true);
    setAutomationDialog(false);
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Workspace info */}
        <Card className="bg-gigaviz-surface/50 border-gigaviz-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-gigaviz-gold" />
              {copy.workspaceControls}
            </CardTitle>
            <CardDescription className="text-xs">
              {workspaceName}
              <span className="text-muted-foreground/60 ml-1">({workspaceSlug})</span>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Budget */}
        <Card className="bg-gigaviz-surface/50 border-gigaviz-border/60">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <WalletIcon className="h-4 w-4 text-gigaviz-gold" />
                <span className="text-sm font-medium">{copy.todaysBudget}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setBudgetDialog(true)}
              >
                {copy.manage}
              </Button>
            </div>
            <div className="pl-6">
              <p className="text-2xl font-semibold tabular-nums">
                {dailySpent.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {copy.tokens}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {copy.monthlyUsage}: {monthlySpent.toLocaleString()}
                {monthlyCap > 0 && ` / ${monthlyCap.toLocaleString()}`}
              </p>
              {isOverBudget && (
                <p className="text-xs text-destructive font-medium mt-1">
                  {copy.budgetExceeded ?? "Budget exceeded"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Automation toggle */}
        <Card className="bg-gigaviz-surface/50 border-gigaviz-border/60">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldIcon className="h-4 w-4 text-gigaviz-gold" />
                  <span className="text-sm font-medium">{copy.allowAutomation}</span>
                </div>
                <p className="text-xs text-muted-foreground pl-6">{copy.automationDesc}</p>
              </div>
              <Switch
                checked={allowAutomation}
                onCheckedChange={handleAutomationToggle}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Quick prompts */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <LightbulbIcon className="h-4 w-4 text-gigaviz-gold" />
            <span className="text-sm font-medium">{copy.quickPromptsTitle}</span>
          </div>
          <div className="space-y-1.5">
            {copy.quickPrompts.map((prompt) => (
              <Button
                key={prompt}
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 h-9 text-xs"
                onClick={() => onQuickPrompt(prompt)}
              >
                <CheckIcon className="h-3.5 w-3.5 text-gigaviz-gold flex-none" />
                <span className="truncate">{prompt}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Tips */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <InfoIcon className="h-4 w-4 text-gigaviz-gold" />
            <span className="text-sm font-medium">{copy.tipsTitle}</span>
          </div>
          <Card className="bg-gigaviz-surface/30 border-gigaviz-border/40">
            <CardContent className="p-3">
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
                {copy.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Footer link */}
        <div className="pt-2">
          <Link
            href={`/${workspaceSlug}/modules`}
            className="flex items-center gap-2 text-sm text-gigaviz-gold hover:text-gigaviz-gold/80 transition-colors"
          >
            {copy.viewAllHubs}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Budget Dialog */}
      <Dialog open={budgetDialog} onOpenChange={setBudgetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.manageBudgetTitle}</DialogTitle>
            <DialogDescription>{copy.manageBudgetDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setBudgetDialog(false)}>{copy.confirm}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Automation Confirm Dialog */}
      <Dialog open={automationDialog} onOpenChange={setAutomationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.automationConfirmTitle}</DialogTitle>
            <DialogDescription>{copy.automationConfirmDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAutomationDialog(false)}>
              {copy.cancel}
            </Button>
            <Button onClick={confirmAutomation}>{copy.confirm}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
}

export const WorkspaceControls = memo(WorkspaceControlsComponent);
