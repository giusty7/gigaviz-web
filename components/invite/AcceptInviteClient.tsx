"use client";
import { logger } from "@/lib/logging";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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

function getErrorMessage(code: string | undefined, status: number | undefined, t: (key: string) => string) {
  switch (code) {
    case "invite_not_found":
    case "invite_not_found_or_expired":
    case "invite_expired":
    case "invite_revoked":
      return t("errorInvalidExpired");
    case "invite_already_accepted":
      return t("errorAlreadyAccepted");
    case "member_already_exists":
      return t("errorAlreadyMember");
    case "invite_used":
      return t("errorAlreadyUsed");
    case "account_exists":
      return t("errorAccountExists");
    case "email_mismatch":
      return t("errorEmailMismatch");
    case "email_not_verified":
      return t("errorEmailNotVerified");
    default:
      if (status === 401) return t("errorSignIn");
      if (status === 403) return t("errorNoPermission");
      if (status === 404) return t("errorInvalidExpired");
      if (status === 409) return t("errorAlreadyUsed");
      return t("errorDefault");
  }
}

export default function AcceptInviteClient({ token }: { token: string }) {
  const t = useTranslations("inviteUI");
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
        setError(t("missingToken"));
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
        setError(getErrorMessage(code, previewRes.status, t));
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
  }, [attempt, normalizedToken, supabase, t]);

  const acceptInvite = async () => {
    if (!normalizedToken) {
      setStatus("error");
      setError(t("missingToken"));
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
        setError(getErrorMessage(payload?.error, res.status, t));
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
      setError(getErrorMessage(payload?.error, res.status, t));
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
      setError(t("missingToken"));
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
      setError(getErrorMessage(payload?.error, res.status, t));
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
      setError(t("unableToComplete"));
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
          {t("invitationFor")} <span className="font-semibold">{invitedEmailMasked}</span>
        </div>
      ) : null}

      {workspaceName ? (
        <div className="text-sm text-gigaviz-muted">
          {t("workspace")} <span className="font-semibold text-gigaviz-cream">{workspaceName}</span>
        </div>
      ) : null}

      {status === "loading" || status === "accepting" ? (
        <div className="space-y-2 text-sm text-gigaviz-muted">
          <p>
            {status === "loading"
              ? t("checkingInvite")
              : t("acceptingInvitation")}
          </p>
          <p>{t("doNotClose")}</p>
        </div>
      ) : null}

      {status === "ready" && hasUserSession ? (
        <div className="space-y-3">
          <p className="text-sm text-gigaviz-muted">
            {t("signedInReady")}
          </p>
          <Button onClick={acceptInvite} disabled={accepting}>
            {t("acceptInvitation")}
          </Button>
        </div>
      ) : null}

      {status === "claim" ? (
        <div className="space-y-4">
          <p className="text-sm text-gigaviz-muted">
            {t("createPasswordPrompt")}
          </p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(claimInvite)} className="space-y-3">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("createPassword")}</FormLabel>
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
                    <FormLabel>{t("confirmPassword")}</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={claiming} className="w-full">
                {claiming ? t("processing") : t("goToDashboard")}
              </Button>
            </form>
          </Form>
          <div className="text-xs text-gigaviz-muted">
            {t("alreadyHaveAccount")} <Link href={loginUrl} className="underline">{t("login")}</Link>
          </div>
        </div>
      ) : null}

      {status === "account_exists" ? (
        <div className="space-y-4">
          <Alert>
            <AlertTitle>{t("accountExists")}</AlertTitle>
            <AlertDescription>
              {t("accountExistsDesc")}
            </AlertDescription>
          </Alert>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href={loginUrl}>{t("continueToLogin")}</Link>
            </Button>
            <Button asChild variant="secondary">
              <a href={oauthUrl}>{t("continueWithGoogle")}</a>
            </Button>
          </div>
        </div>
      ) : null}

      {status === "unauth" ? (
        <div className="space-y-4">
          <Alert>
            <AlertTitle>{t("signInRequired")}</AlertTitle>
            <AlertDescription>
              {t("signInRequiredDesc")}
            </AlertDescription>
          </Alert>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href={loginUrl}>{t("continueToLogin")}</Link>
            </Button>
            <Button asChild variant="secondary">
              <a href={oauthUrl}>{t("continueWithGoogle")}</a>
            </Button>
          </div>
        </div>
      ) : null}

      {status === "invalid" || status === "error" ? (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTitle>{t("invitationFailed")}</AlertTitle>
            <AlertDescription>
              {error ?? t("errorDefault")}
            </AlertDescription>
          </Alert>
          <div className="flex flex-col gap-2">
            <Button onClick={() => setAttempt((prev) => prev + 1)}>
              {t("tryAgain")}
            </Button>
            <Button asChild variant="secondary">
              <Link href="/app">{t("goToApp")}</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
