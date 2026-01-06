"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function LoginClient() {
  const sp = useSearchParams();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const nextPath = sp.get("next") || "/app";
  const error = sp.get("error");

  const errorMsg = useMemo(
    () => (error ? decodeURIComponent(error) : null),
    [error]
  );
  const displayMsg = msg ?? errorMsg;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const res = await fetch("/api/auth/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), next: nextPath }),
    });

    setLoading(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setMsg(payload?.error || "Gagal mengirim magic link.");
      return;
    }

    setMsg("Magic link dikirim. Cek email untuk login.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#070B18]">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white">Masuk ke Gigaviz</h1>
          <p className="text-white/70 text-sm">
            Login dengan magic link atau OAuth untuk akses App Area.
          </p>
        </div>

        {displayMsg && (
          <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
            {displayMsg}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-white/80 text-sm">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              required
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-cyan-500/90 hover:bg-cyan-400 text-black font-semibold py-2 disabled:opacity-60"
          >
            {loading ? "Mengirim..." : "Kirim Magic Link"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-white/50">
          <div className="h-px flex-1 bg-white/10" />
          <span>atau lanjutkan dengan</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="space-y-2">
          <a
            href={`/api/auth/oauth?provider=google&next=${encodeURIComponent(nextPath)}`}
            className="block w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-sm text-white hover:bg-white/10"
          >
            Lanjutkan dengan Google
          </a>
          <a
            href={`/api/auth/oauth?provider=facebook&next=${encodeURIComponent(nextPath)}`}
            className="block w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-sm text-white hover:bg-white/10"
          >
            Lanjutkan dengan Facebook
          </a>
        </div>
      </div>
    </div>
  );
}
