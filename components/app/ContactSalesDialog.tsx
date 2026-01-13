"use client";

import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import type { PlanMeta } from "@/lib/entitlements";

export type ContactSalesDialogProps = {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  userEmail: string;
  planOptions: PlanMeta[];
  defaultPlanId?: string | null;
  children?: (openDialog: (planId?: string | null) => void) => ReactNode;
};

export default function ContactSalesDialog(props: ContactSalesDialogProps) {
  const { workspaceId, workspaceName, workspaceSlug, userEmail, planOptions, defaultPlanId, children } = props;
  const { toast } = useToast();
  const paidPlans = useMemo(() => planOptions.filter((plan) => plan.plan_id !== "free_locked"), [planOptions]);
  const currentPlan = useMemo(
    () => planOptions.find((plan) => plan.plan_id === defaultPlanId) ?? null,
    [defaultPlanId, planOptions]
  );
  const initialPlanId = useMemo(
    () => paidPlans[0]?.plan_id ?? planOptions.find((p) => p.plan_id !== "free_locked")?.plan_id ?? planOptions[0]?.plan_id ?? "",
    [paidPlans, planOptions]
  );
  const [open, setOpen] = useState(false);
  const [planId, setPlanId] = useState<string>(initialPlanId);
  const [seats, setSeats] = useState<string>("1");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedPlanName = useMemo(
    () => paidPlans.find((plan) => plan.plan_id === planId)?.name ?? planId,
    [planId, paidPlans]
  );

  const openDialog = useCallback(
    (nextPlanId?: string | null) => {
      const targetPlan = nextPlanId && paidPlans.find((plan) => plan.plan_id === nextPlanId);
      if (targetPlan) {
        setPlanId(targetPlan.plan_id);
      } else if (!planId && paidPlans[0]) {
        setPlanId(paidPlans[0].plan_id);
      }
      setOpen(true);
    },
    [paidPlans, planId]
  );

  const waNumber = process.env.NEXT_PUBLIC_SALES_WA?.trim() || "";
  const waUrl = useMemo(() => {
    if (!waNumber) return null;
    const timestamp = new Date().toISOString();
    const message = [
      "Hi Gigaviz Sales, I'd like to upgrade.",
      `Workspace: ${workspaceName} (${workspaceSlug})`,
      `User: ${userEmail}`,
      `Plan: ${selectedPlanName}`,
      `Seats: ${seats || "1"}`,
      `Time: ${timestamp}`,
    ].join("\n");

    return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
  }, [seats, selectedPlanName, userEmail, waNumber, workspaceName, workspaceSlug]);

  const handleSubmit = useCallback(async () => {
    const seatsNumber = Number(seats);
    if (!Number.isFinite(seatsNumber) || seatsNumber < 1) {
      toast({ title: "Invalid seats", description: "Seats must be a positive number." });
      return;
    }

    if (!planId) {
      toast({ title: "Plan required", description: "Select a plan before submitting." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/billing-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          planId,
          seats: seatsNumber,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const error = payload?.reason || payload?.error || "request_failed";
        toast({ title: "Request failed", description: String(error) });
        return;
      }

      toast({
        title: "Request sent",
        description: "Our team will reach out to confirm your upgrade.",
      });
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }, [notes, planId, seats, toast, workspaceId]);

  return (
    <>
      {typeof children === "function" ? children(openDialog) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade via Contact Sales</DialogTitle>
            <DialogDescription>
              Tell us the plan and seats you need. Use WhatsApp for a faster response or submit the request here.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan">Plan</Label>
              {currentPlan ? (
                <div className="text-xs text-muted-foreground">Current plan: {currentPlan.name}</div>
              ) : null}
              <select
                id="plan"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gigaviz-gold"
              >
                {paidPlans.map((plan) => (
                  <option key={plan.plan_id} value={plan.plan_id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seats">Seats</Label>
              <Input
                id="seats"
                type="number"
                min={1}
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                inputMode="numeric"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Share requirements, timelines, or compliance needs."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Workspace {workspaceName} · {workspaceSlug} · {userEmail}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button asChild variant="secondary" disabled={!waUrl}>
              <a href={waUrl ?? "#"} target="_blank" rel="noreferrer">
                Contact via WhatsApp
              </a>
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
