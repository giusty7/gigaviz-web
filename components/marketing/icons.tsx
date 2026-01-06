import type { ProductIcon } from "@/lib/products";

const icons: Record<ProductIcon, string[]> = {
  platform: [
    "M4 7h16v11H4z",
    "M8 7V4h8v3",
    "M8 12h8",
  ],
  meta: [
    "M5 6h14v9H9l-4 4v-4H5z",
    "M9 10h6",
  ],
  helper: [
    "M12 3l1.8 4.2 4.5.4-3.4 3 1 4.4-3.9-2.3-3.9 2.3 1-4.4-3.4-3 4.5-.4z",
  ],
  office: [
    "M7 4h8l4 4v12H7z",
    "M15 4v4h4",
    "M9 12h6",
    "M9 16h6",
  ],
  studio: [
    "M12 4l8 4-8 4-8-4z",
    "M20 12l-8 4-8-4",
  ],
  marketplace: [
    "M4 9h16v10H4z",
    "M6 9l2-4h8l2 4",
    "M8 13h8",
  ],
  arena: [
    "M6 18h12",
    "M8 14h8",
    "M10 14l-2-4h8l-2 4",
    "M12 8a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5",
  ],
  apps: [
    "M5 5h6v6H5z",
    "M13 5h6v6h-6z",
    "M5 13h6v6H5z",
    "M13 13h6v6h-6z",
  ],
  pay: [
    "M4 7h16v10H4z",
    "M7 7V5h10v2",
    "M7 12h6",
  ],
  community: [
    "M8 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    "M16 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    "M4 19c0-2.2 2.8-4 6-4",
    "M14 15c3.2 0 6 1.8 6 4",
  ],
};

export function MarketingIcon({
  name,
  className = "",
}: {
  name: ProductIcon;
  className?: string;
}) {
  const paths = icons[name] ?? icons.platform;
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths.map((d, index) => (
        <path key={`${name}-${index}`} d={d} />
      ))}
    </svg>
  );
}
