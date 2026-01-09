import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { sendWorkspaceInviteEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { guardWorkspace, forbiddenResponse } from "@/lib/auth/guard";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

type Ctx =
  | { params: Promise<{ workspaceId: string }> }
  | { params: { workspaceId: string } };

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function POST(req: NextRequest, context: Ctx) {
  const params = await Promise.resolve(context.params);
  const guard = await guardWorkspace(req, params);
  if (!guard.ok) return guard.response;
  const { user, withCookies, workspaceId } = guard;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`workspace-invite:${workspaceId}:${user.id}:${ip}`, {
    windowMs: 60_000,
    max: 20,
  });
  if (!limit.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", reason: "rate_limited", resetAt: limit.resetAt }, { status: 429 })
    );
  }

  // Body
  const body = await req.json().catch(() => null);
  const rawEmail = typeof body?.email === "string" ? body.email.trim() : null;
  const email = rawEmail ? rawEmail.toLowerCase() : null;
  const role = body?.role === "admin" ? "admin" : "member";

  if (!email) {
    return withCookies(
      NextResponse.json({ error: "invalid_email" }, { status: 400 })
    );
  }

  const db = supabaseAdmin();
  const { data: memberRow, error: memberErr } = await db
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberErr || !memberRow || !(memberRow.role === "owner" || memberRow.role === "admin")) {
    return forbiddenResponse(withCookies);
  }

  const { data: wsRow, error: wsErr } = await db
    .from("workspaces")
    .select("id, name")
    .eq("id", workspaceId)
    .maybeSingle();

  if (wsErr || !wsRow) {
    return withCookies(
      NextResponse.json({ error: "workspace_not_found", reason: "workspace_required" }, { status: 404 })
    );
  }

  // Generate token + token_hash (DB requires token_hash NOT NULL)
  const token = crypto.randomBytes(32).toString("base64url");
  const token_hash = sha256Hex(token);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const inviteRow = {
    workspace_id: workspaceId,
    email,
    role,
    token,
    token_hash,
    invited_by: user.id,
    expires_at: expiresAt,
  } as const;

  const { data: invite, error: insertErr } = await db
    .from("workspace_invites")
    .insert(inviteRow)
    .select(
      // Do not return token/token_hash to client
      "id, workspace_id, email, role, invited_by, created_at, expires_at, accepted_at, accepted_by, revoked_at"
    )
    .maybeSingle();

  if (insertErr) {
    const code = insertErr.code ?? null;

    // 23505 = unique_violation (active invite already exists)
    if (code === "23505") {
      return withCookies(
        NextResponse.json({ error: "invite_already_exists" }, { status: 409 })
      );
    }

    if (process.env.NODE_ENV === "development") {
      console.warn("[invite] insert failed", {
        message: insertErr.message,
        code,
        details: insertErr.details ?? null,
      });
    }

    return withCookies(
      NextResponse.json({ error: "db_error" }, { status: 500 })
    );
  }

  // Send email (accept link uses raw token)
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const acceptUrl = `${origin}/invite/${token}`;

  try {
    const workspaceName = (wsRow as { name?: string }).name ?? "";
    await sendWorkspaceInviteEmail({
      to: email,
      workspaceName,
      inviterEmail: user.email ?? "",
      acceptUrl,
    });

    if (process.env.NODE_ENV === "development") {
      console.log(`[invite] Email sent to ${email}`);
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[invite] Email send failed", { error: String(err) });
    }
    // Even if email fails, invite already exists in DB so return success
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[invite] Invite created email=${email} token=${token.slice(0, 8)}...`
    );
  }

  return withCookies(NextResponse.json({ invite }, { status: 201 }));
}
