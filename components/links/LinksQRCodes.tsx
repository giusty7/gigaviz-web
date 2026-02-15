"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, QrCode, Download, ExternalLink, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type PageRow = { id: string; title: string; slug: string; published: boolean };

interface LinksQRCodesProps {
  workspaceSlug: string;
  pages: PageRow[];
}

export function LinksQRCodes({ workspaceSlug, pages }: LinksQRCodesProps) {
  const base = `/${workspaceSlug}/links`;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const [selected, setSelected] = useState<string | null>(pages[0]?.slug ?? null);
  const [copied, setCopied] = useState(false);

  const selectedPage = pages.find((p) => p.slug === selected);
  const publicUrl = selected ? `${origin}/l/${selected}` : "";

  // Use external QR API (no npm dependency needed)
  const qrUrl = selected
    ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(publicUrl)}&bgcolor=0f172a&color=d4af37&format=png`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `qr-${selected}.png`;
    a.click();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={base}
          className="rounded-lg p-1.5 text-[#f5f5dc]/40 transition hover:bg-[#f5f5dc]/[0.04] hover:text-[#f5f5dc]/70"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-[#f5f5dc] tracking-tight">QR Codes</h1>
          <p className="text-[11px] text-[#f5f5dc]/40">Generate QR codes for your bio pages — print for menus, events, business cards</p>
        </div>
      </div>

      {pages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#f5f5dc]/[0.08] bg-[#f5f5dc]/[0.01] px-6 py-10 text-center">
          <QrCode className="mx-auto h-8 w-8 text-[#f5f5dc]/20" />
          <p className="mt-3 text-sm text-[#f5f5dc]/50">Create a link page first to generate QR codes.</p>
          <Link
            href={`${base}/pages/new`}
            className="mt-3 inline-block text-xs text-[#d4af37] hover:underline"
          >
            Create Page →
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr,360px]">
          {/* Left: page selector */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-[#f5f5dc]/30">Select Page</p>
            {pages.map((p) => (
              <button
                key={p.slug}
                onClick={() => setSelected(p.slug)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition",
                  selected === p.slug
                    ? "border-[#d4af37]/30 bg-[#d4af37]/[0.05]"
                    : "border-[#f5f5dc]/[0.06] bg-[#f5f5dc]/[0.02] hover:border-[#f5f5dc]/[0.10]"
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#f5f5dc] truncate">{p.title}</p>
                  <p className="text-[10px] text-[#f5f5dc]/30 font-mono">/l/{p.slug}</p>
                </div>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide shrink-0",
                    p.published ? "bg-emerald-500/10 text-emerald-400" : "bg-[#f5f5dc]/[0.04] text-[#f5f5dc]/30"
                  )}
                >
                  {p.published ? "Live" : "Draft"}
                </span>
              </button>
            ))}
          </div>

          {/* Right: QR preview */}
          {selected && (
            <div className="rounded-xl border border-[#f5f5dc]/[0.06] bg-[#f5f5dc]/[0.02] p-5 flex flex-col items-center gap-4">
              <p className="text-xs font-semibold text-[#f5f5dc]/70">{selectedPage?.title}</p>

              {/* QR Image */}
              <div className="rounded-xl bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrUrl} alt={`QR code for ${selected}`} width={200} height={200} className="block" />
              </div>

              {/* URL */}
              <div className="flex items-center gap-2 rounded-lg bg-[#f5f5dc]/[0.03] px-3 py-1.5 w-full">
                <span className="text-[11px] text-[#f5f5dc]/40 font-mono truncate flex-1">{publicUrl}</span>
                <button
                  onClick={handleCopy}
                  className="text-[#f5f5dc]/30 hover:text-[#f5f5dc]/60 transition shrink-0"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleDownload}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#d4af37] px-3 py-2 text-[11px] font-semibold text-[#050a18] transition hover:bg-[#d4af37]/90"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PNG
                </button>
                {selectedPage?.published && (
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#f5f5dc]/[0.08] px-3 py-2 text-[11px] font-medium text-[#f5f5dc]/50 transition hover:bg-[#f5f5dc]/[0.04]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </a>
                )}
              </div>

              {!selectedPage?.published && (
                <p className="text-[10px] text-amber-400/60 bg-amber-400/5 rounded-lg px-3 py-1.5 text-center w-full">
                  This page is not published yet. Publish it to make the QR code work.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
