/**
 * Inbox sub-components barrel export.
 *
 * All types and components are split into focused files under
 * `components/meta-hub/inbox/`. Import from here or from the
 * individual files — both patterns work.
 */

// Types
export type {
  Thread,
  Message,
  Note,
  ContactDetails,
  ApprovedTemplate,
  FilterState,
  SavedView,
  WorkspaceMember,
  CannedResponse,
  MediaItem,
  ConnectionStatus,
  SessionInfo,
  TelemetrySnapshot,
} from "./types";

// Constants & helpers
export {
  listVariants,
  listItemVariants,
  bubbleVariants,
  sidebarVariants,
  formatTime,
  formatDate,
  formatPhoneShort,
} from "./constants";

// Components
export { InboxHeader } from "./InboxHeader";
export { ContactList } from "./ContactList";
