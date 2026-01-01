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

function buildNextParam(pathname: string, search: string) {
  return encodeURIComponent(pathname + (search || ""));
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
  const search = request.nextUrl.search || "";

  // Paths
  const isLoginPath = pathname === "/login";
  const isAdminPath = pathname.startsWith("/admin");
  const isAdminApiPath = pathname.startsWith("/api/admin");

  // Helper bikin response + apply cookie buffer
  const applyCookies = (res: NextResponse) => {
    cookiesToSet.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, options)
    );
    return res;
  };

  const makeNext = () => applyCookies(NextResponse.next({ request }));

  const makeRedirect = (to: string) =>
    applyCookies(NextResponse.redirect(new URL(to, request.url)));

  // Admin check (email whitelist)
  const adminEmails = parseAdminEmails();
  const email = (user?.email || "").toLowerCase();

  // kalau ADMIN_EMAILS kosong -> anggap semua user yg login boleh admin (MVP)
  const isAdmin = adminEmails.length === 0 ? true : adminEmails.includes(email);

  /**
   * 1) /login behavior
   * - Jika sudah login & admin -> lempar ke /admin/inbox (default)
   * - Jika sudah login tapi bukan admin -> tetap di /login?error=not_admin
   * - Jika belum login -> allow buka /login (jangan redirect balik)
   */
  if (isLoginPath) {
    if (user && isAdmin) return makeRedirect("/admin/inbox");
    if (user && !isAdmin) return makeRedirect("/login?error=not_admin");
    return makeNext();
  }

  /**
   * 2) Protect /admin/* dan /api/admin/*
   * - Belum login -> redirect /login?next=...
   * - Sudah login tapi bukan admin -> /login?error=not_admin
   */
  if (isAdminPath || isAdminApiPath) {
    if (!user) {
      const next = buildNextParam(pathname, search);
      return makeRedirect(`/login?next=${next}`);
    }
    if (!isAdmin) {
      return makeRedirect("/login?error=not_admin");
    }
  }

  return makeNext();
}
