"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logging";

interface Props {
  itemId: string;
  itemTitle: string;
}

export function MarketplaceModerationActions({ itemId, itemTitle }: Props) {
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  async function moderate(action: "approve" | "reject") {
    setLoading(true);
    try {
      const res = await fetch("/api/ops/marketplace/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          action,
          reason: action === "reject" ? rejectReason : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to ${action} item`);
      }

      toast({
        title: action === "approve" ? "Item Approved" : "Item Rejected",
        description: `"${itemTitle}" has been ${action === "approve" ? "approved and published" : "rejected"}.`,
      });

      router.refresh();
    } catch (err) {
      logger.error("Moderation action failed", { err, itemId, action });
      toast({
        title: "Action Failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Approve Button */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            disabled={loading}
            className={cn(
              "inline-flex h-8 items-center gap-1 rounded-md px-3 text-xs font-medium transition-colors",
              "bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-700/30",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCircle className="h-3 w-3" />
            )}
            Approve
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve &quot;{itemTitle}&quot;? This will
              make the item visible and purchasable in the marketplace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => moderate("approve")}>
              Approve &amp; Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Button */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            disabled={loading}
            className={cn(
              "inline-flex h-8 items-center gap-1 rounded-md px-3 text-xs font-medium transition-colors",
              "bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-700/30",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            Reject
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Item</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason for rejecting &quot;{itemTitle}&quot;. The creator
              will see this feedback.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-4">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (e.g., inappropriate content, incomplete submission...)"
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => moderate("reject")}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
