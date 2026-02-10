/**
 * Types barrel — re-exports all shared types from a single entry point.
 *
 * Usage: import { WaContact, MessageRow, RouteContext } from "@/types";
 */

export * from "./api-common";
export * from "./wa-contacts";
export type { WaTemplate, WaTemplateParamDef, WaSendJob, WaSendJobItem, WaSendLog, TemplateComponent, CreateJobRequest, JobListResponse, JobDetailResponse } from "./wa-templates";
// NOTE: WaContact is exported from wa-contacts.ts (canonical source)
// The WaContact in wa-templates.ts is DEPRECATED — use the one from wa-contacts.ts
