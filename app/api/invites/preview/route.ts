import { logger } from "@/lib/logging";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import crypto from "node:crypto";
import { withErrorHandler } from "@/lib/api/with-error-handler";

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

function maskEmail(email: string | null | undefined) {
  if (!email) return "";
  const [user, domain] = email.split("@");
  if (!domain) return email;
  if (user.length <= 2) return `${user[0] ?? "*"}***@${domain}`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
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
      logger.warn("[invite-preview] token_hash lookup failed", {
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
        logger.warn("[invite-preview] token lookup failed", {
          error: tokenRes.error.message,
          code: tokenRes.error.code ?? null,
          missingColumn: tokenMissing,
        });
      }
      if (!tokenMissing) {
        return { errorResponse: NextResponse.json({ status: "error" }, { status: 500 }) };
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
      logger.warn("[invite-preview] listUsers failed", error.message);
    }
    return false;
  }
  return (data?.users ?? []).some((user) => user.email?.toLowerCase() === email.toLowerCase());
}

export const GET = withErrorHandler(async (req: Request) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `invite-preview:${ip}`;
  const limit = rateLimit(key, { windowMs: 60_000, max: 30 });
  if (!limit.ok) {
    return NextResponse.json(
      { status: "rate_limited", resetAt: limit.resetAt },
      { status: 429 }
    );
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token")?.trim() || "";
  if (!token) {
    return NextResponse.json({ status: "token_required" }, { status: 400 });
  }

  const { invite, errorResponse } = await lookupInvite(token);
  if (errorResponse) return errorResponse;
  if (!invite) {
    return NextResponse.json({ status: "not_found" }, { status: 404 });
  }

  if (invite.revoked_at) {
    return NextResponse.json({ status: "revoked" }, { status: 404 });
  }

  if (invite.accepted_at) {
    return NextResponse.json({ status: "used" }, { status: 409 });
  }

  const { expired } = computeExpiry(invite);
  if (expired) {
    return NextResponse.json({ status: "expired" }, { status: 410 });
  }

  const workspace =
    Array.isArray(invite.workspaces) && invite.workspaces.length > 0
      ? invite.workspaces[0]
      : invite.workspaces;
  const emailMasked = maskEmail(invite.email);
  const exists = await accountExists(invite.email);

  return NextResponse.json({
    status: exists ? "account_exists" : "valid",
    workspaceName: (workspace as { name?: string | null } | null | undefined)?.name ?? "",
    workspaceSlug: (workspace as { slug?: string | null } | null | undefined)?.slug ?? null,
    emailMasked,
  });
});
