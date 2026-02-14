#!/usr/bin/env tsx
/**
 * ═══════════════════════════════════════════════════════════════════════
 * Gigaviz Preflight Check — Production Readiness Validator
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Run before deploying to production to validate all critical
 * configuration, environment variables, and service connections.
 *
 * Usage:
 *   npx tsx scripts/preflight.ts              # Full check
 *   npx tsx scripts/preflight.ts --env-only   # Only check env vars
 *
 * Exit codes:
 *   0 — All checks passed
 *   1 — One or more critical checks failed
 */

/* eslint-disable no-console */

import { config } from "dotenv";

// Load .env.local if available
config({ path: ".env.local" });
config({ path: ".env" });

// ── Types ─────────────────────────────────────────────────────────────

type CheckResult = {
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
};

type EnvVar = {
  key: string;
  required: boolean;
  label: string;
  sensitive?: boolean;
  validate?: (value: string) => boolean;
};

// ── Color Helpers ─────────────────────────────────────────────────────

const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function icon(status: CheckResult["status"]): string {
  switch (status) {
    case "pass":
      return `${GREEN}✓${RESET}`;
    case "warn":
      return `${YELLOW}⚠${RESET}`;
    case "fail":
      return `${RED}✗${RESET}`;
  }
}

// ── Environment Variable Definitions ──────────────────────────────────

const ENV_VARS: EnvVar[] = [
  // Core
  { key: "NEXT_PUBLIC_SUPABASE_URL", required: true, label: "Supabase URL", validate: (v) => v.startsWith("https://") },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true, label: "Supabase Anon Key", sensitive: true },
  { key: "SUPABASE_SERVICE_ROLE_KEY", required: true, label: "Supabase Service Role", sensitive: true },

  // App URLs
  { key: "APP_BASE_URL", required: true, label: "App Base URL (server)", validate: (v) => v.startsWith("http") },
  { key: "NEXT_PUBLIC_APP_URL", required: true, label: "App URL (client)", validate: (v) => v.startsWith("http") },

  // Access Control
  { key: "GIGAVIZ_OWNER_EMAILS", required: true, label: "Owner emails (ops access)" },
  { key: "OPS_ENABLED", required: false, label: "Ops console enabled" },

  // Email
  { key: "RESEND_API_KEY", required: false, label: "Resend API key (transactional email)", sensitive: true },

  // Sentry
  { key: "NEXT_PUBLIC_SENTRY_DSN", required: false, label: "Sentry DSN (error monitoring)" },
  { key: "SENTRY_ORG", required: false, label: "Sentry org (source maps)" },
  { key: "SENTRY_PROJECT", required: false, label: "Sentry project" },

  // Meta / WhatsApp
  { key: "META_APP_ID", required: false, label: "Meta App ID" },
  { key: "META_APP_SECRET", required: false, label: "Meta App Secret", sensitive: true },
  { key: "META_WEBHOOK_VERIFY_TOKEN", required: false, label: "Webhook verify token", sensitive: true },

  // Payment
  { key: "MIDTRANS_SERVER_KEY", required: false, label: "Midtrans Server Key", sensitive: true },
  { key: "MIDTRANS_CLIENT_KEY", required: false, label: "Midtrans Client Key", sensitive: true },
  { key: "MIDTRANS_IS_PRODUCTION", required: false, label: "Midtrans production mode", validate: (v) => v === "true" || v === "false" },

  // Cron
  { key: "CRON_SECRET", required: false, label: "Cron secret (scheduled jobs)", sensitive: true },

  // Redis
  { key: "UPSTASH_REDIS_REST_URL", required: false, label: "Upstash Redis URL" },
  { key: "UPSTASH_REDIS_REST_TOKEN", required: false, label: "Upstash Redis token", sensitive: true },

  // AI
  { key: "OPENAI_API_KEY", required: false, label: "OpenAI API key (Helper RAG)", sensitive: true },
];

// ── Checks ────────────────────────────────────────────────────────────

