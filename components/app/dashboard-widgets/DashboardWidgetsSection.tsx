"use client";

import { EcosystemHealthWidget } from "./EcosystemHealthWidget";
import { PerformanceMetricsWidget } from "./PerformanceMetricsWidget";
import { ResourceFuelWidget } from "./ResourceFuelWidget";
import { AIAssistantFeedWidget } from "./AIAssistantFeedWidget";
import { QuickLaunchGrid } from "./QuickLaunchGrid";

type DashboardWidgetsSectionProps = {
  workspaceSlug: string;
};

export function DashboardWidgetsSection({ workspaceSlug }: DashboardWidgetsSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-[#f5f5dc]">Imperium Overview</h2>
      
      {/* Responsive Bento Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Performance Metrics - Large, spans 2 columns on lg */}
        <div className="md:col-span-2 lg:col-span-2">
          <PerformanceMetricsWidget />
        </div>
        
        {/* Ecosystem Health - Small */}
        <div className="lg:col-span-1">
          <EcosystemHealthWidget />
        </div>
        
        {/* Resource Fuel - Medium */}
        <div className="md:col-span-1">
          <ResourceFuelWidget />
        </div>
        
        {/* AI Assistant Feed - Medium */}
        <div className="md:col-span-1">
          <AIAssistantFeedWidget />
        </div>
        
        {/* Quick Launch Grid - Spans full width on mobile, 1 col on lg */}
        <div className="lg:col-span-1">
          <QuickLaunchGrid workspaceSlug={workspaceSlug} />
        </div>
      </div>
    </section>
  );
}
