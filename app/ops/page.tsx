import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function OpsIndexRedirect() {
  redirect("/ops/god-console");
}
