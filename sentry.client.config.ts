import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Only enable in production or when DSN is set
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV ?? "development",

  // ── User Feedback Widget ────────────────────────────────────────────
  // Floating "Report a Bug" button for logged-in users.
  // Reports are sent directly to Sentry with user context + screenshot.
  integrations: [
    Sentry.feedbackIntegration({
      autoInject: true,
      colorScheme: "dark",
      showBranding: false,
      triggerLabel: "Feedback",
      formTitle: "Report a Bug / Send Feedback",
      submitButtonLabel: "Send",
      cancelButtonLabel: "Cancel",
      nameLabel: "Name",
      namePlaceholder: "Your name",
      emailLabel: "Email",
      emailPlaceholder: "your@email.com",
      messageLabel: "What happened?",
      messagePlaceholder:
        "Describe the issue or share your feedback. Screenshots are welcome!",
      successMessageText: "Thank you! We'll look into this.",
      isNameRequired: false,
      isEmailRequired: false,
      showName: true,
      showEmail: true,
      enableScreenshot: true,
      themeLight: {
        submitBackground: "#d4a843",
        submitBackgroundHover: "#c49a38",
        submitForeground: "#0b1221",
      },
      themeDark: {
        background: "#0f1c2c",
        inputBackground: "#111827",
        inputForeground: "#e5e3d8",
        inputBorder: "#1e3a5f",
        inputOutlineFocus: "#d4a843",
        submitBackground: "#d4a843",
        submitBackgroundHover: "#c49a38",
        submitForeground: "#0b1221",
        formBorderColor: "#1e3a5f",
        foreground: "#e5e3d8",
      },
    }),
  ],

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
