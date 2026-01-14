import { NextRequest, NextResponse } from "next/server";
import { guardWorkspace } from "@/lib/auth/guard";
import { listTokenLedger } from "@/lib/tokens";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const workspaceIdParam = searchParams.get("workspaceId") || undefined;
  const guard = await guardWorkspace(req, { workspaceId: workspaceIdParam });
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies } = guard;

  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("pageSize") || "20");
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const ledger = await listTokenLedger(workspaceId, {
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 20,
    type: type || null,
    status: status || null,
    from: from || null,
    to: to || null,
  });

  return withCookies(NextResponse.json({ ledger }));
}
