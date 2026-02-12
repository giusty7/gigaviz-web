import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { WORKSPACE_COOKIE } from "@/lib/workspaces";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const res = NextResponse.json({ ok: true });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.signOut();

  res.cookies.set(WORKSPACE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
});
