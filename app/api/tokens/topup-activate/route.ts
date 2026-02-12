import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace } from "@/lib/auth/guard";
import { activateTopupRequest } from "@/lib/tokens";
import { recordAuditEvent } from "@/lib/audit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { emitTopupPosted } from "@/lib/notifications/emit-rules";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const schema = z.object({
  workspaceId: z.string().min(1),
  requestId: z.string().uuid(),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const workspaceIdParam = req.nextUrl.searchParams.get("workspaceId") || undefined;
  const guard = await guardWorkspace(req, { workspaceId: workspaceIdParam });
  if (!guard.ok) return guard.response;
  const { workspaceId, user, role, withCookies } = guard;

  const parsed = schema.safeParse(guard.body ?? {});
  if (!parsed.success) {
    return withCookies(
      NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 })
    );
  }

  if (parsed.data.workspaceId !== workspaceId) {
    return withCookies(NextResponse.json({ error: "workspace_mismatch" }, { status: 400 }));
  }

  if (!role || !["owner", "admin"].includes(role)) {
    return withCookies(
      NextResponse.json({ error: "forbidden", reason: "role_required" }, { status: 403 })
    );
  }

  const db = supabaseAdmin();
  const { data: request } = await db
    .from("token_topup_requests")
    .select("id, status, tokens")
    .eq("workspace_id", workspaceId)
    .eq("id", parsed.data.requestId)
    .maybeSingle();

  if (!request) {
    return withCookies(NextResponse.json({ error: "request_not_found" }, { status: 404 }));
  }

  if (request.status !== "pending") {
    return withCookies(
      NextResponse.json({ error: "invalid_status", status: request.status }, { status: 400 })
    );
  }

  const result = await activateTopupRequest(workspaceId, parsed.data.requestId, user.id);

  await recordAuditEvent({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email ?? undefined,
    action: "tokens.topup_paid",
    meta: { requestId: parsed.data.requestId, tokens: request.tokens, balance: result.balance },
  });

  // Emit notification to all workspace members
  await emitTopupPosted(
    { workspaceId },
    {
      requestId: parsed.data.requestId,
      tokens: request.tokens,
      newBalance: result.balance,
      activatedBy: user.id,
    }
  );

  return withCookies(
    NextResponse.json({ ok: true, status: "paid", balance: result.balance, ledgerId: result.ledger_id })
  );
});
