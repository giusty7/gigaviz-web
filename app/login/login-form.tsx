"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { supabaseClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validation/auth";
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

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const supabase = useMemo(() => supabaseClient(), []);
  const router = useRouter();
  const sp = useSearchParams();
  const nextParam = sp.get("next");
  const nextSafe = nextParam && nextParam.startsWith("/") ? nextParam : "/app";

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginValues) => {
    setError(null);
    setInfo(null);
    setNeedsVerify(false);

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

    if (signInError) {
      const message = signInError.message || "Login failed.";
      setError(message);
      if (message.toLowerCase().includes("confirm")) {
        setNeedsVerify(true);
      }
      return;
    }

    const confirmed =
      signInData?.user?.email_confirmed_at || signInData?.user?.confirmed_at;
    if (!confirmed) {
      await supabase.auth.signOut();
      setError("Email not verified. Check your inbox to continue.");
      setNeedsVerify(true);
      return;
    }

    router.replace(nextSafe);
  };

  useEffect(() => {
    const emailParam = sp.get("email");
    if (emailParam) {
      form.setValue("email", emailParam);
    }
  }, [form, sp]);

  const resendVerification = async () => {
    setResendBusy(true);
    setError(null);
    setInfo(null);

    const values = form.getValues();
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    setResendBusy(false);

    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Failed to resend verification email.");
      return;
    }

    setInfo("Verification email sent. Check your inbox.");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Login failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {info ? (
          <Alert>
            <AlertTitle>Check your email</AlertTitle>
            <AlertDescription>{info}</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@company.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-2 text-xs text-gigaviz-muted hover:text-gigaviz-cream"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
        </Button>

        {needsVerify ? (
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={resendVerification}
            disabled={resendBusy}
          >
            {resendBusy ? "Resending..." : "Resend verification email"}
          </Button>
        ) : null}

        <div className="flex items-center justify-between text-sm text-gigaviz-muted">
          <a href="/forgot-password" className="hover:text-gigaviz-cream">
            Forgot password?
          </a>
          <a href="/register" className="hover:text-gigaviz-cream">
            Create account
          </a>
        </div>

        <div className="pt-2">
          <a
            href={`/api/auth/oauth?provider=google&next=${encodeURIComponent(nextSafe)}`}
            className="inline-flex w-full items-center justify-center rounded-md border border-gigaviz-border bg-gigaviz-surface px-3 py-2 text-sm font-medium text-gigaviz-cream hover:bg-gigaviz-card"
          >
            Continue with Google
          </a>
        </div>
      </form>
    </Form>
  );
}
