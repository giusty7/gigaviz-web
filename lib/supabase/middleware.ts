import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function parseAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function withSupabaseAuth(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // update response cookies
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const pathname = request.nextUrl.pathname;
  const isAdminPath = pathname.startsWith("/admin");
  const isLoginPath = pathname.startsWith("/login");

  // kalau sudah login, jangan balik ke /login
  if (isLoginPath && user) {
    const adminEmails = parseAdminEmails();
    const email = (user.email || "").toLowerCase();
    if (adminEmails.length === 0 || adminEmails.includes(email)) {
      return NextResponse.redirect(new URL("/admin/leads", request.url));
    }
  }

  // protect /admin/*
  if (isAdminPath) {
    if (!user) {
      const next = encodeURIComponent(pathname);
      return NextResponse.redirect(new URL(`/login?next=${next}`, request.url));
    }

    // allowlist admin email
    const adminEmails = parseAdminEmails();
    const email = (user.email || "").toLowerCase();
    if (adminEmails.length > 0 && !adminEmails.includes(email)) {
      return NextResponse.redirect(new URL("/login?error=not_admin", request.url));
    }
  }

  return response;
}
