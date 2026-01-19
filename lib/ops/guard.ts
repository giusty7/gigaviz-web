import { notFound } from "next/navigation";

export function assertOpsEnabled() {
  if (process.env.OPS_ENABLED !== "1") {
    notFound();
  }
}
