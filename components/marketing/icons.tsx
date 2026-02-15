import type { ModuleIcon } from "@/lib/modules/catalog";

const icons: Record<ModuleIcon, string[]> = {
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
  links: [
    "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71",
    "M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
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
  apps: [
    "M5 5h6v6H5z",
    "M13 5h6v6h-6z",
    "M5 13h6v6H5z",
    "M13 13h6v6h-6z",
  ],
};

export function MarketingIcon({
  name,
  className = "",
}: {
  name: ModuleIcon;
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
