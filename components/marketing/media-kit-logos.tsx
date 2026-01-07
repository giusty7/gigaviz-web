"use client";

import Image from "next/image";
import { trackDownload } from "@/lib/analytics";

type LogoAsset = {
  label: string;
  file: string;
  width: number;
  height: number;
  previewClass: string;
};

type MediaKitLogosProps = {
  items: LogoAsset[];
};

export default function MediaKitLogos({ items }: MediaKitLogosProps) {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((logo) => (
        <div
          key={logo.file}
          className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-5"
        >
          <div
            className={`flex h-36 items-center justify-center rounded-2xl border border-[color:var(--gv-border)] ${logo.previewClass}`}
          >
            <Image
              src={logo.file}
              alt={logo.label}
              width={logo.width}
              height={logo.height}
              className="h-20 w-auto object-contain"
            />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm font-semibold text-[color:var(--gv-text)]">
              {logo.label}
            </div>
            <a
              href={logo.file}
              download
              onClick={() => trackDownload(logo.label, "media_kit")}
              className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--gv-accent)] hover:underline"
            >
              Download
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
