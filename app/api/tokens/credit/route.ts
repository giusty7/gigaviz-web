import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { ensureProfile } from "@/lib/profiles";
import { getUserWorkspaces } from "@/lib/workspaces";
import { creditTokens } from "@/lib/tokens";
import { rateLimit } from "@/lib/rate-limit";

const creditSchema = z.object({
  workspace_id: z.string().uuid("workspace_id must be a valid UUID"),
  amount: z.number().positive("amount must be a positive number"),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userErr || !user) {
    return withCookies(
      NextResponse.json({ error: "unauthorized" }, { status: 401 })
    );
  }

  const profile = await ensureProfile(user);
  if (!profile.is_admin) {
    return withCookies(
      NextResponse.json({ error: "forbidden" }, { status: 403 })
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`token-credit:${user.id}:${ip}`, {
    windowMs: 60_000,
    max: 10,
  });

  if (!limit.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limit.resetAt }, { status: 429 })
    );
  }

  const raw = await req.json().catch(() => null);
  const parsed = creditSchema.safeParse(raw);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "invalid_request", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    );
  }
  const { workspace_id: workspaceId, amount, note } = parsed.data;

  const workspaces = await getUserWorkspaces(user.id);
  const allowed = workspaces.some((ws) => ws.id === workspaceId);
  if (!allowed) {
    return withCookies(
      NextResponse.json({ error: "forbidden" }, { status: 403 })
    );
  }

  try {
    const balance = await creditTokens(
      workspaceId,
      amount,
      "admin_credit",
      note,
      user.id
    );
    return withCookies(NextResponse.json({ balance }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "token_error";
    return withCookies(
      NextResponse.json({ error: message }, { status: 400 })
    );
  }
}
