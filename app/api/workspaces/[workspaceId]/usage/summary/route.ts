import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceUsageSummary } from "@/lib/usage/server";
import { guardWorkspace } from "@/lib/auth/guard";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ workspaceId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const params = await ctx.params;
  const guard = await guardWorkspace(req, params);
  if (!guard.ok) return guard.response;
  const { withCookies, workspaceId } = guard;

  const summary = await getWorkspaceUsageSummary(workspaceId);
  return withCookies(NextResponse.json(summary));
}
