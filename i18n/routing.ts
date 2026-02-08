import { defineRouting } from "next-intl/routing";
import { locales, defaultLocale } from "./config";

/**
 * next-intl routing configuration.
 *
 * Strategy: "as-needed" — the default locale (en) has NO prefix,
 * non-default locales get a prefix (e.g. /id/pricing).
 * This preserves existing URLs for English users.
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});
