"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type WorkspaceItem = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

type WorkspaceSwitcherProps = {
  workspaces: WorkspaceItem[];
  currentWorkspaceId: string;
};

export default function WorkspaceSwitcher({
  workspaces,
  currentWorkspaceId,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onChange(nextId: string) {
    setError(null);
    const res = await fetch("/api/workspaces/current", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: nextId }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload?.error || "Gagal mengganti workspace.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
        value={currentWorkspaceId}
        onChange={(e) => onChange(e.target.value)}
        disabled={isPending}
      >
        {workspaces.map((ws) => (
          <option key={ws.id} value={ws.id}>
            {ws.name} - {ws.role}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-300">{error}</span>}
    </div>
  );
}
