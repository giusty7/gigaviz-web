"use client";

import { EntityActions } from "./EntityActions";

type Props = {
  videoId: string;
  workspaceSlug: string;
  title: string;
  description: string;
};

export function VideoActions({ videoId, workspaceSlug, title, description }: Props) {
  return (
    <EntityActions
      entityId={videoId}
      workspaceSlug={workspaceSlug}
      apiPath="/api/studio/graph/videos"
      redirectAfterDelete="/modules/studio/graph/videos"
      editButtonLabel="videos.actions.editVideo"
      accentColor="purple"
      fields={[
        { key: "title", label: "Title", value: title, placeholder: "Video title" },
        { key: "description", label: "Description", value: description, type: "textarea", placeholder: "Description...", required: false },
      ]}
    />
  );
}
