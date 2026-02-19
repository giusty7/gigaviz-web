"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Loader2, Image as ImageIcon, FileCode2 } from "lucide-react";

type Props = {
  /** CSS selector or ref container that holds the chart's ResponsiveContainer */
  containerSelector?: string;
  /** Filename without extension */
  filename?: string;
};

/**
 * Export a Recharts chart to PNG or SVG.
 *
 * Finds the nearest `<svg>` element inside the given container (or parent)
 * and serializes it.
 */
export function ChartExportButton({ containerSelector, filename = "chart" }: Props) {
  const t = useTranslations("studio");
  const [exporting, setExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const getSvg = useCallback((): SVGSVGElement | null => {
    const container = containerSelector
      ? document.querySelector(containerSelector)
      : document.querySelector(".recharts-responsive-container");
    return container?.querySelector("svg") ?? null;
  }, [containerSelector]);

  const exportAsSvg = useCallback(() => {
    const svg = getSvg();
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  }, [getSvg, filename]);

  const exportAsPng = useCallback(async () => {
    const svg = getSvg();
    if (!svg) return;

    setExporting(true);
    try {
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svg);
      const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = 2; // 2x for retina
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Dark background
        ctx.fillStyle = "#0a1229";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const pngUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = pngUrl;
          a.download = `${filename}.png`;
          a.click();
          URL.revokeObjectURL(pngUrl);
          setExporting(false);
          setShowMenu(false);
        }, "image/png");

        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch {
      setExporting(false);
    }
  }, [getSvg, filename]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#f5f5dc]/10 px-3 text-xs font-medium text-[#f5f5dc]/50 hover:text-[#f5f5dc] hover:border-[#f5f5dc]/20 transition-colors"
      >
        {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        {t("graph.actions.export")}
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-1 z-50 w-40 rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229] shadow-xl">
          <button
            onClick={exportAsPng}
            disabled={exporting}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[#f5f5dc]/70 hover:bg-[#f5f5dc]/5 transition-colors rounded-t-lg"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            PNG (2x)
          </button>
          <button
            onClick={exportAsSvg}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[#f5f5dc]/70 hover:bg-[#f5f5dc]/5 transition-colors rounded-b-lg"
          >
            <FileCode2 className="h-3.5 w-3.5" />
            SVG
          </button>
        </div>
      )}
    </div>
  );
}
