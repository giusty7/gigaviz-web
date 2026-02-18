"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { BarChart3 } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type Dataset = {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
};

type ChartData = {
  labels?: string[];
  datasets?: Dataset[];
};

type ChartConfig = {
  title?: string;
  x_axis?: string;
  y_axis?: string;
  show_legend?: boolean;
  show_grid?: boolean;
  animation?: boolean;
};

type ChartRendererProps = {
  chartType: string;
  dataJson: ChartData | null;
  configJson?: ChartConfig | null;
  height?: number;
  className?: string;
};

/* ------------------------------------------------------------------ */
/*  Default palette                                                     */
/* ------------------------------------------------------------------ */

const DEFAULT_COLORS = [
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#3b82f6", // blue
  "#14b8a6", // teal
  "#f97316", // orange
  "#a855f7", // purple
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function getColor(dataset: Dataset, index: number): string {
  if (typeof dataset.borderColor === "string") return dataset.borderColor;
  if (typeof dataset.backgroundColor === "string") return dataset.backgroundColor;
  if (Array.isArray(dataset.backgroundColor) && dataset.backgroundColor[0])
    return dataset.backgroundColor[0];
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

function getPieColors(dataset: Dataset): string[] {
  if (Array.isArray(dataset.backgroundColor)) return dataset.backgroundColor;
  return DEFAULT_COLORS;
}

/* ------------------------------------------------------------------ */
/*  Tooltip                                                             */
/* ------------------------------------------------------------------ */

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-[#f5f5dc]/20 bg-[#0a1229]/95 px-3 py-2 shadow-xl backdrop-blur-sm">
      {label && (
        <p className="mb-1 text-[10px] font-medium text-[#f5f5dc]/60">{label}</p>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-[#f5f5dc]/80">{entry.name}:</span>
          <span className="text-xs font-semibold text-[#f5f5dc]">
            {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                      */
/* ------------------------------------------------------------------ */

export function ChartRenderer({
  chartType,
  dataJson,
  configJson,
  height = 350,
  className = "",
}: ChartRendererProps) {
  const t = useTranslations("studioRenderers.chart");
  const { records, datasets, labels } = useMemo(() => {
    if (!dataJson?.labels || !dataJson?.datasets) {
      return { records: [], datasets: [], labels: [] };
    }

    const lbls = dataJson.labels;
    const dsets = dataJson.datasets;

    // Transform to recharts format: [{ name: "Jan", Revenue: 100, Costs: 50 }, ...]
    const recs = lbls.map((label, i) => {
      const record: Record<string, string | number> = { name: label };
      dsets.forEach((ds) => {
        record[ds.label] = ds.data[i] ?? 0;
      });
      return record;
    });

    return { records: recs, datasets: dsets, labels: lbls };
  }, [dataJson]);

  const showLegend = configJson?.show_legend !== false;
  const showGrid = configJson?.show_grid !== false;

  if (!dataJson?.labels || !dataJson?.datasets || records.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-purple-500/20 bg-[#0a1229]/30 ${className}`}
        style={{ height }}
      >
        <BarChart3 className="mb-2 h-10 w-10 text-purple-400/20" />
        <p className="text-xs text-[#f5f5dc]/30">{t("noData")}</p>
      </div>
    );
  }

  const commonAxisProps = {
    tick: { fill: "rgba(245,245,220,0.4)", fontSize: 11 },
    axisLine: { stroke: "rgba(245,245,220,0.1)" },
    tickLine: { stroke: "rgba(245,245,220,0.1)" },
  };

  const gridProps = showGrid
    ? { stroke: "rgba(245,245,220,0.06)", strokeDasharray: "3 3" }
    : undefined;

  const legendProps = showLegend
    ? { wrapperStyle: { fontSize: 11, color: "rgba(245,245,220,0.6)" } }
    : undefined;

  return (
    <div className={`rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-4 ${className}`}>
      {configJson?.title && (
        <h4 className="mb-3 text-sm font-semibold text-[#f5f5dc]/70">
          {configJson.title}
        </h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );

  function renderChart() {
    switch (chartType) {
      case "line":
        return (
          <LineChart data={records}>
            {gridProps && <CartesianGrid {...gridProps} />}
            <XAxis dataKey="name" {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            {legendProps && <Legend {...legendProps} />}
            {datasets.map((ds, i) => (
              <Line
                key={ds.label}
                type="monotone"
                dataKey={ds.label}
                stroke={getColor(ds, i)}
                strokeWidth={2}
                dot={{ r: 3, fill: getColor(ds, i) }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        );

      case "pie":
        return (
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            {legendProps && <Legend {...legendProps} />}
            {datasets.map((ds) => {
              const pieData = labels.map((label, i) => ({
                name: label,
                value: ds.data[i] ?? 0,
              }));
              const colors = getPieColors(ds);
              return (
                <Pie
                  key={ds.label}
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={height * 0.35}
                  label={(props) => {
                    const name = String(props.name ?? "");
                    const pct = typeof props.percent === "number" ? props.percent : 0;
                    return `${name} ${(pct * 100).toFixed(0)}%`;
                  }}
                  labelLine={{ stroke: "rgba(245,245,220,0.3)" }}
                >
                  {pieData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={colors[i % colors.length]}
                      stroke="rgba(10,18,41,0.8)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
              );
            })}
          </PieChart>
        );

      case "area":
        return (
          <AreaChart data={records}>
            {gridProps && <CartesianGrid {...gridProps} />}
            <XAxis dataKey="name" {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            {legendProps && <Legend {...legendProps} />}
            {datasets.map((ds, i) => {
              const color = getColor(ds, i);
              return (
                <Area
                  key={ds.label}
                  type="monotone"
                  dataKey={ds.label}
                  stroke={color}
                  fill={color}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              );
            })}
          </AreaChart>
        );

      case "radar":
        return (
          <RadarChart data={records} cx="50%" cy="50%" outerRadius={height * 0.32}>
            <PolarGrid stroke="rgba(245,245,220,0.1)" />
            <PolarAngleAxis
              dataKey="name"
              tick={{ fill: "rgba(245,245,220,0.5)", fontSize: 10 }}
            />
            <PolarRadiusAxis tick={{ fill: "rgba(245,245,220,0.3)", fontSize: 9 }} />
            <Tooltip content={<CustomTooltip />} />
            {legendProps && <Legend {...legendProps} />}
            {datasets.map((ds, i) => {
              const color = getColor(ds, i);
              return (
                <Radar
                  key={ds.label}
                  name={ds.label}
                  dataKey={ds.label}
                  stroke={color}
                  fill={color}
                  fillOpacity={0.15}
                />
              );
            })}
          </RadarChart>
        );

      case "scatter":
        return (
          <ScatterChart>
            {gridProps && <CartesianGrid {...gridProps} />}
            <XAxis
              type="number"
              dataKey="x"
              name="X"
              {...commonAxisProps}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Y"
              {...commonAxisProps}
            />
            <Tooltip content={<CustomTooltip />} />
            {legendProps && <Legend {...legendProps} />}
            {datasets.map((ds, i) => {
              // For scatter, try to pair consecutive values as x,y
              const scatterData = [];
              for (let j = 0; j < ds.data.length; j++) {
                scatterData.push({
                  x: j + 1,
                  y: ds.data[j] ?? 0,
                  name: labels[j] || `Point ${j + 1}`,
                });
              }
              return (
                <Scatter
                  key={ds.label}
                  name={ds.label}
                  data={scatterData}
                  fill={getColor(ds, i)}
                />
              );
            })}
          </ScatterChart>
        );

      // Default: bar chart
      default:
        return (
          <BarChart data={records}>
            {gridProps && <CartesianGrid {...gridProps} />}
            <XAxis dataKey="name" {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            {legendProps && <Legend {...legendProps} />}
            {datasets.map((ds, i) => (
              <Bar
                key={ds.label}
                dataKey={ds.label}
                fill={getColor(ds, i)}
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            ))}
          </BarChart>
        );
    }
  }
}
