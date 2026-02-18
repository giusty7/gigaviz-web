"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  ExternalLink,
  BarChart3,
  MousePointerClick,
  Link2,
  FileStack,
  MoreHorizontal,
  Trash2,
  Copy,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PageRow = {
  id: string;
  title: string;
  slug: string;
  bio: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

interface LinksOverviewProps {
  workspaceSlug: string;
  pages: PageRow[];
  totalClicks: number;
  totalItems: number;
}

export function LinksOverview({ workspaceSlug, pages, totalClicks, totalItems }: LinksOverviewProps) {
  const t = useTranslations("linksUI");
  const base = `/${workspaceSlug}/links`;
  const publicBase = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#f5f5dc] tracking-tight">{t("links")}</h1>
          <p className="text-[11px] text-[#f5f5dc]/40 mt-0.5">
            {t("linksDesc")}
          </p>
        </div>
        <Link
          href={`${base}/pages/new`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#d4af37] px-3 py-1.5 text-[11px] font-semibold text-[#050a18] transition hover:bg-[#d4af37]/90"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("newPage")}
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={FileStack} label={t("pages")} value={pages.length} />
        <StatCard icon={Link2} label={t("linksCount")} value={totalItems} />
        <StatCard icon={MousePointerClick} label={t("clicks30d")} value={totalClicks} />
      </div>

      {/* Quick nav */}
      <div className="flex gap-2">
        <NavPill href={`${base}/analytics`} icon={BarChart3} label="Analytics" />
        <NavPill href={`${base}/qr`} icon={QrCode} label="QR Codes" />
      </div>

      {/* Pages list */}
      {pages.length === 0 ? (
        <EmptyState base={base} />
      ) : (
        <div className="space-y-2">
          {pages.map((page) => (
            <PageCard key={page.id} page={page} base={base} publicBase={publicBase} workspaceSlug={workspaceSlug} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Stat card ── */
function StatCard({ icon: Icon, label, value }: { icon: typeof FileStack; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#f5f5dc]/[0.06] bg-[#f5f5dc]/[0.02] px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-[#d4af37]" />
        <span className="text-[10px] uppercase tracking-wider text-[#f5f5dc]/40">{label}</span>
      </div>
      <p className="mt-1 text-xl font-bold text-[#f5f5dc] tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}

/* ── Nav pill ── */
function NavPill({ href, icon: Icon, label }: { href: string; icon: typeof BarChart3; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#f5f5dc]/[0.06] bg-[#f5f5dc]/[0.02] px-3 py-1.5 text-[11px] font-medium text-[#f5f5dc]/60 transition hover:bg-[#f5f5dc]/[0.05] hover:text-[#f5f5dc]/80"
    >
      <Icon className="h-3 w-3" />
      {label}
    </Link>
  );
}

/* ── Empty state ── */
function EmptyState({ base }: { base: string }) {
  const t = useTranslations("linksUI");
  return (
    <div className="rounded-xl border border-dashed border-[#f5f5dc]/[0.08] bg-[#f5f5dc]/[0.01] px-6 py-10 text-center">
      <Link2 className="mx-auto h-8 w-8 text-[#f5f5dc]/20" />
      <h3 className="mt-3 text-sm font-semibold text-[#f5f5dc]/70">{t("noPagesYet")}</h3>
      <p className="mt-1 text-[11px] text-[#f5f5dc]/40 max-w-xs mx-auto">
        {t("noPagesDesc")}
      </p>
      <Link
        href={`${base}/pages/new`}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#d4af37] px-4 py-2 text-xs font-semibold text-[#050a18] transition hover:bg-[#d4af37]/90"
      >
        <Plus className="h-3.5 w-3.5" />
        {t("createPage")}
      </Link>
    </div>
  );
}

/* ── Page card ── */
function PageCard({
  page,
  base,
  publicBase,
  workspaceSlug,
}: {
  page: PageRow;
  base: string;
  publicBase: string;
  workspaceSlug: string;
}) {
  const t = useTranslations("linksUI");
  const [menuOpen, setMenuOpen] = useState(false);
  const publicUrl = `${publicBase}/l/${page.slug}`;
  const editHref = `${base}/pages/${page.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl).catch(() => {});
    setMenuOpen(false);
  };

  const handleDelete = async () => {
    if (!confirm(t("deleteConfirm", { title: page.title }))) return;
    setMenuOpen(false);
    await fetch(`/api/links/pages/${page.id}?workspace_id=${workspaceSlug}`, { method: "DELETE" });
    window.location.reload();
  };

  return (
    <div className="group relative rounded-xl border border-[#f5f5dc]/[0.06] bg-[#f5f5dc]/[0.02] px-4 py-3 transition hover:border-[#f5f5dc]/[0.10]">
      <div className="flex items-start justify-between gap-3">
        <Link href={editHref} className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#f5f5dc] truncate">{page.title}</h3>
          <p className="mt-0.5 text-[11px] text-[#f5f5dc]/40 truncate">
            /l/{page.slug}
            {page.bio && <span className="ml-2 text-[#f5f5dc]/25">— {page.bio}</span>}
          </p>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          {/* Status badge */}
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
              page.published
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-[#f5f5dc]/[0.04] text-[#f5f5dc]/30"
            )}
          >
            {page.published ? t("statusLive") : t("statusDraft")}
          </span>

          {/* Public link */}
          {page.published && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded p-1 text-[#f5f5dc]/30 transition hover:bg-[#f5f5dc]/[0.05] hover:text-[#f5f5dc]/60"
              title="Open public page"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded p-1 text-[#f5f5dc]/30 transition hover:bg-[#f5f5dc]/[0.05] hover:text-[#f5f5dc]/60"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-[#f5f5dc]/[0.08] bg-[#0a1229] py-1 shadow-xl">
                  <button
                    onClick={handleCopy}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] text-[#f5f5dc]/60 hover:bg-[#f5f5dc]/[0.04] hover:text-[#f5f5dc]"
                  >
                    <Copy className="h-3 w-3" /> {t("copyLink")}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] text-red-400/70 hover:bg-red-500/5 hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" /> {t("delete")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom meta */}
      <div className="mt-2 flex items-center gap-3 text-[10px] text-[#f5f5dc]/25">
        <span>{t("createdDate", { date: new Date(page.created_at).toLocaleDateString() })}</span>
      </div>
    </div>
  );
}
