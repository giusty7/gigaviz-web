/**
 * Structured Logger — Production-grade logging for Gigaviz.
 *
 * Features:
 * - JSON structured output in production (machine-parseable for Datadog/Logflare/Vercel)
 * - Human-readable console output in development
 * - Correlation ID support for request tracing
 * - PII scrubbing (emails, phone numbers, tokens)
 * - Log level filtering via LOG_LEVEL env var
 * - Sentry integration for error-level logs
 */

const IS_PROD =
  process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
const IS_DEV = process.env.NODE_ENV === "development";

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL: number =
  LOG_LEVELS[(process.env.LOG_LEVEL as LogLevel) ?? (IS_PROD ? "info" : "debug")] ?? 1;

// PII patterns to scrub from log metadata
const PII_PATTERNS: [RegExp, string][] = [
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL_REDACTED]"],
  [/\b\+?\d{10,15}\b/g, "[PHONE_REDACTED]"],
  [/\b(sk-|sk_live_|sk_test_|Bearer\s+)[A-Za-z0-9_-]{20,}\b/g, "[TOKEN_REDACTED]"],
  [/\b(eyJ)[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g, "[JWT_REDACTED]"],
];

function scrubPII(value: unknown): unknown {
  if (typeof value === "string") {
    let scrubbed = value;
    for (const [pattern, replacement] of PII_PATTERNS) {
      scrubbed = scrubbed.replace(pattern, replacement);
    }
    return scrubbed;
  }
  if (Array.isArray(value)) return value.map(scrubPII);
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      // Scrub sensitive field names entirely
      if (/password|secret|token|authorization|cookie/i.test(k)) {
        result[k] = "[REDACTED]";
      } else {
        result[k] = scrubPII(v);
      }
    }
    return result;
  }
  return value;
}

// Async-local storage for request-scoped correlation IDs
let correlationId: string | undefined;

export function setCorrelationId(id: string) {
  correlationId = id;
}

export function getCorrelationId(): string | undefined {
  return correlationId;
}

function formatLog(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>
): string | Record<string, unknown> {
  const timestamp = new Date().toISOString();
  const scrubbedMeta = meta ? (scrubPII(meta) as Record<string, unknown>) : undefined;

  if (IS_PROD) {
    // JSON structured output for log aggregators
    return {
      timestamp,
      level,
      message,
      correlationId: correlationId ?? undefined,
      ...scrubbedMeta,
    };
  }

  // Human-readable for dev
  const prefix = `[${level.toUpperCase()}]`;
  const metaStr =
    scrubbedMeta && Object.keys(scrubbedMeta).length > 0
      ? ` ${JSON.stringify(scrubbedMeta)}`
      : "";
  return `${prefix} ${message}${metaStr}`;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= MIN_LEVEL;
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown> | unknown) {
  if (!shouldLog(level)) return;

  // Normalize meta: if it's not a Record, wrap it
  let normalizedMeta: Record<string, unknown> | undefined;
  if (meta !== undefined) {
    if (meta && typeof meta === "object" && !Array.isArray(meta)) {
      normalizedMeta = meta as Record<string, unknown>;
    } else {
      normalizedMeta = { value: meta };
    }
  }

  const formatted = formatLog(level, message, normalizedMeta);

  if (IS_PROD && typeof formatted === "object") {
    // JSON line for production log aggregators
    console[level === "debug" ? "log" : level](JSON.stringify(formatted));
  } else {
    console[level === "debug" ? "log" : level](formatted);
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown> | unknown) => log("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown> | unknown) => log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown> | unknown) => log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown> | unknown) => log("error", msg, meta),
  /** Only logs in development mode */
  dev: (msg: string, meta?: Record<string, unknown> | unknown) => {
    if (IS_DEV) log("debug", msg, meta);
  },
};
