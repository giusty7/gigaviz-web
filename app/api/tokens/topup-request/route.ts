import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace } from "@/lib/auth/guard";
import { createTopupRequest } from "@/lib/tokens";
import { recordAuditEvent } from "@/lib/audit";
import { emitTopupRequested } from "@/lib/notifications/emit-rules";

const schema = z.object({
  workspaceId: z.string().min(1),
  packageKey: z.string().min(1),
  tokens: z.number().int().min(1),
  notes: z.string().max(2000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const workspaceIdParam = req.nextUrl.searchParams.get("workspaceId") || undefined;
  const guard = await guardWorkspace(req, { workspaceId: workspaceIdParam });
  if (!guard.ok) return guard.response;
  const { workspaceId, user, withCookies } = guard;

  const parsed = schema.safeParse(guard.body ?? {});
  if (!parsed.success) {
    return withCookies(
      NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 })
    );
  }

  if (parsed.data.workspaceId !== workspaceId) {
    return withCookies(NextResponse.json({ error: "workspace_mismatch" }, { status: 400 }));
  }

  const request = await createTopupRequest({
    workspaceId,
    userId: user.id,
    packageKey: parsed.data.packageKey,
    tokens: parsed.data.tokens,
    notes: parsed.data.notes ?? null,
  });

  await recordAuditEvent({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email ?? undefined,
    action: "tokens.topup_requested",
    meta: { requestId: request.id, packageKey: parsed.data.packageKey, tokens: parsed.data.tokens },
  });

  // Emit notification to workspace admins
  await emitTopupRequested(
    { workspaceId },
    {
      requestId: request.id,
      tokens: parsed.data.tokens,
      packageKey: parsed.data.packageKey,
      requestedBy: user.id,
    }
  );

  return withCookies(NextResponse.json({ request }));
}
