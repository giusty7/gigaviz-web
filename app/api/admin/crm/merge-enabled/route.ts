import { NextRequest, NextResponse } from "next/server";
import { requireAdminWorkspace } from "@/lib/supabase/route";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { withCookies } = auth;
  const enabled = process.env.MERGE_ENABLED === "true";
  return withCookies(NextResponse.json({ enabled }));
});
