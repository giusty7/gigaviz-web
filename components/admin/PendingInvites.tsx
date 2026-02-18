"use client";
import { logger } from "@/lib/logging";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Invite = {
  id: string;
  email: string;
  role: string;
  created_at: string;
};

export default function PendingInvites({ invites }: { invites: Invite[] }) {
  const t = useTranslations("adminUI.pendingInvites");
  const [items, setItems] = useState(invites);

  async function revoke(id: string) {
    try {
      const res = await fetch("/api/invites/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId: id }),
      });
      if (!res.ok) throw new Error("revoke_failed");
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (err) {
      logger.error(err instanceof Error ? err.message : String(err));
      alert(t("revokeFailed"));
    }
  }

  if (items.length === 0) return <div className="text-sm text-gigaviz-muted">{t("noPending")}</div>;

  return (
    <div className="space-y-2">
      {items.map((invite) => (
        <div key={invite.id} className="flex items-center justify-between rounded-md border bg-[color:var(--gv-card)] p-2">
          <div className="text-sm">
            <div className="font-semibold">{invite.email}</div>
            <div className="text-xs text-gigaviz-muted">{invite.role} â€¢ {new Date(invite.created_at).toLocaleString()}</div>
          </div>
          <div>
            <button className="rounded-md bg-red-600 px-2 py-1 text-xs" onClick={() => revoke(invite.id)}>{t("revoke")}</button>
          </div>
        </div>
      ))}
    </div>
  );
}
