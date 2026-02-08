/**
 * Shared i18n configuration for next-intl.
 *
 * Locale list and default are defined once and imported by
 * both the middleware (proxy.ts) and the request-time config (i18n/request.ts).
 */

export const locales = ["en", "id"] as const;
export type Locale = (typeof locales)[number];

/** Default locale — English (international first) */
export const defaultLocale: Locale = "en";

/** Map of locale → human-readable label (for locale switcher UI) */
export const localeLabels: Record<Locale, string> = {
  en: "English",
  id: "Bahasa Indonesia",
};

/** Map of locale → flag emoji (for locale switcher UI) */
export const localeFlags: Record<Locale, string> = {
  en: "🇬🇧",
  id: "🇮🇩",
};
