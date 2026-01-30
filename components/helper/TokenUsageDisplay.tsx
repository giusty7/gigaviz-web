"use client";

import { memo } from "react";
import { Coins, TrendingUp, AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Props = {
  dailySpent: number;
  monthlySpent: number;
  monthlyCap: number;
  isOverBudget: boolean;
};

function TokenUsageDisplayComponent({ dailySpent, monthlySpent, monthlyCap, isOverBudget }: Props) {
  const hasActiveCap = monthlyCap > 0;
  const percentUsed = hasActiveCap ? Math.min(100, (monthlySpent / monthlyCap) * 100) : 0;
  const isWarning = percentUsed >= 80 && percentUsed < 100;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 rounded-lg border border-gigaviz-border/60 bg-gigaviz-surface/50 px-3 py-1.5 text-xs">
            {isOverBudget ? (
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            ) : (
              <Coins className="h-3.5 w-3.5 text-gigaviz-gold" />
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Today:</span>
              <span className="font-mono font-semibold text-foreground">
                {dailySpent.toLocaleString()}
              </span>
            </div>
            <div className="h-3 w-px bg-gigaviz-border/60" />
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Month:</span>
              <span
                className={cn(
                  "font-mono font-semibold",
                  isOverBudget
                    ? "text-destructive"
                    : isWarning
                      ? "text-yellow-500"
                      : "text-foreground"
                )}
              >
                {monthlySpent.toLocaleString()}
              </span>
              {hasActiveCap && (
                <span className="text-muted-foreground">
                  / {monthlyCap.toLocaleString()}
                </span>
              )}
            </div>
            {hasActiveCap && (
              <TrendingUp
                className={cn(
                  "h-3 w-3",
                  isOverBudget
                    ? "text-destructive"
                    : isWarning
                      ? "text-yellow-500"
                      : "text-gigaviz-gold"
                )}
              />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Daily usage:</span>
              <span className="font-mono font-semibold">{dailySpent.toLocaleString()} tokens</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Monthly usage:</span>
              <span className="font-mono font-semibold">{monthlySpent.toLocaleString()} tokens</span>
            </div>
            {hasActiveCap && (
              <>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Monthly cap:</span>
                  <span className="font-mono font-semibold">{monthlyCap.toLocaleString()} tokens</span>
                </div>
                <div className="pt-1 border-t border-border">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Budget used:</span>
                    <span
                      className={cn(
                        "font-mono font-semibold",
                        isOverBudget
                          ? "text-destructive"
                          : isWarning
                            ? "text-yellow-500"
                            : "text-foreground"
                      )}
                    >
                      {percentUsed.toFixed(1)}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                    <div
                      className={cn(
                        "h-full transition-all duration-500",
                        isOverBudget
                          ? "bg-destructive"
                          : isWarning
                            ? "bg-yellow-500"
                            : "bg-gigaviz-gold"
                      )}
                      style={{ width: `${Math.min(100, percentUsed)}%` }}
                    />
                  </div>
                </div>
              </>
            )}
            {isOverBudget && (
              <div className="pt-1 border-t border-destructive/20 text-destructive">
                ⚠️ Monthly budget exceeded. Further requests may be blocked.
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const TokenUsageDisplay = memo(TokenUsageDisplayComponent);
