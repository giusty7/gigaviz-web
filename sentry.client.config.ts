import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Only enable in production or when DSN is set
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV ?? "development",

  // Filter noisy errors
  ignoreErrors: [
    // Browser-only noise
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    // Next.js hydration
    "Hydration failed",
    "Text content does not match",
    // Auth redirects (expected)
    "NEXT_REDIRECT",
    "NEXT_NOT_FOUND",
  ],

  // Scrub sensitive data
  beforeSend(event) {
    // Remove cookies and auth headers
    if (event.request?.headers) {
      delete event.request.headers["cookie"];
      delete event.request.headers["authorization"];
    }
    return event;
  },
});
