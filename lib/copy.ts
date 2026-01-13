export const copy = {
  upgradeModal: {
    title: "Upgrade to enable this feature",
    description:
      "You can preview the UI. To run actions and save changes, please upgrade.",
    bullets: [
      "Full action access without limits",
      "Workspaces and team collaboration",
      "Advanced RBAC (roles & permissions)",
      "Audit log for activity trails",
      "Centralized billing and subscription control",
    ],
    ctaPrimary: "View Plans",
    ctaSecondary: "Not now",
    footerNote: "You can still explore the UI without changing data.",
  },
  previewBanner: {
    title: "Preview Mode",
    text: "You can view the UI and sample data. Actions and saving are locked.",
    action: "Upgrade",
  },
  tooltips: {
    upgrade: "Upgrade required to use this feature.",
  },
  messages: {
    gated: "This feature is available after upgrading.",
  },
  emptyStates: {
    workspace: {
      title: "No workspace yet.",
      helper: "Create your first workspace to manage your team and access.",
    },
    members: {
      title: "No members yet.",
      helper: "Invite members to collaborate faster.",
    },
    roles: {
      title: "No advanced role settings yet.",
      helper: "Enable RBAC to manage permissions per feature.",
    },
    audit: {
      title: "No activity recorded yet.",
      helper: "When audit log is on, important actions appear here.",
    },
    billing: {
      title: "No active plan yet.",
      helper: "Choose a plan to unlock premium features and higher limits.",
    },
  },
};

export type Copy = typeof copy;
