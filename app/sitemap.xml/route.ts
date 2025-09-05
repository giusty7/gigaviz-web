import { NextResponse } from "next/server";

const paths = ["/", "/about", "/services", "/pricing", "/faq", "/contact"];

export function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const urls = paths.map((p) => `<url><loc>${base}${p}</loc></url>`).join("");
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
  return new NextResponse(body, {
    headers: { "Content-Type": "application/xml" },
  });
}
