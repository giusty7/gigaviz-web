import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";

export async function Footer() {
  const t = await getTranslations("footer");
  return (
    <footer className="border-t border-[color:var(--gv-border)]">
      <div className="container flex flex-col gap-4 py-6 text-xs text-[color:var(--gv-muted)] md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-[color:var(--gv-text)]">{t("brand")}</p>
          <p>{t("builtWith")}</p>
          <p>{t("builtIn")}</p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <LocaleSwitcher />
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-4 text-[color:var(--gv-muted)] md:justify-end">
            <Link href="/contact" className="transition-colors hover:text-[color:var(--gv-text)]">
              {t("contact")}
            </Link>
            <Link href="/media-kit" className="transition-colors hover:text-[color:var(--gv-text)]">
              {t("mediaKit")}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
