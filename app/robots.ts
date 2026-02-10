import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/login",
        "/register",
        "/verify-email",
        "/forgot-password",
        "/reset-password",
        "/onboarding",
        "/app/onboarding",
        "/app",
        "/api/*",
        "/admin/*",
        "/dashboard",
        "/owner",
        "/owner/",
        "/ops",
        "/ops/",
      ],
    },
    sitemap: "https://gigaviz.com/sitemap.xml",
  };
}
