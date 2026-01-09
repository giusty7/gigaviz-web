import { NextRequest, NextResponse } from "next/server";
import { guardWorkspace } from "@/lib/auth/guard";
import { getLedger } from "@/lib/tokens";

export async function GET(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies } = guard;

  const page = Number(req.nextUrl.searchParams.get("page") || "1");
  const ledger = await getLedger(workspaceId, { page, pageSize: 20 });
  return withCookies(NextResponse.json({ ledger }));
}