function checkEnvVars(): CheckResult[] {
  const results: CheckResult[] = [];

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.key];
    const exists = !!value && value.trim().length > 0;

    if (!exists) {
      results.push({
        name: envVar.key,
        status: envVar.required ? "fail" : "warn",
        message: envVar.required
          ? `🔴 MISSING — ${envVar.label}`
          : `⚪ Not set — ${envVar.label}`,
      });
      continue;
    }

    // Validate format if validator exists
    if (envVar.validate && !envVar.validate(value!)) {
      results.push({
        name: envVar.key,
        status: "warn",
        message: `Invalid format — ${envVar.label}`,
      });
      continue;
    }

    // Mask sensitive values
    const display = envVar.sensitive
      ? `${value!.substring(0, 6)}...${value!.substring(value!.length - 4)}`
      : value!.length > 60
        ? `${value!.substring(0, 57)}...`
        : value!;

    results.push({
      name: envVar.key,
      status: "pass",
      message: `${envVar.label} ${DIM}(${display})${RESET}`,
    });
  }

  return results;
}

function checkProductionConfig(): CheckResult[] {
  const results: CheckResult[] = [];

  // Check if URLs point to localhost (not production-ready)
  const appUrl = process.env.APP_BASE_URL ?? "";
  if (appUrl.includes("localhost") || appUrl.includes("127.0.0.1")) {
    results.push({
      name: "APP_BASE_URL",
      status: "warn",
      message: "APP_BASE_URL points to localhost — update for production",
    });
  } else {
    results.push({
      name: "APP_BASE_URL",
      status: "pass",
      message: `Production URL: ${appUrl}`,
    });
  }

  // Check Midtrans production mode
  const midtransProd = process.env.MIDTRANS_IS_PRODUCTION;
  const midtransKey = process.env.MIDTRANS_SERVER_KEY ?? "";
  if (midtransProd === "true" && midtransKey.startsWith("SB-")) {
    results.push({
      name: "MIDTRANS_KEYS",
      status: "fail",
      message: "MIDTRANS_IS_PRODUCTION=true but using sandbox keys (SB- prefix)",
    });
  } else if (midtransProd === "true") {
    results.push({
      name: "MIDTRANS_KEYS",
      status: "pass",
      message: "Midtrans in production mode with production keys",
    });
  } else if (midtransKey) {
    results.push({
      name: "MIDTRANS_KEYS",
      status: "warn",
      message: "Midtrans in sandbox mode — set MIDTRANS_IS_PRODUCTION=true for live payments",
    });
  }

  // Check Meta OAuth redirect URI
  const oauthRedirect = process.env.META_OAUTH_REDIRECT_URI ?? "";
  if (oauthRedirect && oauthRedirect.includes("localhost")) {
    results.push({
      name: "META_OAUTH_REDIRECT_URI",
      status: "warn",
      message: "OAuth redirect URI points to localhost",
    });
  }

  // Check security-critical settings
  if (!process.env.CRON_SECRET && !process.env.VERCEL_CRON_SECRET) {
    results.push({
      name: "CRON_SECRET",
      status: "warn",
      message: "No cron secret — scheduled jobs will be unprotected",
    });
  }

  return results;
}

