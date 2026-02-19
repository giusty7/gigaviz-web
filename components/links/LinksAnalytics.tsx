"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, MousePointerClick, BarChart3, Smartphone, Monitor, Tablet } from "lucide-react";

type ClickRow = { item_id: string; page_id: string; clicked_at: string; device_type: string | null };
type PageRow = { id: string; title: string; slug: string };
type ItemRow = { id: string; title: string; page_id: string; link_type: string };

interface LinksAnalyticsProps {
  workspaceSlug: string;
  pages: PageRow[];
  clicks: ClickRow[];
  items: ItemRow[];
  last14Days: string[];
}

export function LinksAnalytics({ workspaceSlug, pages, clicks, items, last14Days }: LinksAnalyticsProps) {
  const t = useTranslations("linksUI");
  const base = `/${workspaceSlug}/links`;

  // Aggregations
  const totalClicks = clicks.length;
  const byDay: Record<string, number> = {};
  const byDevice: Record<string, number> = {};
  const byItem: Record<string, number> = {};
  const byPage: Record<string, number> = {};

  for (const c of clicks) {
    const day = c.clicked_at.slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + 1;
    byDevice[c.device_type ?? "unknown"] = (byDevice[c.device_type ?? "unknown"] ?? 0) + 1;
    byItem[c.item_id] = (byItem[c.item_id] ?? 0) + 1;
    byPage[c.page_id] = (byPage[c.page_id] ?? 0) + 1;
  }

  const topItems = Object.entries(byItem)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id, count]) => {
      const item = items.find((i) => i.id === id);
      return { id, title: item?.title ?? "Unknown", clicks: count, type: item?.link_type ?? "url" };
    });

  const topPages = Object.entries(byPage)
    .sort(([, a], [, b]) => b - a)
    .map(([id, count]) => {
      const page = pages.find((p) => p.id === id);
      return { id, title: page?.title ?? "Unknown", slug: page?.slug ?? "", clicks: count };
    });

  // Daily chart (last 14 days)
  const maxDay = Math.max(1, ...last14Days.map((d) => byDay[d] ?? 0));

  const deviceIcon: Record<string, typeof Monitor> = {
    desktop: Monitor,
    mobile: Smartphone,
    tablet: Tablet,
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
          <h1 className="text-lg font-bold text-[#f5f5dc] tracking-tight">{t("analytics")}</h1>
          <p className="text-[11px] text-[#f5f5dc]/40">{t("last30days", { count: totalClicks.toLocaleString() })}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon={MousePointerClick} label={t("totalClicks")} value={totalClicks} />
        <StatCard icon={BarChart3} label={t("activePages")} value={topPages.length} />
        <StatCard icon={Smartphone} label={t("mobilePercent")} value={totalClicks > 0 ? Math.round(((byDevice.mobile ?? 0) / totalClicks) * 100) : 0} suffix="%" />
      </div>

      {/* Daily chart */}
      <div className="rounded-xl border border-[#f5f5dc]/[0.06] bg-[#f5f5dc]/[0.02] p-4">
        <p className="text-[10px] uppercase tracking-wider text-[#f5f5dc]/30 mb-3">{t("clicksPerDay")}</p>
        <div className="flex items-end gap-1 h-24">
          {last14Days.map((day) => {
            const count = byDay[day] ?? 0;
            const pct = (count / maxDay) * 100;
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-[#d4af37]/60 transition-all"
                  style={{ height: `${Math.max(pct, 2)}%` }}
                  title={`${day}: ${count} clicks`}
                />
                <span className="text-[7px] text-[#f5f5dc]/20">{day.slice(8)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Top links */}
        <div className="rounded-xl border border-[#f5f5dc]/[0.06] bg-[#f5f5dc]/[0.02] p-4">
          <p className="text-[10px] uppercase tracking-wider text-[#f5f5dc]/30 mb-2">{t("topLinks")}</p>
          {topItems.length === 0 ? (
            <p className="text-[11px] text-[#f5f5dc]/25 py-4 text-center">{t("noClicksYet")}</p>
          ) : (
            <div className="space-y-1.5">
              {topItems.map((item, i) => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="text-[9px] text-[#f5f5dc]/20 w-4 text-right tabular-nums">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#f5f5dc]/70 truncate">{item.title}</p>
                  </div>
                  <span className="text-xs font-semibold text-[#d4af37] tabular-nums">{item.clicks}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Devices + Pages */}
        <div className="space-y-3">
          {/* Devices */}
          <div className="rounded-xl border border-[#f5f5dc]/[0.06] bg-[#f5f5dc]/[0.02] p-4">
            <p className="text-[10px] uppercase tracking-wider text-[#f5f5dc]/30 mb-2">{t("devices")}</p>
            <div className="space-y-1.5">
              {Object.entries(byDevice)
                .sort(([, a], [, b]) => b - a)
                .map(([device, count]) => {
                  const DIcon = deviceIcon[device] ?? Monitor;
                  const pct = totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0;
                  return (
                    <div key={device} className="flex items-center gap-2">
                      <DIcon className="h-3 w-3 text-[#f5f5dc]/30 shrink-0" />
                      <span className="text-xs text-[#f5f5dc]/50 capitalize flex-1">{device}</span>
                      <span className="text-xs text-[#f5f5dc]/30 tabular-nums">{pct}%</span>
                      <span className="text-xs font-semibold text-[#f5f5dc]/60 tabular-nums w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              {Object.keys(byDevice).length === 0 && (
                <p className="text-[11px] text-[#f5f5dc]/25 py-2 text-center">{t("noData")}</p>
              )}
            </div>
          </div>

          {/* Pages */}
          <div className="rounded-xl border border-[#f5f5dc]/[0.06] bg-[#f5f5dc]/[0.02] p-4">
            <p className="text-[10px] uppercase tracking-wider text-[#f5f5dc]/30 mb-2">{t("byPage")}</p>
            <div className="space-y-1.5">
              {topPages.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <span className="text-xs text-[#f5f5dc]/50 flex-1 truncate">{p.title}</span>
                  <span className="text-xs font-semibold text-[#d4af37] tabular-nums">{p.clicks}</span>
                </div>
              ))}
              {topPages.length === 0 && (
                <p className="text-[11px] text-[#f5f5dc]/25 py-2 text-center">{t("noData")}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, suffix = "" }: { icon: typeof MousePointerClick; label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-xl border border-[#f5f5dc]/[0.06] bg-[#f5f5dc]/[0.02] px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-[#d4af37]" />
        <span className="text-[10px] uppercase tracking-wider text-[#f5f5dc]/40">{label}</span>
      </div>
      <p className="mt-1 text-xl font-bold text-[#f5f5dc] tabular-nums">
        {value.toLocaleString()}{suffix}
      </p>
    </div>
  );
}
