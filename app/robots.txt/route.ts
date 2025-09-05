import { NextResponse } from "next/server";

export function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const body = `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml`;
  return new NextResponse(body, {
    headers: { "Content-Type": "text/plain" },
  });
}
