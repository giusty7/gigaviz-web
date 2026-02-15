/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import Image from "next/image";
import {
  Globe,
  MessageCircle,
  ShoppingBag,
  Share2,
  ExternalLink,
} from "lucide-react";

type PageData = {
  id: string;
  title: string;
  slug: string;
  bio: string | null;
  avatar_url: string | null;
  theme: any;
};

type ItemData = {
  id: string;
  title: string;
  url: string | null;
  link_type: string;
  icon: string | null;
  thumbnail_url: string | null;
  metadata: any;
  sort_order: number;
  visible: boolean;
};

const ICON_MAP: Record<string, typeof Globe> = {
  url: Globe,
  whatsapp: MessageCircle,
  product: ShoppingBag,
  social: Share2,
};

interface PublicBioPageProps {
  page: PageData;
  items: ItemData[];
}

export function PublicBioPage({ page, items }: PublicBioPageProps) {
  const theme = page.theme ?? {};
  const bg = theme.bg ?? "#0f172a";
  const text = theme.text ?? "#f5f5dc";
  const accent = theme.accent ?? "#d4af37";
  const buttonStyle = theme.buttonStyle ?? "filled";
  const radius = theme.radius ?? "lg";

  const radiusClass: Record<string, string> = {
    none: "rounded-none",
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };
  const rad = radiusClass[radius] ?? "rounded-lg";

  const getItemUrl = (item: ItemData): string => {
    // Use click tracking redirect
    return `/api/links/click/${item.id}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10" style={{ background: bg }}>
      <div className="w-full max-w-md space-y-5">
        {/* Avatar + title */}
        <div className="text-center space-y-2">
          {page.avatar_url ? (
            <Image
              src={page.avatar_url}
              alt={page.title}
              width={80}
              height={80}
              unoptimized
              className="mx-auto h-20 w-20 rounded-full object-cover border-2"
              style={{ borderColor: accent + "40" }}
            />
          ) : (
            <div
              className="mx-auto h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ background: accent + "20", color: accent }}
            >
              {page.title.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-xl font-bold" style={{ color: text }}>
            {page.title}
          </h1>
          {page.bio && (
            <p className="text-sm max-w-xs mx-auto" style={{ color: text, opacity: 0.6 }}>
              {page.bio}
            </p>
          )}
        </div>

        {/* Link items */}
        <div className="space-y-2.5">
          {items.map((item) => {
            // Heading
            if (item.link_type === "heading") {
              return (
                <p
                  key={item.id}
                  className="text-xs font-semibold uppercase tracking-wider pt-3 pb-1 text-center"
                  style={{ color: text, opacity: 0.35 }}
                >
                  {item.title}
                </p>
              );
            }

            // Product card
            if (item.link_type === "product") {
              const meta = (item.metadata ?? {}) as { price?: number; currency?: string; description?: string; image_url?: string };
              return (
                <a
                  key={item.id}
                  href={getItemUrl(item)}
                  className={`block ${rad} p-3 transition hover:scale-[1.01]`}
                  style={{
                    background: accent + "10",
                    border: `1px solid ${accent}25`,
                  }}
                >
                  <div className="flex gap-3">
                    {meta.image_url && (
                      <Image
                        src={meta.image_url}
                        alt={item.title}
                        width={64}
                        height={64}
                        unoptimized
                        className="h-16 w-16 rounded-md object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: text }}>
                        {item.title}
                      </p>
                      {meta.description && (
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: text, opacity: 0.5 }}>
                          {meta.description}
                        </p>
                      )}
                      {meta.price != null && (
                        <p className="text-sm font-bold mt-1" style={{ color: accent }}>
                          {meta.currency ?? "IDR"} {meta.price.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </a>
              );
            }

            // Regular link / WhatsApp / Social
            const Icon = ICON_MAP[item.link_type] ?? Globe;
            const isFilled = buttonStyle === "filled";
            const isOutline = buttonStyle === "outline";

            return (
              <a
                key={item.id}
                href={getItemUrl(item)}
                className={`flex items-center gap-3 ${rad} px-4 py-3 text-sm font-medium transition hover:scale-[1.01] text-center justify-center`}
                style={{
                  background: isFilled ? accent + "18" : "transparent",
                  border: `1px solid ${accent}${isFilled ? "30" : isOutline ? "50" : "15"}`,
                  color: text,
                }}
              >
                <Icon className="h-4 w-4 shrink-0" style={{ color: accent }} />
                <span className="truncate">{item.title}</span>
                <ExternalLink className="h-3 w-3 shrink-0 ml-auto" style={{ color: text, opacity: 0.2 }} />
              </a>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[10px] font-medium transition hover:opacity-80"
            style={{ color: text, opacity: 0.2 }}
          >
            Powered by Gigaviz Links
          </Link>
        </div>
      </div>
    </div>
  );
}
