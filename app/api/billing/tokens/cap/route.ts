import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace, requireWorkspaceRole } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

const schema = z.object({
  cap: z.number().int().min(0).max(1_000_000_000).nullable(),
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, role, withCookies } = guard;

  if (!requireWorkspaceRole(role, ["owner", "admin"])) {
    return withCookies(
      NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
    );
  }

  const body = guard.body ?? await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", reason: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { cap } = parsed.data;
  // token_wallets may need service-role for write access
  const adminDb = supabaseAdmin();
  const { error } = await adminDb
    .from("token_wallets")
    .update({ monthly_cap: cap, updated_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId);

  if (error) {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "cap_update_failed", message: error.message },
        { status: 500 }
      )
    );
  }

  return withCookies(NextResponse.json({ ok: true, cap }));
});
