"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

type OnboardingFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  error?: string | null;
  errorSlug?: string | null;
};

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "error";

function normalizeSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 32);
}

const slugPattern = /^[a-z0-9-]{3,32}$/;

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      className="w-full rounded-xl bg-cyan-500/90 hover:bg-cyan-400 text-black font-semibold py-2 disabled:opacity-60"
      disabled={disabled || pending}
    >
      {pending ? "Membuat..." : "Lanjutkan"}
    </button>
  );
}

export default function OnboardingForm({
  action,
  error,
  errorSlug,
}: OnboardingFormProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [status, setStatus] = useState<SlugStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (error === "slug_taken") {
      setMessage("Slug sudah dipakai. Pilih slug lain.");
    } else if (error === "slug_invalid") {
      setMessage("Slug tidak valid. Gunakan 3-32 karakter: a-z, 0-9, '-'.");
    } else if (error === "workspace_name_required") {
      setMessage("Nama workspace wajib diisi.");
    } else if (error) {
      setMessage(decodeURIComponent(error));
    } else {
      setMessage(null);
    }
  }, [error]);

  useEffect(() => {
    if (errorSlug) {
      setSlug(normalizeSlug(errorSlug));
      setSlugEdited(true);
      setStatus("taken");
    }
  }, [errorSlug]);

  useEffect(() => {
    if (!slugEdited) {
      setSlug(normalizeSlug(name));
    }
  }, [name, slugEdited]);

  useEffect(() => {
    const normalized = normalizeSlug(slug);
    if (slug !== normalized) {
      setSlug(normalized);
      return;
    }

    if (!slug) {
      setStatus("idle");
      return;
    }

    if (!slugPattern.test(slug)) {
      setStatus("invalid");
      return;
    }

    setStatus("checking");
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/workspaces/check?slug=${encodeURIComponent(slug)}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          setStatus(res.status === 400 ? "invalid" : "error");
          return;
        }
        const payload = (await res.json()) as { available?: boolean };
        setStatus(payload.available ? "available" : "taken");
      } catch (err) {
        if (!controller.signal.aborted) {
          setStatus("error");
        }
      }
    }, 400);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [slug]);

  const suggestions = useMemo(() => {
    if (status !== "taken" || !slug) return [];
    const base = slug.slice(0, 30);
    return [`${base}-2`, `${base}-3`].map((value) =>
      normalizeSlug(value).slice(0, 32)
    );
  }, [slug, status]);

  const statusLabel =
    status === "available"
      ? "Tersedia"
      : status === "taken"
      ? "Sudah dipakai"
      : status === "checking"
      ? "Memeriksa..."
      : status === "invalid"
      ? "Slug tidak valid"
      : status === "error"
      ? "Gagal cek slug"
      : "";

  const statusClass =
    status === "available"
      ? "text-emerald-300"
      : status === "taken" || status === "invalid" || status === "error"
      ? "text-red-300"
      : "text-white/60";

  const canSubmit = status === "available";

  return (
    <form action={action} className="mt-6 space-y-4">
      {message && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
          {message}
        </div>
      )}

      <div>
        <label className="text-white/80 text-sm">Nama Workspace</label>
        <input
          name="workspace_name"
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
          placeholder="Contoh: Gigaviz Studio"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugEdited) setSlug(normalizeSlug(e.target.value));
          }}
          required
        />
      </div>

      <div>
        <label className="text-white/80 text-sm">Slug Workspace</label>
        <input
          name="workspace_slug"
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
          placeholder="contoh: gigaviz-studio"
          value={slug}
          onChange={(e) => {
            setSlug(normalizeSlug(e.target.value));
            setSlugEdited(true);
          }}
        />
        {statusLabel && (
          <div className={`mt-2 text-xs ${statusClass}`}>{statusLabel}</div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
          Saran slug:
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((value) => (
              <button
                key={value}
                type="button"
                className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs text-white hover:bg-white/10"
                onClick={() => {
                  setSlug(value);
                  setSlugEdited(true);
                }}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      )}

      <SubmitButton disabled={!canSubmit} />
    </form>
  );
}
