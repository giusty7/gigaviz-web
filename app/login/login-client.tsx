"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

export default function LoginClient() {
  const supabase = useMemo(() => supabaseClient(), []);
  const sp = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const nextParam = sp.get("next");
  const nextSafe = nextParam && nextParam.startsWith("/") ? nextParam : "/app";
  const error = sp.get("error");

  const errorMsg = useMemo(
    () => (error ? decodeURIComponent(error) : null),
    [error]
  );
  const displayMsg = msg ?? errorMsg;

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (data.user) {
        router.replace(nextSafe || "/app");
      }
    });
    return () => {
      active = false;
    };
  }, [supabase, router, nextSafe]);

  async function sendOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });

    setLoading(false);

    if (error) {
      const lower = error.message.toLowerCase();
      if (
        lower.includes("signup") ||
        lower.includes("sign up") ||
        lower.includes("not allowed") ||
        lower.includes("not found")
      ) {
        setMsg("Email belum terdaftar. Silakan klik Mulai untuk daftar.");
        return;
      }
      setMsg(error.message);
      return;
    }

    setStep("otp");
    setMsg("Kode OTP sudah dikirim ke email Anda.");
  }

  async function verifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);

    const sanitized = code.replace(/\D+/g, "");
    if (sanitized.length < 6 || sanitized.length > 10) {
      setMsg("Kode OTP harus 6-10 digit.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: sanitized,
      type: "email",
    });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    router.replace(nextSafe || "/app");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#070B18]">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white">Masuk ke Gigaviz</h1>
          <p className="text-white/70 text-sm">
            Login dengan OTP atau OAuth untuk akses App Area.
          </p>
        </div>

        {displayMsg && (
          <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
            {displayMsg}
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={sendOtp} className="space-y-3">
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
              {loading ? "Mengirim..." : "Kirim OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-3">
            <div>
              <label className="text-white/80 text-sm">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
                value={email}
                readOnly
              />
            </div>
            <div>
              <label className="text-white/80 text-sm">Kode OTP</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none tracking-[0.3em] text-center"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D+/g, "").slice(0, 10))}
                placeholder="------"
                required
              />
            </div>

            <button
              disabled={loading}
              className="w-full rounded-xl bg-cyan-500/90 hover:bg-cyan-400 text-black font-semibold py-2 disabled:opacity-60"
            >
              {loading ? "Memverifikasi..." : "Verifikasi OTP"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setMsg(null);
              }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
            >
              Ganti email
            </button>
          </form>
        )}

        <div className="my-4 flex items-center gap-3 text-xs text-white/50">
          <div className="h-px flex-1 bg-white/10" />
          <span>atau lanjutkan dengan</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="space-y-2">
          <a
            href={`/api/auth/oauth?provider=google&next=${encodeURIComponent(nextSafe)}`}
            className="block w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-sm text-white hover:bg-white/10"
          >
            Lanjutkan dengan Google
          </a>
          <a
            href={`/api/auth/oauth?provider=facebook&next=${encodeURIComponent(nextSafe)}`}
            className="block w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-sm text-white hover:bg-white/10"
          >
            Lanjutkan dengan Facebook
          </a>
        </div>

        <div className="mt-5 text-center text-xs text-white/60">
          Belum punya akun?{" "}
          <a href="/get-started" className="text-white hover:underline">
            Mulai di sini
          </a>
        </div>
      </div>
    </div>
  );
}
