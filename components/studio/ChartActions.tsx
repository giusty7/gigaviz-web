"use client";

import { EntityActions } from "./EntityActions";

type Props = {
  chartId: string;
  workspaceSlug: string;
  title: string;
  description: string;
};

export function ChartActions({ chartId, workspaceSlug, title, description }: Props) {
  return (
    <EntityActions
      entityId={chartId}
      workspaceSlug={workspaceSlug}
      apiPath="/api/studio/graph/charts"
      redirectAfterDelete="/modules/studio/graph"
      editButtonLabel="graph.actions.editChart"
      accentColor="purple"
      fields={[
        { key: "title", label: "Title", value: title, placeholder: "Chart title" },
        { key: "description", label: "Description", value: description, type: "textarea", placeholder: "Description...", required: false },
      ]}
    />
  );
}
