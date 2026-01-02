import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type CookieOptions = Parameters<NextResponse["cookies"]["set"]>[2];

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

type WorkspaceMemberRow = {
  workspace_id: string;
  role: string;
};

function createSupabaseRouteClient(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const cookiesToSet: CookieToSet[] = [];

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookies) {
        cookies.forEach((c) => cookiesToSet.push(c));
      },
    },
  });

  const withCookies = (res: NextResponse) => {
    cookiesToSet.forEach(({ name, value, options }) => {
      res.cookies.set(name, value, options);
    });
    return res;
  };

  return { supabase, withCookies };
}

export async function requireWorkspaceRole(req: NextRequest, allowedRoles: string[]) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userErr || !user) {
    return {
      ok: false as const,
      res: withCookies(NextResponse.json({ error: "unauthorized" }, { status: 401 })),
    };
  }

  const db = supabaseAdmin();
  const { data: wm } = await db
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  const member = wm as WorkspaceMemberRow | null;
  const workspaceId = member?.workspace_id || null;
  const role = member?.role || null;

  if (!workspaceId || !role) {
    return {
      ok: false as const,
      res: withCookies(NextResponse.json({ error: "no_workspace" }, { status: 403 })),
    };
  }

  if (!allowedRoles.includes(role)) {
    return {
      ok: false as const,
      res: withCookies(NextResponse.json({ error: "forbidden" }, { status: 403 })),
    };
  }

  return {
    ok: true as const,
    supabase,
    db,
    withCookies,
    user,
    workspaceId,
    role,
  };
}
