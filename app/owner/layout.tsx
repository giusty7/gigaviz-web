import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { requireOwner } from "@/lib/owner/requireOwner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner Console",
  robots: { index: false, follow: false },
};

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const owner = await requireOwner();
  if (!owner.ok) {
    if (owner.reason === "not_authenticated") {
      redirect("/login?next=/owner");
    }
    redirect("/");
  }

  return (
    <OwnerShell actorEmail={owner.actorEmail} actorRole={owner.actorRole}>
      {children}
    </OwnerShell>
  );
}
