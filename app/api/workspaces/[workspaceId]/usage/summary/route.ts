import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceUsageSummary } from "@/lib/usage/server";
import { guardWorkspace } from "@/lib/auth/guard";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ workspaceId: string }> };

export const GET = withErrorHandler(async (req: NextRequest, ctx: Ctx) => {
  const params = await ctx.params;
  const guard = await guardWorkspace(req, params);
  if (!guard.ok) return guard.response;
  const { withCookies, workspaceId } = guard;

  const summary = await getWorkspaceUsageSummary(workspaceId);
  return withCookies(NextResponse.json(summary));
});
