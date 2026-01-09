import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import crypto from "node:crypto";

const DEV = process.env.NODE_ENV === "development";

type PostgrestError = { message?: string; code?: string };
type WorkspaceInvite = {
  id: string;
  workspace_id: string;
  email: string | null;
  role: string;
  expires_at: string | null;
  accepted_at: string | null;
  revoked_at: string | null;
  workspaces?:
    | { id: string; slug: string | null }
    | { id: string; slug: string | null }[]
    | null;
};

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function normalizeEmail(input: string | null | undefined) {
  return (input || "").trim().toLowerCase();
}

function isMissingColumn(error: PostgrestError | null | undefined, column: string) {
  if (!error) return false;
  if (error.code === "PGRST204") return true;
  const message = (error.message || "").toLowerCase();
  return message.includes("column") && message.includes(column);
}

async function lookupInvite(token: string) {
  const db = supabaseAdmin();
  const select =
    "id, workspace_id, email, role, expires_at, accepted_at, revoked_at, workspaces:workspaces(id, slug)";
  const tokenHash = sha256Hex(token);

  let invite: WorkspaceInvite | null = null;
  let lookup: "token_hash" | "token" = "token_hash";

  const hashRes = await db
    .from("workspace_invites")
    .select(select)
    .eq("token_hash", tokenHash)
    .maybeSingle();

  const hashMissing = isMissingColumn(hashRes.error, "token_hash");

  if (hashRes.error) {
    if (DEV) {
      console.warn("[invite-accept] token_hash lookup failed", {
        error: hashRes.error.message,
        code: hashRes.error.code ?? null,
        missingColumn: hashMissing,
      });
    }
    if (!hashMissing) {
      return { errorResponse: NextResponse.json({ error: "db_error" }, { status: 500 }) };
    }
  }
  if (hashRes.data) {
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
        console.warn("[invite-accept] token lookup failed", {
          error: tokenRes.error.message,
          code: tokenRes.error.code ?? null,
          missingColumn: tokenMissing,
        });
      }
      if (tokenMissing) {
        return { errorResponse: NextResponse.json({ error: "invite_not_found" }, { status: 404 }) };
      }
      return { errorResponse: NextResponse.json({ error: "db_error" }, { status: 500 }) };
    }

    if (tokenRes.data) {
      invite = tokenRes.data;
      lookup = "token";
    }
  }

  if (!invite) {
    if (DEV) {
      console.info("[invite-accept] invite not found");
    }
    return { errorResponse: NextResponse.json({ error: "invite_not_found" }, { status: 404 }) };
  }

  if (invite.revoked_at) {
    return { errorResponse: NextResponse.json({ error: "invite_revoked" }, { status: 404 }) };
  }

  if (invite.expires_at) {
    const expiresAt = new Date(invite.expires_at).getTime();
    if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
      return { errorResponse: NextResponse.json({ error: "invite_expired" }, { status: 404 }) };
    }
  }

  return { invite, lookup };
}

export async function GET(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) {
    return withCookies(NextResponse.json({ error: "unauthorized" }, { status: 401 }));
  }

  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return withCookies(NextResponse.json({ error: "token_required" }, { status: 400 }));
  }

  const { invite, errorResponse } = await lookupInvite(token);
  if (errorResponse) return withCookies(errorResponse);
  if (!invite) return withCookies(NextResponse.json({ error: "invite_not_found" }, { status: 404 }));

  const invitedEmail = normalizeEmail(invite.email);
  const userEmail = normalizeEmail(user.email);

  if (invitedEmail !== userEmail) {
    return withCookies(
      NextResponse.json(
        { error: "email_mismatch", invited_email: invite.email, user_email: user.email },
        { status: 403 }
      )
    );
  }

  const workspaceSlug = Array.isArray(invite.workspaces)
    ? invite.workspaces[0]?.slug ?? null
    : invite.workspaces?.slug ?? null;

  return withCookies(
    NextResponse.json({
      invite: {
        email: invite.email,
        workspaceSlug,
      },
      user_email: user.email,
    })
  );
}

export async function POST(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) {
    if (DEV) {
      console.warn("[invite-accept] unauthorized", userErr?.message);
    }
    return withCookies(
      NextResponse.json({ error: "unauthorized" }, { status: 401 })
    );
  }

  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : null;
  if (!token) {
    return withCookies(
      NextResponse.json({ error: "token_required" }, { status: 400 })
    );
  }

  if (!(user.email && (user.email_confirmed_at || user.confirmed_at))) {
    return withCookies(
      NextResponse.json({ error: "email_not_verified" }, { status: 403 })
    );
  }

  const db = supabaseAdmin();
  const { invite, errorResponse, lookup } = await lookupInvite(token);
  if (errorResponse) return withCookies(errorResponse);
  if (!invite) return withCookies(NextResponse.json({ error: "invite_not_found" }, { status: 404 }));

  const workspaceSlug = Array.isArray(invite.workspaces)
    ? invite.workspaces[0]?.slug ?? null
    : invite.workspaces?.slug ?? null;

  if (invite.accepted_at) {
    return withCookies(
      NextResponse.json(
        { error: "invite_already_accepted", workspaceSlug },
        { status: 409 }
      )
    );
  }

  const invitedEmail = normalizeEmail(invite.email);
  const userEmail = normalizeEmail(user.email);

  if (invitedEmail !== userEmail) {
    return withCookies(
      NextResponse.json(
        { error: "email_mismatch", invited_email: invite.email, user_email: user.email },
        { status: 403 }
      )
    );
  }

  const { data: existingMember, error: memberErr } = await db
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", invite.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberErr) {
    if (DEV) {
      console.warn("[invite-accept] membership lookup failed", {
        error: memberErr.message,
        code: memberErr.code ?? null,
      });
    }
    return withCookies(NextResponse.json({ error: "db_error" }, { status: 500 }));
  }

  if (existingMember) {
    await db
      .from("workspace_invites")
      .update({
        accepted_at: new Date().toISOString(),
        accepted_by: user.id,
      })
      .eq("id", invite.id)
      .is("accepted_at", null);

    return withCookies(
      NextResponse.json(
        { error: "member_already_exists", workspaceSlug },
        { status: 409 }
      )
    );
  }

  const upsertRes = await db.from("workspace_members").upsert(
    [
      {
        workspace_id: invite.workspace_id,
        user_id: user.id,
        role: invite.role,
      },
    ],
    { onConflict: "workspace_id,user_id" }
  );

  if (upsertRes.error) {
    if (DEV) {
      console.warn("[invite-accept] membership upsert failed", {
        error: upsertRes.error.message,
        code: upsertRes.error.code ?? null,
      });
    }
    return withCookies(
      NextResponse.json({ error: "upsert_failed" }, { status: 500 })
    );
  }

  const { error: markErr } = await db
    .from("workspace_invites")
    .update({ accepted_at: new Date().toISOString(), accepted_by: user.id })
    .eq("id", invite.id)
    .is("accepted_at", null);

  if (markErr && DEV) {
    console.warn("[invite-accept] failed marking invite accepted", {
      error: markErr.message,
      code: markErr.code ?? null,
    });
  }

  if (DEV) {
    console.log("[invite-accept] invite accepted", { workspaceSlug, lookup });
  }

  return withCookies(NextResponse.json({ workspaceSlug }));
}
