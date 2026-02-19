import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { assertOpsEnabled } from "@/lib/ops/guard";
import { moderateItem } from "@/lib/marketplace";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const schema = z.object({
  itemId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(1000).optional(),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  assertOpsEnabled();
  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const validated = schema.parse(body);

  const success = await moderateItem(
    validated.itemId,
    validated.action,
    validated.reason
  );

  if (!success) {
    logger.error("Ops marketplace moderation failed", {
      actor: admin.actorEmail,
      ...validated,
    });
    return NextResponse.json(
      { error: "Failed to moderate item" },
      { status: 500 }
    );
  }

  logger.info("Ops marketplace item moderated", {
    actor: admin.actorEmail,
    itemId: validated.itemId,
    action: validated.action,
    reason: validated.reason,
  });

  return NextResponse.json({ success: true, action: validated.action });
});
