"use client";

import { EntityActions } from "./EntityActions";

type Props = {
  documentId: string;
  workspaceSlug: string;
  title: string;
  content: string;
};

export function DocumentActions({ documentId, workspaceSlug, title, content }: Props) {
  return (
    <EntityActions
      entityId={documentId}
      workspaceSlug={workspaceSlug}
      apiPath="/api/studio/office/documents"
      redirectAfterDelete="/modules/studio/office"
      editButtonLabel="office.actions.editDocument"
      accentColor="cyan"
      fields={[
        { key: "title", label: "Title", value: title, placeholder: "Document title" },
        { key: "content_json", label: "Content", value: content, type: "textarea", rows: 12, placeholder: "JSON content (monospace)...", required: false },
      ]}
    />
  );
}
