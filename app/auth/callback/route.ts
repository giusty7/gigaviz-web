import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

function getSafeNext(nextParam: string | null) {
  if (!nextParam) return "/app";
  return nextParam.startsWith("/") ? nextParam : "/app";
}

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNext(requestUrl.searchParams.get("next"));

  let response = NextResponse.redirect(new URL(next, requestUrl.origin));

  if (!code) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
    );
  }

  return response;
}
