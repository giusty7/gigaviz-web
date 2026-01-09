"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { User } from "@supabase/supabase-js";
import { supabaseClient } from "@/lib/supabase/client";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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

type ResetValues = z.infer<typeof resetPasswordSchema>;

const DEV = process.env.NODE_ENV === "development";

function collectProviders(user: User | null | undefined) {
  const providers = Array.isArray(user?.app_metadata?.providers)
    ? user.app_metadata.providers
    : [];
  const primary = user?.app_metadata?.provider
    ? [user.app_metadata.provider]
    : [];
  const identities = Array.isArray(user?.identities)
    ? user.identities.map((identity) => identity?.provider).filter(Boolean)
    : [];
  return [...providers, ...primary, ...identities]
    .filter(Boolean)
    .map((provider) => String(provider).toLowerCase());
}

function hasPassword(user: User | null | undefined) {
  return collectProviders(user).includes("email");
}

export default function SetPasswordModal({ forceOpen = false }: { forceOpen?: boolean }) {
  const supabase = useMemo(() => supabaseClient(), []);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inviteAccepted = searchParams.get("invite") === "accepted";
  const shouldPrompt = forceOpen || inviteAccepted;
  const clearInviteParam = () => {
    if (!inviteAccepted) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("invite");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname);
  };

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    let active = true;

    const checkUser = async () => {
      if (!shouldPrompt) {
        setReady(true);
        return;
      }

      const { data, error: userErr } = await supabase.auth.getUser();
      if (!active) return;

      if (userErr && DEV) {
        console.warn("[set-password] getUser failed", userErr.message);
      }

      const user = data?.user;
      if (!user) {
        setReady(true);
        return;
      }

      const needs = !hasPassword(user);
      if (DEV) {
        console.log("[set-password] needsPassword", { needs });
      }
      setNeedsPassword(needs);
      setOpen(needs && shouldPrompt);
      setReady(true);
    };

    checkUser();

    return () => {
      active = false;
    };
  }, [supabase, shouldPrompt]);

  const onSubmit = async (values: ResetValues) => {
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (updateError) {
      if (DEV) {
        console.warn("[set-password] update failed", updateError.message);
      }
      setError(updateError.message ?? "Unable to set password.");
      return;
    }

    setNeedsPassword(false);
    setDone(true);
    setOpen(true);
    clearInviteParam();
  };

  if (!ready || ((!needsPassword || !shouldPrompt) && !done)) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set your password</DialogTitle>
          <DialogDescription>
            You signed in with a social login. Set a password to enable email sign-in.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="space-y-4">
            <Alert>
              <AlertTitle>Password saved</AlertTitle>
              <AlertDescription>
                Your account now supports email login.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end">
              <Button onClick={() => setOpen(false)}>Continue</Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error ? (
                <Alert variant="destructive">
                  <AlertTitle>Set password failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                {form.formState.isSubmitting ? "Saving..." : "Set password"}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
