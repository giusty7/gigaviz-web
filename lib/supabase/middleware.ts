import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function parseAdminEmails() {
  const raw =
    process.env.ADMIN_EMAILS ||
    process.env.ADMIN_EMAIL || // optional fallback
    "";

  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function withSupabaseAuth(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Buffer cookies dari Supabase supaya tetap kepasang walau response-nya redirect
  const cookiesToSet: Array<{
    name: string;
    value: string;
    options: any;
  }> = [];

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookies.forEach((c) => cookiesToSet.push(c));
      },
    },
  });

  // penting: trigger refresh session jika perlu
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search; // keep query
  const isAdminPath = pathname.startsWith("/admin");
  const isLoginPath = pathname.startsWith("/login");

  // Helper bikin response + apply cookie buffer
  const makeNext = () => {
    const res = NextResponse.next({ request });
    cookiesToSet.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, options)
    );
    return res;
  };

  const makeRedirect = (to: string) => {
    const res = NextResponse.redirect(new URL(to, request.url));
    cookiesToSet.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, options)
    );
    return res;
  };

  const adminEmails = parseAdminEmails();
  const email = (user?.email || "").toLowerCase();
  const isAdmin = adminEmails.length === 0 ? true : adminEmails.includes(email);

  // kalau sudah login, jangan balik ke /login
  if (isLoginPath && user) {
    if (isAdmin) return makeRedirect("/admin/leads");
    return makeRedirect("/login?error=not_admin");
  }

  // protect /admin/*
  if (isAdminPath) {
    if (!user) {
      const next = encodeURIComponent(pathname + search);
      return makeRedirect(`/login?next=${next}`);
    }

    if (!isAdmin) {
      return makeRedirect("/login?error=not_admin");
    }
  }

  return makeNext();
}
