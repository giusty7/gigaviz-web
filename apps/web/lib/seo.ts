export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gigaviz.com";
export const brand = "Gigaviz";

export function canonical(path = "/") {
  const url = new URL(path, siteUrl);
  return url.toString();
}
