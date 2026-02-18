"use client";

import { ChartRenderer } from "@/components/studio/ChartRenderer";
import { useTranslations } from "next-intl";
import { TrendingUp, TrendingDown, FileText, Table2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type Widget = {
  title: string;
  type: "chart" | "stat" | "table" | "text";
  chart_type?: string;
  data?: {
    labels?: string[];
    datasets?: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string;
    }>;
  };
  value?: string;
  description?: string;
  w?: number;
  h?: number;
};

type DashboardRendererProps = {
  widgets: Widget[];
  className?: string;
};

/* ------------------------------------------------------------------ */
/*  Stat Widget                                                         */
/* ------------------------------------------------------------------ */

function StatWidget({ widget }: { widget: Widget }) {
  const isPositive = widget.value?.startsWith("+") || widget.value?.includes("↑");
  const isNegative = widget.value?.startsWith("-") || widget.value?.includes("↓");

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-5">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-[#f5f5dc]/40">
          {widget.title}
        </p>
        <p className="mt-2 text-2xl font-bold text-[#f5f5dc]">{widget.value}</p>
      </div>
      {widget.description && (
        <div className="mt-3 flex items-center gap-1.5">
          {isPositive && <TrendingUp className="h-3 w-3 text-emerald-400" />}
          {isNegative && <TrendingDown className="h-3 w-3 text-red-400" />}
          <p className={`text-xs ${isPositive ? "text-emerald-400" : isNegative ? "text-red-400" : "text-[#f5f5dc]/40"}`}>
            {widget.description}
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Text Widget                                                         */
/* ------------------------------------------------------------------ */

function TextWidget({ widget }: { widget: Widget }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-5">
      <div className="mb-2 flex items-center gap-2">
        <FileText className="h-4 w-4 text-cyan-400" />
        <h4 className="text-xs font-semibold text-[#f5f5dc]/70">{widget.title}</h4>
      </div>
      <p className="text-sm leading-relaxed text-[#f5f5dc]/50">{widget.value}</p>
      {widget.description && (
        <p className="mt-2 text-xs text-[#f5f5dc]/30">{widget.description}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Table Widget                                                        */
/* ------------------------------------------------------------------ */

function TableWidget({ widget, labelText }: { widget: Widget; labelText: string }) {
  const data = widget.data;
  if (!data?.labels || !data?.datasets?.[0]) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#f5f5dc]/10 bg-[#0a1229]/30 p-5">
        <div className="text-center">
          <Table2 className="mx-auto mb-2 h-6 w-6 text-[#f5f5dc]/20" />
          <p className="text-xs text-[#f5f5dc]/30">{widget.title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-5 overflow-auto">
      <h4 className="mb-3 text-xs font-semibold text-[#f5f5dc]/70">{widget.title}</h4>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#f5f5dc]/10">
            <th className="pb-2 text-left font-medium text-[#f5f5dc]/40">{labelText}</th>
            {data.datasets.map((ds) => (
              <th key={ds.label} className="pb-2 text-right font-medium text-[#f5f5dc]/40">
                {ds.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.labels.map((label, i) => (
            <tr key={i} className="border-b border-[#f5f5dc]/5">
              <td className="py-1.5 text-[#f5f5dc]/60">{label}</td>
              {data.datasets!.map((ds) => (
                <td key={ds.label} className="py-1.5 text-right font-medium text-[#f5f5dc]/70">
                  {(ds.data[i] ?? 0).toLocaleString()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chart Widget                                                        */
/* ------------------------------------------------------------------ */

function ChartWidget({ widget, noDataText }: { widget: Widget; noDataText: string }) {
  if (!widget.data?.labels || !widget.data?.datasets) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-purple-500/20 bg-[#0a1229]/30 p-4">
        <p className="text-xs text-[#f5f5dc]/30">{widget.title} — {noDataText}</p>
      </div>
    );
  }

  return (
    <ChartRenderer
      chartType={widget.chart_type || "bar"}
      dataJson={widget.data}
      configJson={{ title: widget.title, show_legend: true, show_grid: true }}
      height={200}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                      */
/* ------------------------------------------------------------------ */

export function DashboardRenderer({ widgets, className = "" }: DashboardRendererProps) {
  const t = useTranslations("studioRenderers.dashboard");

  if (!widgets || widgets.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-[#f5f5dc]/10 bg-[#0a1229]/30 p-12">
        <p className="text-sm text-[#f5f5dc]/30">{t("noWidgets")}</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {widgets.map((widget, i) => {
        // Determine grid span based on widget width
        const colSpan =
          widget.w === 3
            ? "sm:col-span-2 lg:col-span-3"
            : widget.w === 2
              ? "sm:col-span-2"
              : "";
        const rowSpan = widget.h === 2 ? "row-span-2" : "";

        return (
          <div key={i} className={`${colSpan} ${rowSpan} min-h-[140px]`}>
            {widget.type === "stat" && <StatWidget widget={widget} />}
            {widget.type === "chart" && <ChartWidget widget={widget} noDataText={t("noData")} />}
            {widget.type === "text" && <TextWidget widget={widget} />}
            {widget.type === "table" && <TableWidget widget={widget} labelText={t("label")} />}
          </div>
        );
      })}
    </div>
  );
}
