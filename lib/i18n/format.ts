/**
 * Locale-aware formatting utilities.
 *
 * Use these helpers for consistent date, number, and currency formatting
 * across the app. They respect the current locale from next-intl.
 *
 * For Server Components: pass locale from `getLocale()`
 * For Client Components: use `useLocale()` from next-intl
 */

import type { Locale } from "@/i18n/config";

/** Map locale to BCP 47 tag (used by Intl APIs) */
const localeToTag: Record<Locale, string> = {
  en: "en-US",
  id: "id-ID",
};

/** Default currency per locale */
const localeCurrency: Record<Locale, string> = {
  en: "USD",
  id: "IDR",
};

/**
 * Format a number with locale-aware separators.
 */
export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(localeToTag[locale]).format(value);
}

/**
 * Format a currency amount using the locale's default currency.
 *
 * @param amount  - Numeric amount
 * @param locale  - Current locale
 * @param currency - Override currency code (e.g. "USD", "IDR", "EUR")
 */
export function formatCurrency(
  amount: number,
  locale: Locale,
  currency?: string,
): string {
  return new Intl.NumberFormat(localeToTag[locale], {
    style: "currency",
    currency: currency ?? localeCurrency[locale],
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a date relative to now (e.g. "2 hours ago", "3 hari lalu").
 *
 * Uses Intl.RelativeTimeFormat for locale-aware relative time.
 */
export function formatRelativeTimeLocale(
  date: Date | string | null | undefined,
  locale: Locale,
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(localeToTag[locale], { numeric: "auto" });

  if (diffSec < 60) return rtf.format(-diffSec, "second");
  if (diffMin < 60) return rtf.format(-diffMin, "minute");
  if (diffHour < 24) return rtf.format(-diffHour, "hour");
  if (diffDay < 30) return rtf.format(-diffDay, "day");

  // Beyond 30 days, show full date
  return formatDate(d, locale);
}

/**
 * Format a date in medium format (e.g. "Feb 9, 2026" or "9 Feb 2026").
 */
export function formatDate(
  date: Date | string | null | undefined,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat(localeToTag[locale], {
    dateStyle: "medium",
    ...options,
  }).format(d);
}

/**
 * Format a date with time (e.g. "Feb 9, 2026, 3:30 PM").
 */
export function formatDateTime(
  date: Date | string | null | undefined,
  locale: Locale,
): string {
  return formatDate(date, locale, { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Format a percentage (e.g. "85%" or "85%").
 */
export function formatPercent(value: number, locale: Locale): string {
  return new Intl.NumberFormat(localeToTag[locale], {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value / 100);
}
