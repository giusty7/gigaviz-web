"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { supabaseClient } from "@/lib/supabase/client";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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

export default function ResetPasswordForm() {
  const supabase = useMemo(() => supabaseClient(), []);
  const [status, setStatus] = useState<"checking" | "ready" | "invalid" | "done">(
    "checking"
  );
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setStatus(data.session ? "ready" : "invalid");
    };

    checkSession();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event) => {
        if (!active) return;
        if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
          setStatus("ready");
        }
      }
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  const onSubmit = async (values: ResetValues) => {
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (updateError) {
      setError(updateError.message ?? "Reset failed.");
      return;
    }

    await supabase.auth.signOut();
    setStatus("done");
  };

  if (status === "invalid") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Reset link expired</AlertTitle>
        <AlertDescription>
          Request a new reset link from the forgot password page.
        </AlertDescription>
      </Alert>
    );
  }

  if (status === "done") {
    return (
      <Alert>
        <AlertTitle>Password updated</AlertTitle>
        <AlertDescription>
          <a href="/login" className="text-gigaviz-cream underline">
            Return to login
          </a>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Reset failed</AlertTitle>
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

        <Button type="submit" className="w-full" disabled={status !== "ready"}>
          {form.formState.isSubmitting ? "Updating..." : "Update password"}
        </Button>
      </form>
    </Form>
  );
}
