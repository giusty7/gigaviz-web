import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { getAppContext } from "@/lib/app-context";
import { NotificationsClient } from "@/components/app/notifications-client";

export const dynamic = "force-dynamic";

type NotificationsPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function NotificationsPage({ params }: NotificationsPageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  return (
    <div className="relative space-y-6">
      {/* Cyber-Batik Pattern Background */}
      <div className="pointer-events-none fixed inset-0 batik-pattern opacity-[0.03]" aria-hidden />

      {/* Imperium Page Header */}
      <div className="relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10 shadow-lg shadow-[#d4af37]/10">
            <Bell className="h-5 w-5 text-[#d4af37]" />
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[#e11d48]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#e11d48]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e11d48] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#e11d48]" />
            </span>
            Live
          </div>
        </div>
        <h1 className="text-2xl font-bold md:text-3xl">
          <span className="bg-gradient-to-r from-[#d4af37] via-[#f9d976] to-[#d4af37] bg-clip-text text-transparent">
            Notifications
          </span>
        </h1>
        <p className="mt-2 text-sm text-[#f5f5dc]/60">
          View and manage all your workspace alerts, updates, and system messages.
        </p>
      </div>

      <NotificationsClient
        workspaceId={ctx.currentWorkspace.id}
        workspaceSlug={ctx.currentWorkspace.slug}
      />
    </div>
  );
}
