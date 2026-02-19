"use client";

import { EntityActions } from "./EntityActions";

type Props = {
  imageId: string;
  workspaceSlug: string;
  title: string;
  description: string;
};

export function ImageActions({ imageId, workspaceSlug, title, description }: Props) {
  return (
    <EntityActions
      entityId={imageId}
      workspaceSlug={workspaceSlug}
      apiPath="/api/studio/graph/images"
      redirectAfterDelete="/modules/studio/graph/images"
      editButtonLabel="images.actions.editImage"
      accentColor="purple"
      fields={[
        { key: "title", label: "Title", value: title, placeholder: "Image title" },
        { key: "description", label: "Description", value: description, type: "textarea", placeholder: "Description...", required: false },
      ]}
    />
  );
}
