import { NextRequest, NextResponse } from "next/server";
import { guardWorkspace } from "@/lib/auth/guard";
import { getTokenOverview, getTokenSettings } from "@/lib/tokens";

export async function GET(req: NextRequest) {
  const month = req.nextUrl.searchParams.get("month") || undefined;
  const workspaceIdParam = req.nextUrl.searchParams.get("workspaceId") || undefined;
  const guard = await guardWorkspace(req, { workspaceId: workspaceIdParam });
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies } = guard;

  const overview = await getTokenOverview(workspaceId, month);
  const settings = await getTokenSettings(workspaceId);

  return withCookies(NextResponse.json({ overview, settings }));
}
