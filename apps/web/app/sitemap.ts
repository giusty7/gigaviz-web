import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/about", "/services", "/pricing", "/faq", "/contact"];
  const now = new Date();
  return pages.map((p) => ({
    url: new URL(p, siteUrl).toString(),
    lastModified: now,
    changeFrequency: p === "/" ? "daily" : "weekly",
    priority: p === "/" ? 1 : 0.7,
  }));
}
