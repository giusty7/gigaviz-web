"use client";

import { EntityActions } from "./EntityActions";

type Props = {
  trackId: string;
  workspaceSlug: string;
  title: string;
  description: string;
};

export function MusicActions({ trackId, workspaceSlug, title, description }: Props) {
  return (
    <EntityActions
      entityId={trackId}
      workspaceSlug={workspaceSlug}
      apiPath="/api/studio/tracks/music"
      redirectAfterDelete="/modules/studio/tracks/music"
      editButtonLabel="music.actions.editTrack"
      accentColor="teal"
      fields={[
        { key: "title", label: "Title", value: title, placeholder: "Track title" },
        { key: "description", label: "Description", value: description, type: "textarea", placeholder: "Description...", required: false },
      ]}
    />
  );
}
