"use client";

import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { locales, localeLabels, localeFlags, type Locale } from "@/i18n/config";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const DEFAULT_LOCALE = "en";

/**
 * Compact locale switcher component.
 *
 * Sets a NEXT_LOCALE cookie and navigates to the locale-prefixed URL.
 * Works with the "without i18n routing" approach (no [locale] folder).
 *
 * URL strategy (localePrefix: "as-needed"):
 *   - Default locale (en): no prefix → /pricing
 *   - Non-default (id):    prefix   → /id/pricing
 */
export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function switchLocale(next: Locale) {
    setOpen(false);

    // Build the target URL
    // Strip any existing locale prefix from the current pathname
    let cleanPath = pathname;
    for (const loc of locales) {
      if (cleanPath === `/${loc}` || cleanPath.startsWith(`/${loc}/`)) {
        cleanPath = cleanPath.slice(`/${loc}`.length) || "/";
        break;
      }
    }

    // Add locale prefix for non-default locale
    const targetPath =
      next === DEFAULT_LOCALE
        ? cleanPath
        : `/${next}${cleanPath === "/" ? "" : cleanPath}`;

    // Set cookie + hard-navigate in a microtask to satisfy React compiler rules
    // (document.cookie and window.location are intentional browser API mutations)
    const cookieValue = `NEXT_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    queueMicrotask(() => {
      document.cookie = cookieValue;
      window.location.href = targetPath;
    });
  }

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4af37]/20 bg-[#0a1229]/60 px-2.5 py-1.5 text-xs font-medium text-[#f5f5dc]/80 backdrop-blur-sm transition hover:border-[#d4af37]/40 hover:text-[#f5f5dc]"
        aria-label="Switch language"
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{localeFlags[locale]}</span>
        <span className="hidden sm:inline">{localeLabels[locale]}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 min-w-[160px] rounded-lg border border-[#d4af37]/20 bg-[#0a1229] shadow-lg backdrop-blur-xl">
          {locales.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => switchLocale(loc)}
              disabled={loc === locale}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition first:rounded-t-lg last:rounded-b-lg ${
                loc === locale
                  ? "bg-[#d4af37]/10 text-[#d4af37] font-medium"
                  : "text-[#f5f5dc]/70 hover:bg-[#d4af37]/5 hover:text-[#f5f5dc]"
              }`}
            >
              <span className="text-base">{localeFlags[loc]}</span>
              <span>{localeLabels[loc]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
