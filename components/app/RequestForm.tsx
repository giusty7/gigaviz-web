"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  workspaceId: string;
  userId: string;
};

export function RequestForm({ workspaceId, userId }: Props) {
  const router = useRouter();
  const [appName, setAppName] = useState("");
  const [description, setDescription] = useState("");
  const [useCase, setUseCase] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!appName.trim() || !description.trim()) {
      setError("App name and description are required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/apps/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          user_id: userId,
          app_name: appName.trim(),
          description: description.trim(),
          use_case: useCase.trim() || null,
          priority,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      // Reset form
      setAppName("");
      setDescription("");
      setUseCase("");
      setPriority("medium");

      // Refresh page to show new request
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit request";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="appName" className="mb-1 block text-sm font-medium">
          App Name *
        </label>
        <input
          id="appName"
          type="text"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          placeholder="e.g., WhatsApp Scheduler"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium">
          Description *
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this app should do"
          rows={3}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          required
        />
      </div>

      <div>
        <label htmlFor="useCase" className="mb-1 block text-sm font-medium">
          Use Case (Optional)
        </label>
        <textarea
          id="useCase"
          value={useCase}
          onChange={(e) => setUseCase(e.target.value)}
          placeholder="How would you use this app?"
          rows={2}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div>
        <label htmlFor="priority" className="mb-1 block text-sm font-medium">
          Priority
        </label>
        <select
          id="priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="low">Low - Nice to have</option>
          <option value="medium">Medium - Would be useful</option>
          <option value="high">High - Really need this</option>
          <option value="critical">Critical - Blocking my workflow</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit Request"}
      </button>
    </form>
  );
}
