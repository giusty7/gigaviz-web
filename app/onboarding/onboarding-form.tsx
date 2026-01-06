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
  const initialSlug = errorSlug ? normalizeSlug(errorSlug) : "";
  const [name, setName] = useState("");
  const [slug, setSlug] = useState(initialSlug);
  const [slugEdited, setSlugEdited] = useState(Boolean(initialSlug));
  const [availability, setAvailability] = useState<
    "idle" | "available" | "taken" | "invalid" | "error"
  >("idle");
  const [checkedSlug, setCheckedSlug] = useState("");

  const message = useMemo(() => {
    if (error === "slug_taken") {
      return "Slug sudah dipakai. Pilih slug lain.";
    }
    if (error === "slug_invalid") {
      return "Slug tidak valid. Gunakan 3-32 karakter: a-z, 0-9, '-'.";
    }
    if (error === "workspace_name_required") {
      return "Nama workspace wajib diisi.";
    }
    if (error) {
      return decodeURIComponent(error);
    }
    return null;
  }, [error]);

  const slugValue = slugEdited ? slug : normalizeSlug(errorSlug ?? name);
  const slugValid = slugPattern.test(slugValue);
  const shouldCheck = Boolean(slugValue) && slugValid;
  const isChecking = shouldCheck && checkedSlug !== slugValue;
  const status: SlugStatus = !slugValue
    ? "idle"
    : !slugValid
    ? "invalid"
    : isChecking
    ? "checking"
    : availability === "invalid"
    ? "invalid"
    : availability === "idle"
    ? "checking"
    : availability;

  useEffect(() => {
    if (!shouldCheck) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/workspaces/check?slug=${encodeURIComponent(slugValue)}`,
          {
            signal: controller.signal,
          }
        );
        if (controller.signal.aborted) return;
        if (!res.ok) {
          setAvailability(res.status === 400 ? "invalid" : "error");
          setCheckedSlug(slugValue);
          return;
        }
        const payload = (await res.json()) as { available?: boolean };
        setAvailability(payload.available ? "available" : "taken");
        setCheckedSlug(slugValue);
      } catch {
        if (!controller.signal.aborted) {
          setAvailability("error");
          setCheckedSlug(slugValue);
        }
      }
    }, 400);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [shouldCheck, slugValue]);

  const suggestions = useMemo(() => {
    if (status !== "taken" || !slugValue) return [];
    const base = slugValue.slice(0, 30);
    return [`${base}-2`, `${base}-3`].map((value) =>
      normalizeSlug(value).slice(0, 32)
    );
  }, [slugValue, status]);

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
          value={slugValue}
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
