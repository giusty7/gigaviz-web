import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies } = guard;

  const bodySchema = z.object({
    threadId: z.string().uuid(),
  });

  const parsed = bodySchema.safeParse(guard.body);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", reason: "invalid_payload" },
        { status: 400 }
      )
    );
  }

  const { threadId } = parsed.data;

  const db = supabaseAdmin();
  await db
    .from("wa_threads")
    .update({ unread_count: 0, updated_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("id", threadId);

  return withCookies(NextResponse.json({ ok: true }));
});
