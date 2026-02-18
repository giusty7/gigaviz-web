import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

type SettingsLayoutProps = {
  title: string;
  description?: string;
  nav?: ReactNode;
  children: ReactNode;
  className?: string;
};

export async function SettingsLayout({
  title,
  description,
  nav,
  children,
  className,
}: SettingsLayoutProps) {
  const t = await getTranslations("metaHubUI.settingsLayout");
  return (
    <div className={cn("grid gap-6 lg:grid-cols-[240px_1fr]", className)}>
      <aside className="space-y-2 rounded-xl border border-border bg-card p-4">
        <div className="text-sm font-semibold text-foreground">{t("title")}</div>
        <div className="text-xs text-muted-foreground">{t("description")}</div>
        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
          {nav ?? (
            <>
              <div className="rounded-lg px-2 py-1 hover:bg-gigaviz-surface">{t("profile")}</div>
              <div className="rounded-lg px-2 py-1 hover:bg-gigaviz-surface">{t("workspace")}</div>
              <div className="rounded-lg px-2 py-1 hover:bg-gigaviz-surface">{t("members")}</div>
              <div className="rounded-lg px-2 py-1 hover:bg-gigaviz-surface">{t("billing")}</div>
            </>
          )}
        </div>
      </aside>
      <section className="space-y-2">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className="space-y-6">{children}</div>
      </section>
    </div>
  );
}
