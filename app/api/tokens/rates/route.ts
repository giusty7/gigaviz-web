import { NextRequest, NextResponse } from "next/server";
import { tokenRateList } from "@/lib/tokenRates";
import { guardWorkspace } from "@/lib/auth/guard";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { withCookies } = guard;

  return withCookies(NextResponse.json({ actions: tokenRateList }));
}
