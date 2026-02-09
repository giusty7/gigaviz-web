import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Integrations — Gigaviz Ecosystem",
  description:
    "Integrations that work with Gigaviz Ecosystem: WhatsApp Business Platform (Cloud API), AI providers, Supabase, email, and deployment stack.",
};

export default async function IntegrationsPage() {
  const t = await getTranslations("integrations");
  const tc = await getTranslations("common");

  const categories = [
    {
      title: t("catMessaging"),
      items: ["WhatsApp Business Platform (Cloud API)"],
      desc: t("catMessagingDesc"),
    },
    {
      title: t("catAI"),
      items: ["OpenAI", "Google Gemini", "Anthropic Claude", "Ollama"],
      desc: t("catAIDesc"),
    },
    {
      title: t("catBackend"),
      items: ["Supabase", "Resend"],
      desc: t("catBackendDesc"),
    },
    {
      title: t("catDeployment"),
      items: ["Vercel", "Next.js", "GitHub", "Turbopack"],
      desc: t("catDeploymentDesc"),
    },
    {
      title: t("catDomain"),
      items: ["Squarespace Domains (Registrar)"],
      desc: t("catDomainDesc"),
    },
  ];

  return (
    <main className="flex-1">
      <section className="border-b border-border bg-gradient-to-b from-background via-card/30 to-background">
          <div className="container space-y-10 py-16 md:py-20">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("badge")}</p>
              <h1 className="text-4xl font-gvDisplay font-semibold md:text-5xl">{t("title")}</h1>
              <p className="text-sm text-muted-foreground md:text-base">
                {t("subtitle")}
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("featuredBadge")}</div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-border bg-background px-3 py-1 font-semibold text-foreground">
                  {t("featuredTag")}
                </span>
                <span className="rounded-full border border-border bg-background px-3 py-1 text-muted-foreground">
                  {t("featuredOnboarding")}
                </span>
                <Link href="/trust" className="text-sm font-semibold text-gigaviz-gold hover:underline">
                  {t("featuredLink")}
                </Link>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <div key={category.title} className="rounded-3xl border border-border bg-card p-6">
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{category.title}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {category.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{category.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/get-started"
                className="inline-flex items-center justify-center rounded-2xl bg-gigaviz-gold px-5 py-3 font-semibold text-gigaviz-navy shadow-[0_10px_40px_-15px_rgba(214,178,94,0.8)] hover:bg-gigaviz-gold/90"
              >
                {tc("requestOnboarding")}
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-2xl border border-border px-5 py-3 font-semibold hover:border-gigaviz-gold"
              >
                {tc("talkToUs")}
              </Link>
            </div>

            <div className="rounded-3xl border border-border bg-background p-6">
              <h2 className="text-base font-semibold">{t("trademarkTitle")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("trademarkDesc")}
              </p>
            </div>
          </div>
        </section>
    </main>
  );
}
