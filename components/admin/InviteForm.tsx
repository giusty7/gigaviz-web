"use client";
import { useState } from "react";

export default function InviteForm({ workspaceSlug }: { workspaceSlug: string }) {
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
        setMessage(data?.error || "Failed to create invite");
      } else {
        setMessage("Invite created");
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
        placeholder="email@example.com"
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
          Member
        </option>
        <option value="admin" className="bg-white text-slate-900">
          Admin
        </option>
      </select>
      <button type="submit" disabled={loading} className="rounded-xl bg-[color:var(--gv-accent)] px-3 py-2 text-sm font-semibold">
        {loading ? "Sending..." : "Invite"}
      </button>
      {message && <div className="text-sm text-gigaviz-muted">{message}</div>}
    </form>
  );
}