function checkModuleReadiness(): CheckResult[] {
  const results: CheckResult[] = [];

  // Core Platform
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  results.push({
    name: "Platform",
    status: hasSupabase ? "pass" : "fail",
    message: hasSupabase ? "Supabase connected" : "Supabase not configured",
  });

  // Meta Hub
  const hasMeta = !!process.env.META_APP_ID && !!process.env.META_APP_SECRET;
  const hasWebhook = !!process.env.META_WEBHOOK_VERIFY_TOKEN;
  results.push({
    name: "Meta Hub",
    status: hasMeta && hasWebhook ? "pass" : hasMeta ? "warn" : "warn",
    message: hasMeta
      ? hasWebhook
        ? "Meta App + Webhook configured"
        : "Meta App configured, webhook verify token missing"
      : "Not configured — WhatsApp features disabled",
  });

  // Payment
  const hasPayment = !!process.env.MIDTRANS_SERVER_KEY;
  results.push({
    name: "Payments",
    status: hasPayment ? "pass" : "warn",
    message: hasPayment ? "Midtrans configured" : "No payment gateway — billing disabled",
  });

  // Email
  const hasEmail = !!process.env.RESEND_API_KEY;
  results.push({
    name: "Email",
    status: hasEmail ? "pass" : "warn",
    message: hasEmail ? "Resend configured" : "No email — invites/notifications won't send",
  });

  // Monitoring
  const hasSentry = !!process.env.NEXT_PUBLIC_SENTRY_DSN;
  results.push({
    name: "Monitoring",
    status: hasSentry ? "pass" : "warn",
    message: hasSentry ? "Sentry configured" : "No Sentry — errors won't be tracked",
  });

  // AI / Helper
  const hasAI = !!process.env.OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY;
  results.push({
    name: "AI / Helper",
    status: hasAI ? "pass" : "warn",
    message: hasAI ? "LLM provider configured" : "No LLM key — Helper features disabled",
  });

  // Rate Limiting
  const hasRedis = !!process.env.UPSTASH_REDIS_REST_URL;
  results.push({
    name: "Rate Limiting",
    status: hasRedis ? "pass" : "warn",
    message: hasRedis ? "Upstash Redis configured" : "No Redis — using DB fallback rate limiting",
  });

  return results;
}

// ── Main ──────────────────────────────────────────────────────────────

function main() {
  const envOnly = process.argv.includes("--env-only");

  console.log("");
  console.log(`${BOLD}═══════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}  🚀 Gigaviz Preflight Check${RESET}`);
  console.log(`${BOLD}═══════════════════════════════════════════════════${RESET}`);
  console.log("");

  // ── 1. Environment Variables ──
  console.log(`${BOLD}📋 Environment Variables${RESET}`);
  console.log("─".repeat(50));
  const envResults = checkEnvVars();
  for (const r of envResults) {
    console.log(`  ${icon(r.status)} ${r.message}`);
  }

  if (envOnly) {
    printSummary(envResults);
    return;
  }

  // ── 2. Production Configuration ──
  console.log("");
  console.log(`${BOLD}⚙️  Production Configuration${RESET}`);
  console.log("─".repeat(50));
  const configResults = checkProductionConfig();
  for (const r of configResults) {
    console.log(`  ${icon(r.status)} ${r.message}`);
  }

  // ── 3. Module Readiness ──
  console.log("");
  console.log(`${BOLD}📦 Module Readiness${RESET}`);
  console.log("─".repeat(50));
  const moduleResults = checkModuleReadiness();
  for (const r of moduleResults) {
    console.log(`  ${icon(r.status)} ${r.name}: ${r.message}`);
  }

  // ── Summary ──
  const allResults = [...envResults, ...configResults, ...moduleResults];
  printSummary(allResults);
}

function printSummary(results: CheckResult[]) {
  const passed = results.filter((r) => r.status === "pass").length;
  const warned = results.filter((r) => r.status === "warn").length;
  const failed = results.filter((r) => r.status === "fail").length;

  console.log("");
  console.log("─".repeat(50));
  console.log(
    `  ${GREEN}${passed} passed${RESET}  ${YELLOW}${warned} warnings${RESET}  ${RED}${failed} failed${RESET}`
  );

  if (failed > 0) {
    console.log("");
    console.log(`${RED}${BOLD}  ✗ PREFLIGHT FAILED — Fix ${failed} critical issue(s) before deploying${RESET}`);
    console.log("");
    process.exit(1);
  } else if (warned > 0) {
    console.log("");
    console.log(`${YELLOW}${BOLD}  ⚠ PREFLIGHT PASSED with ${warned} warning(s)${RESET}`);
    console.log(`${DIM}  Optional services are not configured. Core features will work.${RESET}`);
    console.log("");
  } else {
    console.log("");
    console.log(`${GREEN}${BOLD}  ✓ ALL CHECKS PASSED — Ready for deployment!${RESET}`);
    console.log("");
  }
}

main();
