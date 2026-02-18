"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function InviteForm({ workspaceSlug }: { workspaceSlug: string }) {
  const t = useTranslations("adminUI.inviteForm");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceSlug}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error || t("failedInvite"));
      } else {
        setMessage(t("inviteCreated"));
        setEmail("");
      }
    } catch (err) {
      setMessage(String(err));
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        className="rounded-xl border px-3 py-2 text-sm"
        placeholder={t("emailPlaceholder")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as "member" | "admin")}
        className="rounded-xl border border-gigaviz-border bg-white px-3 py-2 text-sm text-slate-900"
      >
        <option value="member" className="bg-white text-slate-900">
          {t("member")}
        </option>
        <option value="admin" className="bg-white text-slate-900">
          {t("admin")}
        </option>
      </select>
      <button type="submit" disabled={loading} className="rounded-xl bg-[color:var(--gv-accent)] px-3 py-2 text-sm font-semibold">
        {loading ? t("sending") : t("invite")}
      </button>
      {message && <div className="text-sm text-gigaviz-muted">{message}</div>}
    </form>
  );
}
