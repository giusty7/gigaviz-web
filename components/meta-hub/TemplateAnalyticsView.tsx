"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

type TemplateAnalytics = {
  template: {
    id: string;
    name: string;
    category: string;
    language: string;
  };
  metrics: {
    total_sent: number;
    delivered: number;
    failed: number;
    pending: number;
    delivery_rate: number;
    failure_rate: number;
  };
  jobs: {
    total: number;
    completed: number;
    failed: number;
  };
  trend: Array<{ date: string; count: number }>;
};

interface TemplateAnalyticsViewProps {
  templateId: string;
  workspaceId: string;
}

export function TemplateAnalyticsView({ templateId, workspaceId }: TemplateAnalyticsViewProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TemplateAnalytics | null>(null);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, workspaceId]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/meta/whatsapp/templates/${templateId}/analytics?workspaceId=${workspaceId}`
      );
      const result = await res.json();

      if (res.ok) {
        setData(result);
      } else {
        throw new Error(result.error || "Failed to fetch analytics");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-[#f5f5dc]/60 py-12">
        <p>No analytics data available</p>
      </div>
    );
  }

  const { template, metrics, jobs, trend } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#f9d976]">{template.name}</h2>
          <p className="text-[#f5f5dc]/70 mt-1">
            {template.category} • {template.language}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="border-[#d4af37]/30"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Send}
          label="Total Sent"
          value={metrics.total_sent}
          color="text-blue-400"
        />
        <MetricCard
          icon={CheckCircle}
          label="Delivered"
          value={metrics.delivered}
          subtitle={`${metrics.delivery_rate}% delivery rate`}
          color="text-green-400"
        />
        <MetricCard
          icon={XCircle}
          label="Failed"
          value={metrics.failed}
          subtitle={`${metrics.failure_rate}% failure rate`}
          color="text-red-400"
        />
        <MetricCard
          icon={Clock}
          label="Pending"
          value={metrics.pending}
          color="text-yellow-400"
        />
      </div>

      {/* Jobs Summary */}
      <div className="bg-[#1a1a1a] border border-[#d4af37]/20 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-[#d4af37]" />
          <h3 className="text-lg font-bold text-[#f5f5dc]">Campaign Jobs</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-[#f5f5dc]/60">Total Jobs</p>
            <p className="text-2xl font-bold text-[#f5f5dc]">{jobs.total}</p>
          </div>
          <div>
            <p className="text-sm text-[#f5f5dc]/60">Completed</p>
            <p className="text-2xl font-bold text-green-400">{jobs.completed}</p>
          </div>
          <div>
            <p className="text-sm text-[#f5f5dc]/60">Failed</p>
            <p className="text-2xl font-bold text-red-400">{jobs.failed}</p>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-[#1a1a1a] border border-[#d4af37]/20 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-[#d4af37]" />
          <h3 className="text-lg font-bold text-[#f5f5dc]">Usage Trend (Last 30 Days)</h3>
        </div>
        {trend.length > 0 ? (
          <div className="flex items-end gap-2 h-48">
            {trend.map((day, idx) => {
              const maxCount = Math.max(...trend.map(d => d.count));
              const heightPercent = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
              return (
                <motion.div
                  key={day.date}
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  transition={{ delay: idx * 0.02 }}
                  className="flex-1 bg-[#d4af37] rounded-t min-w-0 relative group"
                  title={`${day.date}: ${day.count} sent`}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#0a0a0a] border border-[#d4af37]/30 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}<br />
                    {day.count} sent
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-[#f5f5dc]/60 py-8">No usage data available</p>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  subtitle?: string;
  color: string;
}) {
  return (
    <div className="bg-[#1a1a1a] border border-[#d4af37]/20 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-5 w-5 ${color}`} />
        <span className="text-sm text-[#f5f5dc]/60">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[#f5f5dc]">{value.toLocaleString()}</p>
      {subtitle && <p className="text-xs text-[#f5f5dc]/50 mt-1">{subtitle}</p>}
    </div>
  );
}
