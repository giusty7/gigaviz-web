"use client";

import { useState } from "react";

export function CopyButton({
  text,
  label = "Copy",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // fallback: prompt
      window.prompt("Copy teks ini:", text);
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className={
        "rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 " +
        className
      }
      title={text}
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
