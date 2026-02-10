import type { MetadataRoute } from "next";
import { products } from "@/lib/products";
import { policySlugs } from "@/lib/policies";
import { getPublishedPosts } from "@/lib/blog";

/** Helper to add hreflang alternates for multi-locale support */
function withAlternates(path: string, baseUrl: string) {
  return {
    languages: {
      en: `${baseUrl}${path}`,
      id: `${baseUrl}/id${path}`,
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://gigaviz.com";
  const now = new Date();
  const posts = await getPublishedPosts();

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      alternates: withAlternates("", baseUrl),
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: withAlternates("/about", baseUrl),
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
      alternates: withAlternates("/blog", baseUrl),
    },
    {
      url: `${baseUrl}/status`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: withAlternates("/status", baseUrl),
    },
    {
      url: `${baseUrl}/media-kit`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: withAlternates("/media-kit", baseUrl),
    },
    {
      url: `${baseUrl}/products`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: withAlternates("/products", baseUrl),
    },
    {
      url: `${baseUrl}/roadmap`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: withAlternates("/roadmap", baseUrl),
    },
    {
      url: `${baseUrl}/policies`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: withAlternates("/policies", baseUrl),
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: withAlternates("/pricing", baseUrl),
    },
    {
      url: `${baseUrl}/get-started`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: withAlternates("/get-started", baseUrl),
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/changelog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
      alternates: withAlternates("/changelog", baseUrl),
    },
    {
      url: `${baseUrl}/trust`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: withAlternates("/trust", baseUrl),
    },
    {
      url: `${baseUrl}/integrations`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: withAlternates("/integrations", baseUrl),
    },
    ...products.map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: withAlternates(`/products/${product.slug}`, baseUrl),
    })),
    ...posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
      alternates: withAlternates(`/blog/${post.slug}`, baseUrl),
    })),
    ...policySlugs.map((slug) => ({
      url: `${baseUrl}/policies/${slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.4,
      alternates: withAlternates(`/policies/${slug}`, baseUrl),
    })),
  ];
}
