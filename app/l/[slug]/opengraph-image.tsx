import { ImageResponse } from "next/og";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const alt = "Gigaviz Links";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = supabaseAdmin();

  const { data: page } = await db
    .from("link_pages")
    .select("id, title, bio, avatar_url, theme")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!page) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0f172a",
            color: "#f5f5dc",
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          Not Found
        </div>
      ),
      { ...size }
    );
  }

  const theme = (page.theme ?? {}) as { bg?: string; text?: string; accent?: string };
  const bg = theme.bg ?? "#0f172a";
  const text = theme.text ?? "#f5f5dc";
  const accent = theme.accent ?? "#d4af37";

  // Count visible links for this page
  const { count } = await db
    .from("link_items")
    .select("id", { count: "exact", head: true })
    .eq("page_id", page.id)
    .eq("visible", true);

  const linkCount = count ?? 0;
  const initial = page.title.charAt(0).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: bg,
          padding: "60px",
          gap: "24px",
        }}
      >
        {/* Avatar circle — img required by Satori/ImageResponse, not a browser context */}
        {page.avatar_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={page.avatar_url}
            alt=""
            width={120}
            height={120}
            style={{
              borderRadius: "50%",
              objectFit: "cover",
              border: `3px solid ${accent}40`,
            }}
          />
        ) : (
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              fontWeight: 700,
              color: accent,
              background: `${accent}20`,
            }}
          >
            {initial}
          </div>
        )}

        {/* Title */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: text,
            textAlign: "center",
            lineHeight: 1.1,
            maxWidth: "80%",
          }}
        >
          {page.title}
        </div>

        {/* Bio */}
        {page.bio && (
          <div
            style={{
              fontSize: 24,
              color: text,
              opacity: 0.6,
              textAlign: "center",
              maxWidth: "70%",
              lineHeight: 1.4,
            }}
          >
            {page.bio.length > 120 ? page.bio.slice(0, 117) + "..." : page.bio}
          </div>
        )}

        {/* Link count badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "8px",
            padding: "10px 24px",
            borderRadius: "999px",
            background: `${accent}18`,
            border: `1px solid ${accent}30`,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 600, color: accent }}>
            {linkCount} {linkCount === 1 ? "link" : "links"}
          </div>
        </div>

        {/* Branding */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            fontSize: 16,
            color: text,
            opacity: 0.2,
          }}
        >
          Powered by Gigaviz Links
        </div>
      </div>
    ),
    { ...size }
  );
}
