import { NextRequest, NextResponse } from "next/server";
import { guardWorkspace } from "@/lib/auth/guard";
import { getWallet } from "@/lib/tokens";

export async function GET(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies } = guard;
  const wallet = await getWallet(workspaceId);
  return withCookies(NextResponse.json({ wallet }));
}
