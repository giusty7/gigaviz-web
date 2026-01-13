"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { workspaceCreateSchema } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const schema = workspaceCreateSchema;
type WorkspaceValues = z.infer<typeof schema>;

type WorkspaceCreateDialogProps = {
  trigger?: React.ReactNode;
};

export function WorkspaceCreateDialog({ trigger }: WorkspaceCreateDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const toSlug = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32);

  const form = useForm<WorkspaceValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      slug: "",
      workspaceType: "team",
    },
  });

  const handleSubmit = async (values: WorkspaceValues) => {
    setSubmitting(true);
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      const reason = payload.error || "workspace_create_failed";
      toast({ title: "Workspace not created", description: reason, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const payload = (await res.json()) as { workspace: { slug: string } };
    toast({ title: "Workspace created", description: "Redirecting to the new workspace." });
    setSubmitting(false);
    setOpen(false);
    router.push(`/${payload.workspace.slug}/platform`);
    router.refresh();
  };

  const triggerNode = useMemo(() => {
    if (trigger) return trigger;
    return (
      <Button size="sm" className="bg-gigaviz-gold text-slate-950 hover:bg-gigaviz-gold/90">
        Create workspace
      </Button>
    );
  }, [trigger]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerNode}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>Workspaces isolate data, roles, and billing.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Acme Platform"
                      autoFocus
                      {...field}
                      onChange={(e) => {
                        const nextName = e.target.value;
                        field.onChange(e);
                        if (!slugManuallyEdited) {
                          form.setValue("slug", toSlug(nextName), {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="acme-platform"
                      {...field}
                      onChange={(e) => {
                        setSlugManuallyEdited(true);
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Used in URLs: /[slug]/platform
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workspaceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace type</FormLabel>
                  <FormControl>
                    <select
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gigaviz-gold"
                    >
                      <option value="team">Team</option>
                      <option value="individual">Individual</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create workspace"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
