import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import crypto from "node:crypto";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const claimSchema = z.object({
  token: z.string().trim().min(1, "Token is required"),
  password: z.string().min(1, "Password is required"),
});

const DEV = process.env.NODE_ENV === "development";

type PostgrestError = { message?: string; code?: string };

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function isMissingColumn(error: PostgrestError | null | undefined, column: string) {
  if (!error) return false;
  if (error.code === "PGRST204") return true;
  const message = (error.message || "").toLowerCase();
  return message.includes("column") && message.includes(column);
}

type InviteRow = {
  id: string;
  email: string | null;
  role: string;
  workspace_id: string;
  expires_at: string | null;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at?: string | null;
  workspaces?:
    | { id: string; slug: string | null; name?: string | null }
    | { id: string; slug: string | null; name?: string | null }[]
    | null;
};

async function lookupInvite(token: string) {
  const db = supabaseAdmin();
  const select =
    "id, email, role, workspace_id, expires_at, accepted_at, revoked_at, created_at, workspaces:workspaces(id, slug, name)";
  const tokenHash = sha256Hex(token);

  let invite: InviteRow | null = null;

  const hashRes = await db
    .from("workspace_invites")
    .select(select)
    .eq("token_hash", tokenHash)
    .maybeSingle();

  const hashMissing = isMissingColumn(hashRes.error, "token_hash");

  if (hashRes.error) {
    if (DEV) {
      logger.warn("[invite-claim] token_hash lookup failed", {
        error: hashRes.error.message,
        code: hashRes.error.code ?? null,
        missingColumn: hashMissing,
      });
    }
  } else if (hashRes.data) {
    invite = hashRes.data;
  }

  if (!invite) {
    const tokenRes = await db
      .from("workspace_invites")
      .select(select)
      .eq("token", token)
      .maybeSingle();

    const tokenMissing = isMissingColumn(tokenRes.error, "token");

    if (tokenRes.error) {
      if (DEV) {
        logger.warn("[invite-claim] token lookup failed", {
          error: tokenRes.error.message,
          code: tokenRes.error.code ?? null,
          missingColumn: tokenMissing,
        });
      }
      if (!tokenMissing) {
        return { errorResponse: NextResponse.json({ error: "db_error" }, { status: 500 }) };
      }
    } else if (tokenRes.data) {
      invite = tokenRes.data;
    }
  }

  return { invite };
}

function computeExpiry(invite: InviteRow | null) {
  if (!invite) return { expired: true };
  const now = Date.now();
  const createdAtMs = invite.created_at ? new Date(invite.created_at).getTime() : NaN;
  const configuredExpires = invite.expires_at ? new Date(invite.expires_at).getTime() : NaN;
  const maxLifetime = createdAtMs ? createdAtMs + 24 * 60 * 60 * 1000 : NaN;
  const candidates = [configuredExpires, maxLifetime].filter((v) => Number.isFinite(v)) as number[];
  if (candidates.length === 0) return { expired: false };
  const expiresAt = Math.min(...candidates);
  return { expired: expiresAt <= now };
}

async function accountExists(email: string | null | undefined) {
  if (!email) return false;
  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) {
    if (DEV) {
      logger.warn("[invite-claim] listUsers failed", error.message);
    }
    return false;
  }
  return (data?.users ?? []).some((user) => user.email?.toLowerCase() === email.toLowerCase());
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const raw = await req.json().catch(() => null);
  const parsed = claimSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { token, password } = parsed.data;

  const limitKey = `invite-claim:${ip}:${sha256Hex(token)}`;
  const limit = rateLimit(limitKey, { windowMs: 60_000, max: 5 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited", resetAt: limit.resetAt },
      { status: 429 }
    );
  }

  const db = supabaseAdmin();
  const { invite, errorResponse } = await lookupInvite(token);
  if (errorResponse) return errorResponse;
  if (!invite) {
    return NextResponse.json({ error: "invite_not_found" }, { status: 404 });
  }

  if (invite.revoked_at) {
    return NextResponse.json({ error: "invite_revoked" }, { status: 404 });
  }

  if (invite.accepted_at) {
    return NextResponse.json({ error: "invite_used" }, { status: 409 });
  }

  const { expired } = computeExpiry(invite);
  if (expired) {
    return NextResponse.json({ error: "invite_expired" }, { status: 410 });
  }

  const inviteEmail = invite.email?.toLowerCase();
  if (!inviteEmail) {
    return NextResponse.json({ error: "invalid_invite_email" }, { status: 400 });
  }

  const exists = await accountExists(inviteEmail);
  if (exists) {
    return NextResponse.json({ error: "account_exists" }, { status: 409 });
  }

  const { data: createData, error: createError } = await db.auth.admin.createUser({
    email: inviteEmail,
    password,
    email_confirm: true,
  });

  if (createError || !createData?.user) {
    if (DEV) {
      logger.warn("[invite-claim] createUser failed", createError?.message ?? "unknown");
    }
    // If conflict slipped through
    if (createError?.message?.toLowerCase().includes("already")) {
      return NextResponse.json({ error: "account_exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }

  const userId = createData.user.id;

  const workspace =
    Array.isArray(invite.workspaces) && invite.workspaces.length > 0
      ? invite.workspaces[0]
      : invite.workspaces;
  const workspaceSlug = (workspace as { slug?: string | null } | null | undefined)?.slug ?? null;

  const { error: memberErr } = await db.from("workspace_members").upsert(
    [
      {
        workspace_id: invite.workspace_id,
        user_id: userId,
        role: invite.role,
      },
    ],
    { onConflict: "workspace_id,user_id" }
  );

  if (memberErr) {
    if (DEV) {
      logger.warn("[invite-claim] membership upsert failed", memberErr.message);
    }
    return NextResponse.json({ error: "membership_failed" }, { status: 500 });
  }

  const { error: markErr } = await db
    .from("workspace_invites")
    .update({ accepted_at: new Date().toISOString(), accepted_by: userId })
    .eq("id", invite.id)
    .is("accepted_at", null);

  if (markErr && DEV) {
    logger.warn("[invite-claim] failed marking invite accepted", markErr.message);
  }

  return NextResponse.json({
    ok: true,
    email: inviteEmail,
    workspaceSlug,
  });
});
