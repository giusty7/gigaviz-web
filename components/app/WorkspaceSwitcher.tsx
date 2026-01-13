"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

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
  const supabase = useMemo(() => supabaseClient(), []);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function onChange(nextId: string) {
    setError(null);
    const res = await fetch("/api/workspaces/current", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: nextId }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload?.error || "Failed to switch workspace.");
      return;
    }

    const target = workspaces.find((ws) => ws.id === nextId);
    startTransition(() => {
      if (target) {
        router.push(`/${target.slug}/dashboard`);
      }
      router.refresh();
    });
  }

  async function onLogout() {
    if (isLoggingOut) return;
    setError(null);
    setIsLoggingOut(true);

    await supabase.auth.signOut();
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <select
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          value={currentWorkspaceId}
          onChange={(e) => onChange(e.target.value)}
          disabled={isPending || isLoggingOut}
        >
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name} - {ws.role}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-60"
        >
          {isLoggingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
      {error && <span className="text-xs text-red-300">{error}</span>}
    </div>
  );
}
