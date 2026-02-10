"use client";
import { logger } from "@/lib/logging";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { supabaseClient } from "@/lib/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type Status =
  | "loading"
  | "unauth"
  | "ready"
  | "claim"
  | "account_exists"
  | "invalid"
  | "accepting"
  | "error";

const DEV = process.env.NODE_ENV === "development";

const passwordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters."),
  })
  .refine((val) => val.password === val.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

function getErrorMessage(code?: string, status?: number) {
  switch (code) {
    case "invite_not_found":
    case "invite_not_found_or_expired":
    case "invite_expired":
    case "invite_revoked":
      return "This invite link is invalid, expired, or has been revoked.";
    case "invite_already_accepted":
      return "This invite has already been accepted.";
    case "member_already_exists":
      return "You're already a member of this workspace.";
    case "invite_used":
      return "This invite has already been used.";
    case "account_exists":
      return "Account already exists. Please sign in to accept the invitation.";
    case "email_mismatch":
      return "This invite was sent to a different email address.";
    case "email_not_verified":
      return "Please verify your email before accepting this invite.";
    default:
      if (status === 401) return "Please sign in to accept this invitation.";
      if (status === 403) return "You do not have permission to accept this invite.";
      if (status === 404) return "This invite link is invalid, expired, or has been revoked.";
      if (status === 409) return "This invite has already been used.";
      return "Unable to accept the invitation. Please try again.";
  }
}

export default function AcceptInviteClient({ token }: { token: string }) {
  const supabase = useMemo(() => supabaseClient(), []);
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [invitedEmailMasked, setInvitedEmailMasked] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [hasUserSession, setHasUserSession] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const tokenValue = typeof token === "string" ? token.trim() : "";
  const normalizedToken = tokenValue && tokenValue !== "undefined" ? tokenValue : "";
  const invitePath = normalizedToken ? `/invite/${normalizedToken}` : "/invite";
  const loginUrl = `/login?next=${encodeURIComponent(invitePath)}`;
  const oauthUrl = `/api/auth/oauth?provider=google&next=${encodeURIComponent(invitePath)}`;

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!normalizedToken) {
        setStatus("error");
        setError("Missing invitation token.");
        return;
      }

      setStatus("loading");
      setError(null);

      const previewRes = await fetch(`/api/invites/preview?token=${encodeURIComponent(normalizedToken)}`);
      const preview = await previewRes.json().catch(() => ({}));
      if (!active) return;

      if (!previewRes.ok) {
        const code = preview?.status ?? preview?.error;
        setStatus("invalid");
        setError(getErrorMessage(code, previewRes.status));
        return;
      }

      setInvitedEmailMasked(preview?.emailMasked ?? null);
      setWorkspaceName(preview?.workspaceName ?? null);
      const previewStatus = String(preview?.status ?? "valid");
      const exists = previewStatus === "account_exists";

      const { data, error: userErr } = await supabase.auth.getUser();
      if (!active) return;

      if (userErr && DEV) {
        logger.warn("[invite] auth check failed", userErr.message);
      }

      if (data?.user) {
        setHasUserSession(true);
        setStatus("ready");
        return;
      }

      if (exists) {
        setStatus("account_exists");
        return;
      }

      setStatus("claim");
    };

    run();

    return () => {
      active = false;
    };
  }, [attempt, normalizedToken, supabase]);

  const acceptInvite = async () => {
    if (!normalizedToken) {
      setStatus("error");
      setError("Missing invitation token.");
      return;
    }
    setAccepting(true);
    setError(null);

    const res = await fetch("/api/invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: normalizedToken }),
    });
    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401) {
        setStatus("unauth");
        setAccepting(false);
        setError(getErrorMessage(payload?.error, res.status));
        return;
      }
      if (DEV) {
        logger.warn("[invite] accept failed", {
          status: res.status,
          error: payload?.error,
        });
      }
      setStatus("error");
      setAccepting(false);
      setError(getErrorMessage(payload?.error, res.status));
      return;
    }

    const slug = payload?.workspaceSlug;
    const redirectTo = slug
      ? `/${slug}/dashboard?invite=accepted`
      : "/dashboard";
    router.replace(redirectTo);
  };

  const claimInvite = async (values: z.infer<typeof passwordSchema>) => {
    if (!normalizedToken) {
      setStatus("error");
      setError("Missing invitation token.");
      return;
    }
    setClaiming(true);
    setError(null);

    const res = await fetch("/api/invites/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: normalizedToken, password: values.password }),
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      setClaiming(false);
      setError(getErrorMessage(payload?.error, res.status));
      if (payload?.error === "account_exists") {
        setStatus("account_exists");
      } else {
        setStatus("error");
      }
      return;
    }

    const email = payload?.email as string | undefined;
    const slug = payload?.workspaceSlug as string | undefined;
    if (!email || !slug) {
      setClaiming(false);
      setStatus("error");
      setError("Unable to complete signup. Please try again.");
      return;
    }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password: values.password,
    });

    if (signInErr) {
      setClaiming(false);
      setStatus("error");
      setError(signInErr.message ?? "Failed to sign in.");
      return;
    }

    router.replace(`/${slug}/dashboard?invite=accepted`);
  };

  return (
    <div className="space-y-4">
      {invitedEmailMasked ? (
        <div className="rounded-xl border border-gigaviz-border bg-gigaviz-card/60 px-3 py-2 text-sm text-gigaviz-cream">
          Invitation for: <span className="font-semibold">{invitedEmailMasked}</span>
        </div>
      ) : null}

      {workspaceName ? (
        <div className="text-sm text-gigaviz-muted">
          Workspace: <span className="font-semibold text-gigaviz-cream">{workspaceName}</span>
        </div>
      ) : null}

      {status === "loading" || status === "accepting" ? (
        <div className="space-y-2 text-sm text-gigaviz-muted">
          <p>
            {status === "loading"
              ? "Checking your invite..."
              : "Accepting your invitation..."}
          </p>
          <p>Do not close this window.</p>
        </div>
      ) : null}

      {status === "ready" && hasUserSession ? (
        <div className="space-y-3">
          <p className="text-sm text-gigaviz-muted">
            You are signed in. Accept to join this workspace.
          </p>
          <Button onClick={acceptInvite} disabled={accepting}>
            Accept invitation
          </Button>
        </div>
      ) : null}

      {status === "claim" ? (
        <div className="space-y-4">
          <p className="text-sm text-gigaviz-muted">
            Create a password to accept this invite. The email is fixed from the invitation.
          </p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(claimInvite)} className="space-y-3">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Create password</FormLabel>
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
              <Button type="submit" disabled={claiming} className="w-full">
                {claiming ? "Processing..." : "Go to dashboard"}
              </Button>
            </form>
          </Form>
          <div className="text-xs text-gigaviz-muted">
            Already have an account? <Link href={loginUrl} className="underline">Login</Link>
          </div>
        </div>
      ) : null}

      {status === "account_exists" ? (
        <div className="space-y-4">
          <Alert>
            <AlertTitle>Account exists</AlertTitle>
            <AlertDescription>
              An account for this invite email already exists. Please sign in to accept the invite.
            </AlertDescription>
          </Alert>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href={loginUrl}>Continue to login</Link>
            </Button>
            <Button asChild variant="secondary">
              <a href={oauthUrl}>Continue with Google</a>
            </Button>
          </div>
        </div>
      ) : null}

      {status === "unauth" ? (
        <div className="space-y-4">
          <Alert>
            <AlertTitle>Sign in required</AlertTitle>
            <AlertDescription>
              Sign in to accept this invitation.
            </AlertDescription>
          </Alert>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href={loginUrl}>Continue to login</Link>
            </Button>
            <Button asChild variant="secondary">
              <a href={oauthUrl}>Continue with Google</a>
            </Button>
          </div>
        </div>
      ) : null}

      {status === "invalid" || status === "error" ? (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTitle>Invitation failed</AlertTitle>
            <AlertDescription>
              {error ?? "Unable to accept invite."}
            </AlertDescription>
          </Alert>
          <div className="flex flex-col gap-2">
            <Button onClick={() => setAttempt((prev) => prev + 1)}>
              Try again
            </Button>
            <Button asChild variant="secondary">
              <Link href="/app">Go to app</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
