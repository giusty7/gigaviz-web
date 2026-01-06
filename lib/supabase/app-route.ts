import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

type CookieOptions = Parameters<NextResponse["cookies"]["set"]>[2];

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export function createSupabaseRouteClient(req: NextRequest) {
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
