import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Lindungi hanya /admin kecuali halaman login
  if (!pathname.startsWith("/admin") || pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const token = process.env.ADMIN_TOKEN || "";
  const authHeader = req.headers.get("authorization") || "";
  const cookieToken = req.cookies.get("admin")?.value || "";

  const ok =
    (!!token && authHeader === `Bearer ${token}`) ||
    (!!token && cookieToken === token);

  if (ok) return NextResponse.next();

  // Belum login → redirect ke /admin/login
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
