import { notFound } from "next/navigation";

export function assertOpsEnabled() {
  // Default to enabled in development to avoid local env misconfig blocking ops access
  const opsEnabled = process.env.OPS_ENABLED ?? (process.env.NODE_ENV === "development" ? "1" : undefined);
  if (opsEnabled !== "1") {
    notFound();
  }
}
