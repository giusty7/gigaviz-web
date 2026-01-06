"use client";

import { useEffect, useRef, useState } from "react";

type MediaKitCopyProps = {
  title: string;
  text: string;
};

export default function MediaKitCopyBlock({ title, text }: MediaKitCopyProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!copied) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => setCopied(false), 2000);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [copied]);

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        return;
      }
    } catch {
      // fall through to legacy copy
    }

    try {
      const temp = document.createElement("textarea");
      temp.value = text;
      temp.setAttribute("readonly", "true");
      temp.style.position = "absolute";
      temp.style.left = "-9999px";
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      document.body.removeChild(temp);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-[color:var(--gv-text)]">
          {title}
        </h3>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center rounded-2xl border border-[color:var(--gv-border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
        >
          {copied ? "Disalin" : "Copy"}
        </button>
      </div>
      <p className="mt-3 text-sm text-[color:var(--gv-muted)] leading-relaxed whitespace-pre-line">
        {text}
      </p>
      <span className="sr-only" aria-live="polite">
        {copied ? "Teks berhasil disalin" : ""}
      </span>
    </div>
  );
}
