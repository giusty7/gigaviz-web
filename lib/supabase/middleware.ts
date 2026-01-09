import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { parseAdminEmails } from "@/lib/admin";

function buildNextParam(request: NextRequest) {
  const next = request.nextUrl.pathname + request.nextUrl.search;
  return encodeURIComponent(next);
}

export async function withSupabaseAuth(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const nextParam = request.nextUrl.searchParams.get("next");
  const nextSafe = nextParam && nextParam.startsWith("/") ? nextParam : "/app";

  const isInvitePath = pathname === "/invite" || pathname.startsWith("/invite/");
  const isAuthPath = pathname.startsWith("/auth/");
  const isAuthApiPath = pathname.startsWith("/api/auth/");
  const isInviteAcceptApi = pathname === "/api/invites/accept";
  const isWorkspaceInviteApi = /^\/api\/workspaces\/[^/]+\/invites$/.test(pathname);

  if (
    isInvitePath ||
    isAuthPath ||
    isAuthApiPath ||
    isInviteAcceptApi ||
    isWorkspaceInviteApi
  ) {
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  type CookieOptions = Parameters<NextResponse["cookies"]["set"]>[2];

  // Buffer cookies dari Supabase supaya tetap kepasang walau response-nya redirect
  const cookiesToSet: Array<{
    name: string;
    value: string;
    options: CookieOptions;
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

  // Paths
  const isLoginPath =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/verify-email" ||
    pathname === "/forgot-password";
  const isResetPasswordPath = pathname === "/reset-password";
  const isOnboardingPath = pathname === "/app/onboarding";
  const isAppPath = pathname === "/app" || pathname.startsWith("/app/");
  const isAdminPath = pathname.startsWith("/admin");
  const isAdminApiPath = pathname.startsWith("/api/admin");
  const isInboxPath = pathname.startsWith("/admin/inbox");
  const isInboxApiPath = pathname.startsWith("/api/admin/inbox");
  const isInboxRelatedApi =
    pathname === "/api/admin/teams" ||
    pathname === "/api/admin/attachments/sign" ||
    pathname.startsWith("/api/admin/crm/contacts/");

  // Extract workspace slug from /app/:workspaceSlug/* paths
  const workspaceSlugMatch = pathname.match(/^\/app\/([^\/]+)/);
  const workspaceSlug = workspaceSlugMatch ? workspaceSlugMatch[1] : null;

  // Helper bikin response + apply cookie buffer + workspace cookie
  const applyCookies = (res: NextResponse) => {
    cookiesToSet.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, options)
    );
    // Set workspace cookie if on /app/:workspaceSlug/* (but not /app/onboarding)
    if (workspaceSlug && workspaceSlug !== "onboarding") {
      res.cookies.set("gv_workspace_slug", workspaceSlug, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return res;
  };

  const makeNext = () => applyCookies(NextResponse.next({ request }));

  const makeRedirect = (to: string) =>
    applyCookies(NextResponse.redirect(new URL(to, request.url)));

  // Admin check (email whitelist)
  const adminEmails = parseAdminEmails();
  const email = (user?.email || "").toLowerCase();
  const isVerified = Boolean(user?.email_confirmed_at || user?.confirmed_at);
  const verifyEmailUrl = email
    ? `/verify-email?email=${encodeURIComponent(email)}`
    : "/verify-email";

  // kalau ADMIN_EMAILS kosong -> anggap semua user yg login boleh admin (MVP)
  const isAdmin = adminEmails.length === 0 ? true : adminEmails.includes(email);

  /**
   * 1) /login behavior
   * - Jika sudah login -> lempar ke /app
   * - Jika belum login -> allow buka /login (jangan redirect balik)
   */
  if (isLoginPath) {
    if (user) {
      if (!isVerified && pathname !== "/verify-email") {
        return makeRedirect(verifyEmailUrl);
      }
      if (isVerified) {
        return makeRedirect(nextSafe);
      }
    }
    return makeNext();
  }

  if (isResetPasswordPath) {
    return makeNext();
  }

  /**
   * 1b) /app/onboarding behavior (authed-only)
   */
  if (isOnboardingPath) {
    if (!user) {
      const next = buildNextParam(request);
      return makeRedirect(`/login?next=${next}`);
    }
    if (!isVerified) {
      return makeRedirect(verifyEmailUrl);
    }
    return makeNext();
  }

  /**
   * 1c) /app behavior (authed-only)
   */
  if (isAppPath) {
    if (!user) {
      const next = buildNextParam(request);
      return makeRedirect(`/login?next=${next}`);
    }
    if (!isVerified) {
      return makeRedirect(verifyEmailUrl);
    }
    return makeNext();
  }

  /**
   * 2) Protect /admin/* dan /api/admin/*
   * - Belum login -> redirect /login?next=...
   * - Sudah login tapi bukan admin -> /login?error=not_admin
   */
  if (isAdminPath || isAdminApiPath) {
    if (!user) {
      const next = buildNextParam(request);
      return makeRedirect(`/login?next=${next}`);
    }
    if (!isAdmin && !(isInboxPath || isInboxApiPath || isInboxRelatedApi)) {
      return makeRedirect("/login?error=not_admin");
    }
  }

  return makeNext();
}
