"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type OnboardingFormProps = {
  step: "create" | "invites";
  workspaceSlug?: string | null;
  initialSlug?: string | null;
  error?: string | null;
  actionCreate: (formData: FormData) => void | Promise<void>;
  actionInvite: (formData: FormData) => void | Promise<void>;
};

type SlugStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid"
  | "error";

function normalizeSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 32);
}

const slugPattern = /^[a-z0-9-]{3,32}$/;

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export default function OnboardingForm({
  step,
  workspaceSlug,
  initialSlug,
  error,
  actionCreate,
  actionInvite,
}: OnboardingFormProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState(initialSlug ? normalizeSlug(initialSlug) : "");
  const [slugEdited, setSlugEdited] = useState(Boolean(initialSlug));
  const [availability, setAvailability] = useState<
    "idle" | "available" | "taken" | "invalid" | "error"
  >("idle");
  const [checkedSlug, setCheckedSlug] = useState("");
  const [workspaceType, setWorkspaceType] = useState<"individual" | "team">(
    "individual"
  );
  const t = useTranslations("onboarding");

  const message = useMemo(() => {
    if (error === "slug_taken") {
      return t("errorSlugTaken");
    }
    if (error?.includes("invalid")) {
      return decodeURIComponent(error);
    }
    if (error) {
      return decodeURIComponent(error);
    }
    return null;
  }, [error, t]);

  const slugValue = slugEdited ? slug : normalizeSlug(name);
  const slugValid = slugPattern.test(slugValue);
  const shouldCheck = Boolean(slugValue) && slugValid;
  const isChecking = shouldCheck && checkedSlug !== slugValue;
  const status: SlugStatus = !slugValue
    ? "idle"
    : !slugValid
    ? "invalid"
    : isChecking
    ? "checking"
    : availability === "invalid"
    ? "invalid"
    : availability === "idle"
    ? "checking"
    : availability;

  useEffect(() => {
    if (!shouldCheck) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/workspaces/check?slug=${encodeURIComponent(slugValue)}`,
          {
            signal: controller.signal,
          }
        );
        if (controller.signal.aborted) return;
        if (!res.ok) {
          setAvailability(res.status === 400 ? "invalid" : "error");
          setCheckedSlug(slugValue);
          return;
        }
        const payload = (await res.json()) as { available?: boolean };
        setAvailability(payload.available ? "available" : "taken");
        setCheckedSlug(slugValue);
      } catch {
        if (!controller.signal.aborted) {
          setAvailability("error");
          setCheckedSlug(slugValue);
        }
      }
    }, 400);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [shouldCheck, slugValue]);

  const statusLabel =
    status === "available"
      ? t("slugAvailable")
      : status === "taken"
      ? t("slugTaken")
      : status === "checking"
      ? t("slugChecking")
      : status === "invalid"
      ? t("slugInvalid")
      : status === "error"
      ? t("slugError")
      : "";

  const statusClass =
    status === "available"
      ? "text-emerald-400"
      : status === "taken" || status === "invalid" || status === "error"
      ? "text-rose-300"
      : "text-gigaviz-muted";

  if (step === "invites") {
    return (
      <form action={actionInvite} className="space-y-4 rounded-xl border border-gigaviz-border bg-gigaviz-card p-6">
        {message ? (
          <Alert variant="destructive">
            <AlertTitle>{t("inviteError")}</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}

        <div>
          <label className="text-sm font-medium">{t("inviteLabel")}</label>
          <p className="text-xs text-gigaviz-muted">
            {t("inviteHelper")}
          </p>
        </div>

        <input type="hidden" name="workspace_slug" value={workspaceSlug ?? ""} />
        <textarea
          name="invite_emails"
          rows={5}
          className="w-full rounded-md border border-gigaviz-border bg-gigaviz-surface px-3 py-2 text-sm text-gigaviz-cream placeholder:text-gigaviz-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gigaviz-gold focus-visible:ring-offset-2 focus-visible:ring-offset-gigaviz-bg"
          placeholder="teammate@company.com"
        />

        <div className="flex flex-col gap-2">
          <SubmitButton label={t("saveInvites")} pendingLabel={t("working")} />
          {workspaceSlug ? (
            <Button type="button" variant="secondary" asChild>
              <a href={`/${workspaceSlug}/dashboard`}>{t("skipForNow")}</a>
            </Button>
          ) : null}
        </div>
      </form>
    );
  }

  return (
    <form action={actionCreate} className="space-y-4 rounded-xl border border-gigaviz-border bg-gigaviz-card p-6">
      {message ? (
        <Alert variant="destructive">
          <AlertTitle>{t("setupError")}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <div>
        <label className="text-sm font-medium">{t("workspaceNameLabel")}</label>
        <Input
          name="workspace_name"
          placeholder="Gigaviz Studio"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium">{t("slugLabel")}</label>
        <Input
          name="workspace_slug"
          placeholder="gigaviz-studio"
          value={slugValue}
          onChange={(e) => {
            setSlug(normalizeSlug(e.target.value));
            setSlugEdited(true);
          }}
        />
        {statusLabel ? (
          <div className={`mt-2 text-xs ${statusClass}`}>{statusLabel}</div>
        ) : null}
      </div>

      <div>
        <label className="text-sm font-medium">{t("workspaceTypeLabel")}</label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-lg border border-gigaviz-border bg-gigaviz-surface px-3 py-2 text-sm">
            <input
              type="radio"
              name="workspace_type"
              value="individual"
              checked={workspaceType === "individual"}
              onChange={() => setWorkspaceType("individual")}
            />
            {t("individual")}
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-gigaviz-border bg-gigaviz-surface px-3 py-2 text-sm">
            <input
              type="radio"
              name="workspace_type"
              value="team"
              checked={workspaceType === "team"}
              onChange={() => setWorkspaceType("team")}
            />
            {t("team")}
          </label>
        </div>
      </div>

      <SubmitButton label={t("createButton")} pendingLabel={t("working")} />
    </form>
  );
}


