/**
 * Beta testimonials data.
 *
 * Each entry represents a real or representative beta user.
 * Translation keys live under "testimonials" in messages/*.json
 * so the actual display text is localised – this file only
 * stores the structural metadata (avatar initials, role key, etc.).
 */

export interface Testimonial {
  /** Translation key suffix, e.g. "rina" → t("testimonials.rina.quote") */
  key: string;
  /** Two-letter initials for the avatar circle */
  initials: string;
  /** Accent colour class for the avatar ring */
  accent: string;
  /** Which Gigaviz product the quote relates to */
  product: string;
  /** Star rating 1–5 */
  rating: number;
}

export const testimonials: Testimonial[] = [
  {
    key: "rina",
    initials: "RS",
    accent: "ring-emerald-500",
    product: "meta_hub",
    rating: 5,
  },
  {
    key: "budi",
    initials: "BA",
    accent: "ring-blue-500",
    product: "platform",
    rating: 5,
  },
  {
    key: "sari",
    initials: "SD",
    accent: "ring-violet-500",
    product: "helper",
    rating: 4,
  },
  {
    key: "dimas",
    initials: "DP",
    accent: "ring-amber-500",
    product: "meta_hub",
    rating: 5,
  },
  {
    key: "maya",
    initials: "MK",
    accent: "ring-rose-500",
    product: "platform",
    rating: 5,
  },
  {
    key: "arief",
    initials: "AW",
    accent: "ring-cyan-500",
    product: "helper",
    rating: 4,
  },
];
