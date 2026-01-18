"use client";

import { useState, useTransition } from "react";
import {
  addOwnerNoteAction,
  suspendWorkspaceAction,
  toggleFeatureFlagAction,
  unsuspendWorkspaceAction,
  upsertFeatureFlagAction,
} from "@/app/owner/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

export type OwnerFeatureFlag = {
  id: string;
  flag_key: string;
  enabled: boolean;
  value: unknown;
  updated_at?: string | null;
  updated_email?: string | null;
};

export function WorkspaceNotesPanel({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await addOwnerNoteAction(formData);
      if (result.ok) {
        toast({ title: "Note added", description: "Support note recorded for this workspace." });
        setNote("");
        setOpen(false);
      } else if (result.error) {
        toast({
          title: "Could not add note",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          Add note
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add support note</DialogTitle>
          <DialogDescription>
            Notes are visible to owner/internal ops for this workspace. Keep them concise.
          </DialogDescription>
        </DialogHeader>
        <form
          action={handleSubmit}
          className="space-y-3"
        >
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <Textarea
            name="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add context, customer concern, or internal follow-up..."
            minLength={3}
            maxLength={2000}
            required
          />
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              Save note
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type FeatureFlagsPanelProps = {
  workspaceId: string;
  flags: OwnerFeatureFlag[];
  compact?: boolean;
};

export function FeatureFlagsPanel({ workspaceId, flags, compact }: FeatureFlagsPanelProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [toggleOpen, setToggleOpen] = useState(false);
  const [form, setForm] = useState<{ flagKey: string; value: string; lockKey?: boolean }>({
    flagKey: "",
    value: "",
  });
  const { toast } = useToast();
  const [editPending, startEdit] = useTransition();
  const [togglePending, startToggle] = useTransition();

  const targetFlag = compact ? flags[0] : null;

  const openEdit = (flag?: OwnerFeatureFlag) => {
    setForm({
      flagKey: flag?.flag_key ?? "",
      value: flag?.value ? JSON.stringify(flag.value, null, 2) : "",
      lockKey: Boolean(flag),
    });
    setEditOpen(true);
  };

  const handleToggle = (formData: FormData) => {
    startToggle(async () => {
      const result = await toggleFeatureFlagAction(formData);
      if (result.ok) {
        toast({ title: "Flag toggled", description: "Flag state updated." });
        setToggleOpen(false);
      } else if (result.error) {
        toast({
          title: "Toggle failed",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  const handleEdit = (formData: FormData) => {
    startEdit(async () => {
      const result = await upsertFeatureFlagAction(formData);
      if (result.ok) {
        toast({ title: "Flag saved", description: "Feature flag updated." });
        setEditOpen(false);
      } else if (result.error) {
        toast({
          title: "Could not save flag",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  if (compact && targetFlag) {
    return (
      <div className="flex items-center gap-2">
        <Dialog open={toggleOpen} onOpenChange={setToggleOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant={targetFlag.enabled ? "outline" : "secondary"}>
              {targetFlag.enabled ? "Disable" : "Enable"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {targetFlag.enabled ? "Disable feature flag" : "Enable feature flag"}
              </DialogTitle>
              <DialogDescription>
                This changes runtime behaviour for workspace {workspaceId}. Confirm to continue.
              </DialogDescription>
            </DialogHeader>
            <form action={handleToggle} className="space-y-3">
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <input type="hidden" name="flagKey" value={targetFlag.flag_key} />
              <input
                type="hidden"
                name="enabled"
                value={(!targetFlag.enabled).toString()}
              />
              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  variant={targetFlag.enabled ? "destructive" : "secondary"}
                  disabled={togglePending}
                >
                  {targetFlag.enabled ? "Disable" : "Enable"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost">
              Edit JSON
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit flag value</DialogTitle>
              <DialogDescription>Update JSON value for this flag.</DialogDescription>
            </DialogHeader>
            <form action={handleEdit} className="space-y-3">
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <Input
                name="flagKey"
                value={form.flagKey}
                onChange={(e) => setForm((prev) => ({ ...prev, flagKey: e.target.value }))}
                placeholder="feature.flag.key"
                required
                readOnly={form.lockKey}
              />
              <Textarea
                name="value"
                value={form.value}
                onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))}
                rows={6}
                placeholder='{"enabledFor":"beta"}'
              />
              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={editPending}>
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="secondary" onClick={() => openEdit()}>
        Add flag
      </Button>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.lockKey ? "Edit flag" : "Create flag"}</DialogTitle>
            <DialogDescription>
              Flags are scoped per workspace. JSON is stored as-is.
            </DialogDescription>
          </DialogHeader>
          <form action={handleEdit} className="space-y-3">
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <Input
              name="flagKey"
              value={form.flagKey}
              onChange={(e) => setForm((prev) => ({ ...prev, flagKey: e.target.value }))}
              placeholder="feature.flag.key"
              required
            />
            <Textarea
              name="value"
              value={form.value}
              onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))}
              rows={6}
              placeholder='{"enabledFor":"beta"}'
            />
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={editPending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function WorkspaceStatusActions({
  workspaceId,
  status,
}: {
  workspaceId: string;
  status: string;
}) {
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [unsuspendOpen, setUnsuspendOpen] = useState(false);
  const [suspendPending, startSuspend] = useTransition();
  const [unsuspendPending, startUnsuspend] = useTransition();
  const { toast } = useToast();

  const handleSuspend = (formData: FormData) => {
    startSuspend(async () => {
      const result = await suspendWorkspaceAction(formData);
      if (result.ok) {
        toast({ title: "Workspace suspended" });
        setSuspendOpen(false);
      } else if (result.error) {
        toast({
          title: "Failed to suspend",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  const handleUnsuspend = (formData: FormData) => {
    startUnsuspend(async () => {
      const result = await unsuspendWorkspaceAction(formData);
      if (result.ok) {
        toast({ title: "Workspace unsuspended" });
        setUnsuspendOpen(false);
      } else if (result.error) {
        toast({
          title: "Failed to unsuspend",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm">
            Suspend workspace
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend workspace</DialogTitle>
            <DialogDescription>
              This marks the workspace as suspended and records a reason in audit logs.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSuspend} className="space-y-3">
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <Textarea
              name="reason"
              placeholder="Reason for suspension"
              minLength={4}
              maxLength={500}
              required
            />
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" variant="destructive" disabled={suspendPending}>
                Confirm suspension
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={unsuspendOpen} onOpenChange={setUnsuspendOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary" size="sm" disabled={status !== "suspended"}>
            Unsuspend
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsuspend workspace</DialogTitle>
            <DialogDescription>
              Return the workspace to active status. Optionally document a note.
            </DialogDescription>
          </DialogHeader>
          <form action={handleUnsuspend} className="space-y-3">
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <Textarea name="reason" placeholder="Optional note" maxLength={500} />
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={unsuspendPending}>
                Confirm
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Badge variant={status === "suspended" ? "magenta" : "outline"} className="capitalize">
        {status}
      </Badge>
    </div>
  );
}
