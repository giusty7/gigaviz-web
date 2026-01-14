import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace } from "@/lib/auth/guard";
import { upsertTokenSettings } from "@/lib/tokens";

const schema = z.object({
  workspaceId: z.string().min(1),
  monthlyCap: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
  alertThreshold: z.number().int().min(0).max(100).optional(),
  hardCap: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const workspaceIdParam = req.nextUrl.searchParams.get("workspaceId") || undefined;
  const guard = await guardWorkspace(req, { workspaceId: workspaceIdParam });
  if (!guard.ok) return guard.response;
  const { workspaceId, role, withCookies } = guard;

  const parsed = schema.safeParse(guard.body ?? {});
  if (!parsed.success) {
    return withCookies(
      NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 })
    );
  }

  if (!role || !["owner", "admin"].includes(role)) {
    return withCookies(
      NextResponse.json({ error: "forbidden", reason: "role_required" }, { status: 403 })
    );
  }

  if (parsed.data.workspaceId !== workspaceId) {
    return withCookies(
      NextResponse.json({ error: "workspace_mismatch" }, { status: 400 })
    );
  }

  const settings = await upsertTokenSettings(workspaceId, {
    monthly_cap: parsed.data.monthlyCap ?? null,
    alert_threshold: parsed.data.alertThreshold ?? 80,
    hard_cap: parsed.data.hardCap ?? false,
  });

  return withCookies(NextResponse.json({ ok: true, settings }));
}
