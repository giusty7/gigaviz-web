"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeLabels, localeFlags, type Locale } from "@/i18n/config";
import { Globe } from "lucide-react";
import { useTransition, useState, useRef, useEffect } from "react";

/**
 * Compact locale switcher component.
 *
 * Displays current locale flag + dropdown to switch.
 * Works with next-intl's "as-needed" prefix strategy.
 */
export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
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
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4af37]/20 bg-[#0a1229]/60 px-2.5 py-1.5 text-xs font-medium text-[#f5f5dc]/80 backdrop-blur-sm transition hover:border-[#d4af37]/40 hover:text-[#f5f5dc] disabled:opacity-50"
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
