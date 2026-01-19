import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function OwnerHealthRedirect() {
  redirect("/ops/health");
}
