import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger, setCorrelationId } from "@/lib/logging";

/** Standard Next.js API route handler type */
type ApiHandler = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

/**
 * Flexible handler input type — accepts any params shape
 * so routes with specific types like Promise<{ id: string }> work without casting.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HandlerInput = (req: NextRequest, ctx: any) => Promise<any>;

/**
 * Higher-order function that wraps API route handlers with:
 * - Correlation ID for request tracing
 * - Structured error logging
 * - Sentry error reporting
 * - Zod validation error formatting
 * - Safe error responses (no stack traces leaked)
 *
 * Usage:
 * ```ts
 * export const POST = withErrorHandler(async (req) => {
 *   const body = await req.json();
 *   // ... your logic
 *   return NextResponse.json({ data });
 * });
 * ```
 */
export function withErrorHandler(handler: HandlerInput): ApiHandler {
  return async (req: NextRequest, ctx) => {
    const requestId = crypto.randomUUID();
    setCorrelationId(requestId);

    const start = Date.now();
    const method = req.method;
    const url = req.nextUrl.pathname;

    try {
      const response = await handler(req, ctx);

      // Log slow requests (>3s)
      const duration = Date.now() - start;
      if (duration > 3000) {
        logger.warn("Slow API response", {
          method,
          url,
          duration,
          status: response.status,
          requestId,
        });
      }

      return response;
    } catch (error) {
      const duration = Date.now() - start;

      // Zod validation errors → 400
      if (error instanceof ZodError) {
        logger.warn("Validation error", {
          method,
          url,
          requestId,
          issues: error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        });
        return NextResponse.json(
          {
            error: "Validation failed",
            details: error.issues.map((i) => ({
              field: i.path.join("."),
              message: i.message,
            })),
            requestId,
          },
          { status: 400 }
        );
      }

      // Report to Sentry (dynamic import to avoid bundling issues)
      try {
        const Sentry = await import("@sentry/nextjs");
        Sentry.captureException(error, {
          tags: { method, url },
          extra: { requestId, duration },
        });
      } catch {
        // Sentry not available — log only
      }

      // Structured error log
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack =
        error instanceof Error ? error.stack : undefined;

      logger.error("API route error", {
        method,
        url,
        requestId,
        duration,
        error: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      });

      // Safe error response
      return NextResponse.json(
        {
          error: "Internal server error",
          requestId,
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Require a specific HTTP method, return 405 otherwise.
 */
export function requireMethod(
  req: NextRequest,
  allowed: string | string[]
): NextResponse | null {
  const methods = Array.isArray(allowed) ? allowed : [allowed];
  if (!methods.includes(req.method)) {
    return NextResponse.json(
      { error: `Method ${req.method} not allowed` },
      { status: 405, headers: { Allow: methods.join(", ") } }
    );
  }
  return null;
}
