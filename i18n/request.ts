import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * next-intl request-time configuration.
 *
 * This project uses the "without i18n routing" approach:
 * - No [locale] folder in app/
 * - Locale is determined by the NEXT_LOCALE cookie (set in proxy.ts)
 * - The locale switcher sets the cookie + navigates
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // 1. Try requestLocale from next-intl (may be set by middleware or plugin)
  let locale = await requestLocale;

  // 2. Fallback: read NEXT_LOCALE cookie (set by proxy.ts on /id/* rewrites)
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    try {
      const store = await cookies();
      const cookieLocale = store.get("NEXT_LOCALE")?.value;
      if (cookieLocale && routing.locales.includes(cookieLocale as (typeof routing.locales)[number])) {
        locale = cookieLocale;
      }
    } catch {
      // cookies() may fail in certain contexts (e.g. static generation)
    }
  }

  // 3. Final fallback to default locale
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
