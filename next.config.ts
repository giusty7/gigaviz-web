import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";
import { validateBuildEnv } from "./lib/env/build";

// Fail fast if required env vars are missing or invalid
validateBuildEnv();

// next-intl plugin — points to the request-time i18n config
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  async headers() {
    const isProd =
      process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const connectSrc = [
      "'self'",
      "https://*.supabase.co",
      "https://*.supabase.in",
      "https://*.supabase.net",
    ];
    if (supabaseUrl) connectSrc.push(supabaseUrl);

    const cspDirectives = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data: blob: https:",
      "style-src 'self' 'unsafe-inline' https:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      `connect-src ${connectSrc.join(" ")}`,
      "font-src 'self' data: https:",
    ].join("; ");

    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-DNS-Prefetch-Control", value: "off" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=()",
      },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Resource-Policy", value: "same-site" },
    ];

    if (isProd) {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      });
      securityHeaders.push({
        key: "Content-Security-Policy-Report-Only",
        value: cspDirectives,
      });
    }

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/data-deletion", destination: "/policies/privacy-policy", permanent: true },
      { source: "/privacy", destination: "/policies/privacy-policy", permanent: true },
      { source: "/terms", destination: "/policies/terms-of-service", permanent: true },
      { source: "/wa-platform", destination: "/products/meta-hub", permanent: true },
      { source: "/products/graph", destination: "/products/studio#graph", permanent: true },
      { source: "/products/tracks", destination: "/products/studio#tracks", permanent: true },
    ];
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  // Suppress Sentry SDK build logs
  silent: true,

  // Only upload source maps when SENTRY_AUTH_TOKEN is set (auto-read from env)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Disable source map uploads when no auth token is available (local dev)
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
