"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

interface CreateLinkPageProps {
  workspaceSlug: string;
}

export function CreateLinkPage({ workspaceSlug }: CreateLinkPageProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = `/${workspaceSlug}/links`;

  const autoSlug = (t: string) =>
    t
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60);

  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!slug || slug === autoSlug(title)) {
      setSlug(autoSlug(v));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/links/pages?workspace_id=${workspaceSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), slug: slug.trim(), bio: bio.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error === "slug_taken" ? "This slug is already taken. Try another." : json.error ?? "Failed to create page");
        setSaving(false);
        return;
      }
      router.push(`${base}/pages/${json.page.id}`);
    } catch {
      setError("Network error");
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={base}
          className="rounded-lg p-1.5 text-[#f5f5dc]/40 transition hover:bg-[#f5f5dc]/[0.04] hover:text-[#f5f5dc]/70"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-[#f5f5dc] tracking-tight">Create Link Page</h1>
          <p className="text-[11px] text-[#f5f5dc]/40">Set up your bio page — you can add links after.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-[11px] font-medium text-[#f5f5dc]/50 mb-1">Page Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="My Store"
            className="w-full rounded-lg border border-[#f5f5dc]/[0.08] bg-[#f5f5dc]/[0.02] px-3 py-2 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/20 focus:border-[#d4af37]/40 focus:outline-none focus:ring-1 focus:ring-[#d4af37]/20"
            maxLength={100}
            required
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-[11px] font-medium text-[#f5f5dc]/50 mb-1">
            URL Slug <span className="text-[#f5f5dc]/25">— yoursite.com/l/{slug || "..."}</span>
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            placeholder="my-store"
            className="w-full rounded-lg border border-[#f5f5dc]/[0.08] bg-[#f5f5dc]/[0.02] px-3 py-2 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/20 focus:border-[#d4af37]/40 focus:outline-none focus:ring-1 focus:ring-[#d4af37]/20 font-mono"
            maxLength={60}
            required
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-[11px] font-medium text-[#f5f5dc]/50 mb-1">Bio (optional)</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Short description about you or your business"
            rows={2}
            className="w-full rounded-lg border border-[#f5f5dc]/[0.08] bg-[#f5f5dc]/[0.02] px-3 py-2 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/20 focus:border-[#d4af37]/40 focus:outline-none focus:ring-1 focus:ring-[#d4af37]/20 resize-none"
            maxLength={300}
          />
        </div>

        {error && (
          <p className="text-[11px] text-red-400 bg-red-500/5 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving || !title.trim() || !slug.trim()}
          className="w-full rounded-lg bg-[#d4af37] px-4 py-2.5 text-sm font-semibold text-[#050a18] transition hover:bg-[#d4af37]/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Create Page
        </button>
      </form>
    </div>
  );
}
