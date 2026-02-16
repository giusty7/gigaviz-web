"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MusicIcon, Sparkles, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ workspaceSlug: string }> };

const GENRES = [
  { key: "pop", label: "Pop", color: "pink" },
  { key: "rock", label: "Rock", color: "red" },
  { key: "electronic", label: "Electronic", color: "cyan" },
  { key: "ambient", label: "Ambient", color: "emerald" },
  { key: "jazz", label: "Jazz", color: "amber" },
  { key: "classical", label: "Classical", color: "purple" },
  { key: "hip-hop", label: "Hip Hop", color: "orange" },
  { key: "lo-fi", label: "Lo-Fi", color: "teal" },
  { key: "cinematic", label: "Cinematic", color: "indigo" },
  { key: "jingle", label: "Jingle", color: "yellow" },
  { key: "podcast-intro", label: "Podcast Intro", color: "blue" },
  { key: "sound-effect", label: "Sound Effect", color: "violet" },
] as const;

const FORMATS = [
  { key: "mp3", label: "MP3" },
  { key: "wav", label: "WAV" },
  { key: "ogg", label: "OGG" },
  { key: "flac", label: "FLAC" },
] as const;

const colorMap: Record<string, { base: string; selected: string; text: string }> = {
  pink: { base: "border-pink-500/20 bg-pink-500/10", selected: "border-pink-400 bg-pink-500/20 ring-1 ring-pink-400/30", text: "text-pink-400" },
  red: { base: "border-red-500/20 bg-red-500/10", selected: "border-red-400 bg-red-500/20 ring-1 ring-red-400/30", text: "text-red-400" },
  cyan: { base: "border-cyan-500/20 bg-cyan-500/10", selected: "border-cyan-400 bg-cyan-500/20 ring-1 ring-cyan-400/30", text: "text-cyan-400" },
  emerald: { base: "border-emerald-500/20 bg-emerald-500/10", selected: "border-emerald-400 bg-emerald-500/20 ring-1 ring-emerald-400/30", text: "text-emerald-400" },
  amber: { base: "border-amber-500/20 bg-amber-500/10", selected: "border-amber-400 bg-amber-500/20 ring-1 ring-amber-400/30", text: "text-amber-400" },
  purple: { base: "border-purple-500/20 bg-purple-500/10", selected: "border-purple-400 bg-purple-500/20 ring-1 ring-purple-400/30", text: "text-purple-400" },
  orange: { base: "border-orange-500/20 bg-orange-500/10", selected: "border-orange-400 bg-orange-500/20 ring-1 ring-orange-400/30", text: "text-orange-400" },
  teal: { base: "border-teal-500/20 bg-teal-500/10", selected: "border-teal-400 bg-teal-500/20 ring-1 ring-teal-400/30", text: "text-teal-400" },
  indigo: { base: "border-indigo-500/20 bg-indigo-500/10", selected: "border-indigo-400 bg-indigo-500/20 ring-1 ring-indigo-400/30", text: "text-indigo-400" },
  yellow: { base: "border-yellow-500/20 bg-yellow-500/10", selected: "border-yellow-400 bg-yellow-500/20 ring-1 ring-yellow-400/30", text: "text-yellow-400" },
  blue: { base: "border-blue-500/20 bg-blue-500/10", selected: "border-blue-400 bg-blue-500/20 ring-1 ring-blue-400/30", text: "text-blue-400" },
  violet: { base: "border-violet-500/20 bg-violet-500/10", selected: "border-violet-400 bg-violet-500/20 ring-1 ring-violet-400/30", text: "text-violet-400" },
};

export default function NewMusicPage({ params: _params }: Props) {
  const router = useRouter();
  const [genre, setGenre] = useState("ambient");
  const [title, setTitle] = useState("");
  const [description] = useState("");
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(30);
  const [bpm, setBpm] = useState(120);
  const [format, setFormat] = useState("mp3");
  const [tag, setTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTag = () => {
    const t = tag.trim().toLowerCase();
    if (t && tags.length < 10 && !tags.includes(t)) {
      setTags([...tags, t]);
      setTag("");
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/studio/tracks/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          genre,
          prompt: prompt.trim() || undefined,
          duration_seconds: duration,
          bpm,
          format,
          tags: tags.length > 0 ? tags : undefined,
        }),
      });

      if (res.ok) {
        const { data } = await res.json();
        const { workspaceSlug } = await _params;
        router.push(`/${workspaceSlug}/modules/studio/tracks/music/${data.id}`);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Failed to create track (${res.status})`);
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#f5f5dc]">New AI Music Track</h1>
        <p className="mt-1 text-sm text-[#f5f5dc]/50">
          Choose a genre and describe the audio you want to generate.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Genre Selector */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
          Genre
        </label>
        <div className="grid gap-3 grid-cols-3 sm:grid-cols-4">
          {GENRES.map((g) => {
            const isSelected = genre === g.key;
            const c = colorMap[g.color];
            return (
              <button
                key={g.key}
                onClick={() => setGenre(g.key)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all",
                  isSelected ? c.selected : "border-[#f5f5dc]/10 bg-[#0a1229]/40 hover:border-[#f5f5dc]/20"
                )}
              >
                <MusicIcon className={cn("h-4 w-4", isSelected ? c.text : "text-[#f5f5dc]/40")} />
                <span className={cn("text-[10px] font-semibold", isSelected ? "text-[#f5f5dc]" : "text-[#f5f5dc]/60")}>
                  {g.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Brand Jingle for Campaign"
          className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-4 py-2.5 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/20 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
        />
      </div>

      {/* AI Prompt */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
          AI Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the music... e.g. 'Upbeat corporate jingle with piano and light percussion, 120 BPM'"
          rows={4}
          className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-4 py-2.5 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/20 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/30 resize-none"
        />
      </div>

      {/* Duration + BPM */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
            Duration (seconds)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Math.max(5, Math.min(600, parseInt(e.target.value) || 30)))}
            min={5}
            max={600}
            className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-4 py-2.5 text-sm text-[#f5f5dc] focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
            BPM
          </label>
          <input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(Math.max(40, Math.min(300, parseInt(e.target.value) || 120)))}
            min={40}
            max={300}
            className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-4 py-2.5 text-sm text-[#f5f5dc] focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
          />
        </div>
      </div>

      {/* Format */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
          Output Format
        </label>
        <div className="flex flex-wrap gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFormat(f.key)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                format === f.key
                  ? "border-teal-400 bg-teal-500/20 text-teal-300"
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
          Tags (Optional)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="Add a tag..."
            className="flex-1 rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-4 py-2 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/20 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
          />
          <button onClick={addTag} className="rounded-lg border border-[#f5f5dc]/10 px-3 py-2 text-xs text-[#f5f5dc]/50 hover:text-[#f5f5dc]">
            Add
          </button>
        </div>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] text-teal-400">
                {t}
                <button onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-red-400">
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
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-teal-600 px-6 text-sm font-medium text-white transition-colors hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {creating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Create Track
          </>
        )}
      </button>
    </div>
  );
}
