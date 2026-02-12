import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setImpersonationCookie, clearImpersonationCookie } from "@/lib/impersonation/context";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { assertOpsEnabled } from "@/lib/ops/guard";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const setCookieSchema = z.object({
  impersonationId: z.string().uuid(),
});

/**
 * POST /api/ops/impersonate/cookie
 * Set impersonation cookie (called after starting impersonation)
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  assertOpsEnabled();

  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = setCookieSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await setImpersonationCookie(parsed.data.impersonationId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("[ops] Set impersonation cookie error:", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "internal_error" },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/ops/impersonate/cookie
 * Clear impersonation cookie
 */
export const DELETE = withErrorHandler(async () => {
  assertOpsEnabled();

  try {
    await clearImpersonationCookie();
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("[ops] Clear impersonation cookie error:", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "internal_error" },
      { status: 500 }
    );
  }
});
