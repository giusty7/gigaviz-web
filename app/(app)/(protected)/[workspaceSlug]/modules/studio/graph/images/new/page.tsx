"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ImageIcon, Sparkles, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ workspaceSlug: string }> };

const STYLES = [
  { key: "photo-realistic", label: "Photo Realistic", color: "blue" },
  { key: "illustration", label: "Illustration", color: "purple" },
  { key: "3d-render", label: "3D Render", color: "cyan" },
  { key: "watercolor", label: "Watercolor", color: "emerald" },
  { key: "pixel-art", label: "Pixel Art", color: "amber" },
  { key: "abstract", label: "Abstract", color: "pink" },
  { key: "flat-design", label: "Flat Design", color: "teal" },
  { key: "anime", label: "Anime", color: "rose" },
  { key: "logo", label: "Logo", color: "indigo" },
  { key: "icon", label: "Icon", color: "violet" },
] as const;

const FORMATS = [
  { key: "png", label: "PNG" },
  { key: "jpg", label: "JPG" },
  { key: "webp", label: "WebP" },
  { key: "svg", label: "SVG" },
] as const;

const colorMap: Record<string, { base: string; selected: string; text: string }> = {
  blue: { base: "border-blue-500/20 bg-blue-500/10", selected: "border-blue-400 bg-blue-500/20 ring-1 ring-blue-400/30", text: "text-blue-400" },
  purple: { base: "border-purple-500/20 bg-purple-500/10", selected: "border-purple-400 bg-purple-500/20 ring-1 ring-purple-400/30", text: "text-purple-400" },
  cyan: { base: "border-cyan-500/20 bg-cyan-500/10", selected: "border-cyan-400 bg-cyan-500/20 ring-1 ring-cyan-400/30", text: "text-cyan-400" },
  emerald: { base: "border-emerald-500/20 bg-emerald-500/10", selected: "border-emerald-400 bg-emerald-500/20 ring-1 ring-emerald-400/30", text: "text-emerald-400" },
  amber: { base: "border-amber-500/20 bg-amber-500/10", selected: "border-amber-400 bg-amber-500/20 ring-1 ring-amber-400/30", text: "text-amber-400" },
  pink: { base: "border-pink-500/20 bg-pink-500/10", selected: "border-pink-400 bg-pink-500/20 ring-1 ring-pink-400/30", text: "text-pink-400" },
  teal: { base: "border-teal-500/20 bg-teal-500/10", selected: "border-teal-400 bg-teal-500/20 ring-1 ring-teal-400/30", text: "text-teal-400" },
  rose: { base: "border-rose-500/20 bg-rose-500/10", selected: "border-rose-400 bg-rose-500/20 ring-1 ring-rose-400/30", text: "text-rose-400" },
  indigo: { base: "border-indigo-500/20 bg-indigo-500/10", selected: "border-indigo-400 bg-indigo-500/20 ring-1 ring-indigo-400/30", text: "text-indigo-400" },
  violet: { base: "border-violet-500/20 bg-violet-500/10", selected: "border-violet-400 bg-violet-500/20 ring-1 ring-violet-400/30", text: "text-violet-400" },
};

export default function NewImagePage({ params: _params }: Props) {
  const t = useTranslations("studio");
  const router = useRouter();
  const [style, setStyle] = useState("photo-realistic");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [format, setFormat] = useState("png");
  const [tag, setTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTag = () => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && tags.length < 10 && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTag("");
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/studio/graph/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          style,
          prompt: prompt.trim() || undefined,
          format,
          tags: tags.length > 0 ? tags : undefined,
        }),
      });

      if (res.ok) {
        const { data } = await res.json();
        const { workspaceSlug } = await _params;
        const detailUrl = `/${workspaceSlug}/modules/studio/graph/images/${data.id}`;

        // Auto-trigger AI generation if prompt was provided
        if (prompt.trim()) {
          fetch("/api/studio/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "image",
              entityId: data.id,
              prompt: prompt.trim(),
              style,
            }),
          }).catch(() => {}); // Fire-and-forget
        }

        router.push(detailUrl);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Failed to create image (${res.status})`);
      }
    } catch {
      setError(t("common.networkError"));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#f5f5dc]">{t("images.new.title")}</h1>
        <p className="mt-1 text-sm text-[#f5f5dc]/50">
          {t("images.new.description")}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Style Selector */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
          {t("images.new.styleLabel")}
        </label>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
          {STYLES.map((s) => {
            const isSelected = style === s.key;
            const c = colorMap[s.color];
            return (
              <button
                key={s.key}
                onClick={() => setStyle(s.key)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all",
                  isSelected ? c.selected : "border-[#f5f5dc]/10 bg-[#0a1229]/40 hover:border-[#f5f5dc]/20"
                )}
              >
                <ImageIcon className={cn("h-5 w-5", isSelected ? c.text : "text-[#f5f5dc]/40")} />
                <span className={cn("text-[10px] font-semibold", isSelected ? "text-[#f5f5dc]" : "text-[#f5f5dc]/60")}>
                  {t(`images.new.styles.${s.key}`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
          {t("images.new.titleLabel")}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("images.new.titlePlaceholder")}
          className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-4 py-2.5 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/20 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
        />
      </div>

      {/* AI Prompt */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
          {t("images.new.aiPromptLabel")}
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t("images.new.aiPromptPlaceholder")}
          rows={4}
          className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-4 py-2.5 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/20 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30 resize-none"
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
          {t("images.new.descriptionLabel")}
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("images.new.descriptionPlaceholder")}
          className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-4 py-2.5 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/20 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
        />
      </div>

      {/* Format */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
          {t("images.new.formatLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFormat(f.key)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                format === f.key
                  ? "border-purple-400 bg-purple-500/20 text-purple-300"
                  : "border-[#f5f5dc]/10 bg-[#0a1229]/40 text-[#f5f5dc]/50 hover:border-[#f5f5dc]/20"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
          {t("common.tagsOptionalLabel")}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder={t("common.tagPlaceholder")}
            className="flex-1 rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-4 py-2 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/20 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
          />
          <button onClick={addTag} className="rounded-lg border border-[#f5f5dc]/10 px-3 py-2 text-xs text-[#f5f5dc]/50 hover:text-[#f5f5dc]">
            {t("common.addButton")}
          </button>
        </div>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((tagItem) => (
              <span key={tagItem} className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-400">
                {tagItem}
                <button onClick={() => setTags(tags.filter((x) => x !== tagItem))} className="hover:text-red-400">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Create Button */}
      <button
        onClick={handleCreate}
        disabled={!title.trim() || creating}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-purple-600 px-6 text-sm font-medium text-white transition-colors hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {creating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("common.creating")}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {t("images.new.createButton")}
          </>
        )}
      </button>
    </div>
  );
}
