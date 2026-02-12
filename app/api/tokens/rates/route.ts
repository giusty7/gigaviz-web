import { NextRequest, NextResponse } from "next/server";
import { tokenRateList } from "@/lib/tokenRates";
import { guardWorkspace } from "@/lib/auth/guard";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { withCookies } = guard;

  return withCookies(NextResponse.json({ actions: tokenRateList }));
});
