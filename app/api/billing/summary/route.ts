import { NextRequest, NextResponse } from "next/server";
import { guardWorkspace } from "@/lib/auth/guard";
import { getBillingSummary } from "@/lib/billing/summary";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies } = guard;

  const summary = await getBillingSummary(workspaceId);
  return withCookies(NextResponse.json({ ok: true, summary }));
}
