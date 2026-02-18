"use client";
import { logger } from "@/lib/logging";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  contactSchema,
  type ContactFormData,
  contactTopics,
  budgetRanges,
} from "@/lib/validation/contact";
import { track } from "@/lib/analytics";

export function ContactForm() {
  const t = useTranslations("contactFormUI");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      topic: undefined,
      message: "",
      budgetRange: "",
      website: "", // honeypot
    },
  });

  const fieldClass =
    "mt-1 w-full rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-4 py-3 text-sm text-[color:var(--gv-text)] placeholder:text-[color:var(--gv-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--gv-accent)]";

  const onSubmit = async (data: ContactFormData) => {
    try {
      setStatus("loading");
      setServerMessage(null);

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };

      if (!res.ok || !json?.ok) {
        setStatus("error");
        setServerMessage(json?.message ?? t("failedToSend"));
        return;
      }

      const eventParams: Record<string, string> = {
        topic: data.topic,
      };
      if (data.budgetRange) {
        eventParams.budget_range = data.budgetRange;
      }
      track("contact_submit_success", eventParams);

      setStatus("success");
      setServerMessage(json?.message ?? t("messageSent"));
      reset();
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      setStatus("error");
      setServerMessage(t("somethingWrong"));
    }
  };

  return (
    <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
      <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
        {t("title")}
      </h2>
      <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
        {t("subtitle")}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4 text-sm">
        <div className="space-y-1">
          <label className="text-xs text-[color:var(--gv-muted)]" htmlFor="name">
            {t("fullName")}
          </label>
          <input
            id="name"
            type="text"
            {...register("name")}
            className={fieldClass}
            placeholder={t("placeholderName")}
          />
          {errors.name && (
            <p className="text-xs text-[color:var(--gv-accent-2)]">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs text-[color:var(--gv-muted)]" htmlFor="email">
            {t("email")}
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className={fieldClass}
            placeholder={t("placeholderEmail")}
          />
          {errors.email && (
            <p className="text-xs text-[color:var(--gv-accent-2)]">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs text-[color:var(--gv-muted)]" htmlFor="company">
            {t("company")}
          </label>
          <input
            id="company"
            type="text"
            {...register("company")}
            className={fieldClass}
            placeholder={t("placeholderCompany")}
          />
          {errors.company && (
            <p className="text-xs text-[color:var(--gv-accent-2)]">
              {errors.company.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs text-[color:var(--gv-muted)]" htmlFor="topic">
            {t("topic")}
          </label>
          <select id="topic" {...register("topic")} className={fieldClass}>
            <option value="">{t("placeholderTopic")}</option>
            {contactTopics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
          {errors.topic && (
            <p className="text-xs text-[color:var(--gv-accent-2)]">
              {errors.topic.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs text-[color:var(--gv-muted)]" htmlFor="budgetRange">
            {t("budgetRange")}
          </label>
          <select id="budgetRange" {...register("budgetRange")} className={fieldClass}>
            <option value="">{t("placeholderBudget")}</option>
            {budgetRanges.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>
          {errors.budgetRange && (
            <p className="text-xs text-[color:var(--gv-accent-2)]">
              {errors.budgetRange.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs text-[color:var(--gv-muted)]" htmlFor="message">
            {t("message")}
          </label>
          <textarea
            id="message"
            rows={5}
            {...register("message")}
            className={fieldClass}
            placeholder={t("placeholderMessage")}
          />
          {errors.message && (
            <p className="text-xs text-[color:var(--gv-accent-2)]">
              {errors.message.message}
            </p>
          )}
        </div>

        {/* Honeypot anti-spam */}
        <div className="hidden">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            type="text"
            autoComplete="off"
            {...register("website")}
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[color:var(--gv-cream)] disabled:opacity-60"
        >
          {status === "loading" ? t("sending") : t("sendMessage")}
        </button>

        {serverMessage && (
          <p
            className={`text-sm ${
              status === "success"
                ? "text-[color:var(--gv-accent)]"
                : "text-[color:var(--gv-accent-2)]"
            }`}
            aria-live="polite"
          >
            {serverMessage}
          </p>
        )}
      </form>
    </div>
  );
}
