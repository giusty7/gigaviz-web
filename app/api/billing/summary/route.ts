import { NextRequest, NextResponse } from "next/server";
import { guardWorkspace } from "@/lib/auth/guard";
import { getBillingSummary } from "@/lib/billing/summary";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies } = guard;

  const summary = await getBillingSummary(workspaceId);
  return withCookies(NextResponse.json({ ok: true, summary }));
});
