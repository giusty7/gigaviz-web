import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Metadata } from "next";
import { PublicBioPage } from "@/components/links/PublicBioPage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = supabaseAdmin();
  const { data: page } = await db
    .from("link_pages")
    .select("title, bio, seo_title, seo_description, slug")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!page) return { title: "Not Found" };

  const title = page.seo_title || page.title;
  const description = page.seo_description || page.bio || `${page.title} — powered by Gigaviz Links`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `/l/${page.slug}`,
      images: [{ url: `/l/${page.slug}/opengraph-image`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/l/${page.slug}/opengraph-image`],
    },
  };
}

export default async function PublicLinkPage({ params }: Props) {
  const { slug } = await params;
  const db = supabaseAdmin();

  const { data: page } = await db
    .from("link_pages")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!page) notFound();

  const { data: items } = await db
    .from("link_items")
    .select("*")
    .eq("page_id", page.id)
    .eq("visible", true)
    .order("sort_order", { ascending: true });

  return <PublicBioPage page={page} items={items ?? []} />;
}
